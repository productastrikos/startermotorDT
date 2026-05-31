/**
 * EngineModel3D
 *
 * Lean 3D engine viewer with hotspot markers overlaid on individual
 * components. Each page provides its own hotspot list (per-page metrics,
 * thresholds, status colors).
 *
 * The engine mesh inside the inner <group> rotates with Ngg RPM; the
 * hotspots and labels live OUTSIDE that group so they stay stationary
 * and readable while the engine spins beneath them.
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CycleTraceSample } from '../types/engine';
import { useGTSUStore } from '../store/useGTSUStore';

const MODEL_PATH = '/turboShaftEngine.glb';
const MAX_RPM = 22000;

// ── Hotspot model ───────────────────────────────────────────────────────

export type HotspotSeverity = 'good' | 'warn' | 'orange' | 'bad';

export interface EngineHotspot {
  id:        string;
  position:  [number, number, number];     // world coords in the normalized engine frame
  label:     string;
  value:     string;                       // primary readout, e.g. "78%"
  metric?:   string;                       // optional secondary line, e.g. "wear · 870 hrs left"
  severity:  HotspotSeverity;
  delta?:    string;                       // optional small badge, e.g. "+4.2%"
  deltaTone?:'good' | 'bad';
}

const SEV_COLOR: Record<HotspotSeverity, string> = {
  good:   '#16a34a',
  warn:   '#eab308',
  orange: '#f97316',
  bad:    '#dc2626',
};

// ── WebGL detection ─────────────────────────────────────────────────────

const HAS_WEBGL: boolean = (() => {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    return !!ctx;
  } catch { return false; }
})();

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <WebGLUnavailable /> : this.props.children; }
}

/** Silently swallows errors from Environment HDR loading (e.g. CDN offline). */
class EnvBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function WebGLUnavailable() {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 8,
      background: 'rgba(8,14,22,0.96)', fontFamily: "'Courier New', monospace",
    }}>
      <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>
        3D RENDERER UNAVAILABLE
      </div>
      <div style={{ color: '#8ca0b6', fontSize: 11, textAlign: 'center', maxWidth: 360 }}>
        Enable hardware acceleration in browser settings and reload.
      </div>
    </div>
  );
}

// ── Engine mesh (selective rotation) ───────────────────────────────────

/** Parts that spin with the gas-generator shaft (Ngg).
 *  Only thin blade discs (extZ ≈ 6-11 units) + shaft.
 *  compressor_0 (extZ=134 casing drum) and hp_turbine_0 (extZ=147 casing) are
 *  housing geometry and must stay static. */
const ROTOR_NAMES = new Set([
  'power_turbine_0',
  'output_shaft_0',
  'compressor_1',  'compressor_2',  'compressor_3',
  'compressor_4',  'compressor_5',  'compressor_6',  'compressor_7',
  'compressor_8',  'compressor_9',  'compressor_10', 'compressor_11',
]);

// ── Per-node health-status colouring ────────────────────────────────
// Each mapped part always shows its health when the simulation is running.
//   0 = ok       → green  (nominal / healthy)
//   1 = warn     → amber  (approaching limit)
//   2 = caution  → orange (at limit)
//   3 = alert    → red    (exceeded limit)
// When frame is null (simulation stopped) every part fades to dark.
const SEV_EMISSIVE: [number, number, number, number][] = [
  [0.00, 0.80, 0.20, 0.45], // 0 ok      – green   (clearly visible)
  [0.85, 0.55, 0.00, 0.65], // 1 warn    – amber
  [1.00, 0.28, 0.00, 0.80], // 2 caution – orange
  [1.00, 0.00, 0.00, 1.00], // 3 alert   – red
];
const DARK: [number, number, number, number] = [0, 0, 0, 0];

type Sev = 0 | 1 | 2 | 3;
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ── Turbine / hot-section: JPT1 temperature ──────────────────────────
// Normal light-up peak ≈ 650–750 °C  →  green
// Above normal peak                  →  escalate to red
function jptHealthSev(jpt1: number): Sev {
  if (jpt1 > 950) return 3;   // critical overtemp / hot start
  if (jpt1 > 850) return 2;   // hot start zone
  if (jpt1 > 750) return 1;   // above normal peak
  return 0;                    // normal operating range
}

// ── Compressor blades: Ngg shaft speed ───────────────────────────────
// Any spin in the normal range → green; flag only near/over speed limit
function nggHealthSev(pct: number): Sev {
  if (pct > 98) return 3;    // overspeed
  if (pct > 93) return 2;    // near overspeed
  if (pct > 88) return 1;    // above nominal target
  return 0;                   // healthy speed range
}

// ── Compressor casing / inlet: pressure ratio ─────────────────────────
// Gate on Ngg so we don't penalise naturally-low P2/P1 during cranking.
function p2p1HealthSev(f: CycleTraceSample): Sev {
  if (f.nggPct < 20) return 0;   // cranking — pressure not yet expected
  if (f.p2p1 >= 1.5)  return 0;  // good compression
  if (f.p2p1 >= 1.1)  return 1;  // building / mildly low
  if (f.p2p1 >= 0.8)  return 2;  // stall developing
  return 3;                       // severe stall / no compression
}

// ── Shaft / gearbox: vibration ────────────────────────────────────────
function vibHealthSev(vib: number): Sev {
  if (vib > 5.0) return 3;
  if (vib > 3.0) return 2;
  if (vib > 1.5) return 1;
  return 0;
}

/** Maps each GLB node to its health-status function.
 *  Only rotating parts (ROTOR_NAMES) are included — static casings stay grey. */
const NODE_SEV: Record<string, (f: CycleTraceSample) => Sev> = {
  // Power turbine disc — temperature (hot section rotor)
  'power_turbine_0': f => jptHealthSev(f.jpt1),
  // Output shaft — vibration
  'output_shaft_0':  f => vibHealthSev(f.vibration),
  // Compressor blade discs — shaft speed
  'compressor_1':    f => nggHealthSev(f.nggPct),
  'compressor_2':    f => nggHealthSev(f.nggPct),
  'compressor_3':    f => nggHealthSev(f.nggPct),
  'compressor_4':    f => nggHealthSev(f.nggPct),
  'compressor_5':    f => nggHealthSev(f.nggPct),
  'compressor_6':    f => nggHealthSev(f.nggPct),
  'compressor_7':    f => nggHealthSev(f.nggPct),
  'compressor_8':    f => nggHealthSev(f.nggPct),
  'compressor_9':    f => nggHealthSev(f.nggPct),
  'compressor_10':   f => nggHealthSev(f.nggPct),
  'compressor_11':   f => nggHealthSev(f.nggPct),
};

// Per-node lerp state (persists across renders for smooth transitions)
const _nodeLerp = new Map<string, [number,number,number,number]>();
const LERP_SPEED = 3; // units per second

function EngineMesh({ frame }: { frame: CycleTraceSample | null }) {
  const { scene } = useGLTF(MODEL_PATH);

  /**
   * A single pivot Group positioned exactly at the shaft centre-line.
   * Rotating this group around X makes all rotor children spin in place.
   */
  const pivotRef = useRef<THREE.Group | null>(null);

  const normalized = useMemo(() => {
    const root = scene.clone();

    // ── 1. Normalise scale + centre ──────────────────────────────────
    const box    = new THREE.Box3().setFromObject(root);
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s      = 2.6 / maxDim;
    root.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    root.position.sub(center);

    // Flush world matrices so worldToLocal / getWorldPosition are accurate
    root.updateWorldMatrix(true, true);

    // ── 2. Apply materials ────────────────────────────────────────────
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      // Clone every material so each mesh owns a private instance.
      // scene.clone() shares material references — without this, setting
      // emissive on one mesh would change the colour of every mesh that
      // uses the same material object.
      const srcMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const ownMats = srcMats.map(m => {
        const c = (m as THREE.MeshStandardMaterial).clone();
        c.emissive          = new THREE.Color(0x000000);
        c.emissiveIntensity = 0;
        c.metalness         = 0.7;
        c.roughness         = 0.35;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? ownMats : ownMats[0];
    });

    // ── 3. Collect rotor nodes (snapshot – tree will be mutated next) ─
    const rotorObjs: THREE.Object3D[] = [];
    root.traverse(obj => { if (ROTOR_NAMES.has(obj.name)) rotorObjs.push(obj); });

    if (rotorObjs.length > 0) {
      // ── 4. Shaft centre = combined bbox of all rotor geometry ───────
      //   (in world space, which equals the normalised engine space here)
      const shaftBox = new THREE.Box3();
      rotorObjs.forEach(o => shaftBox.expandByObject(o));
      const shaftWorldCenter = shaftBox.getCenter(new THREE.Vector3());

      // ── 5. Create pivot at shaft centre ──────────────────────────────
      const pivot = new THREE.Group();
      // Convert world shaft centre to root's local space
      pivot.position.copy(root.worldToLocal(shaftWorldCenter.clone()));
      root.add(pivot);
      pivot.updateWorldMatrix(true, true);   // pivot matrix is now up-to-date

      // ── 6. Reparent rotors into pivot, preserving world positions ────
      for (const obj of rotorObjs) {
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);             // record world pos before removal

        obj.parent?.remove(obj);
        pivot.add(obj);

        // Place node so it occupies the same world position inside the pivot
        obj.position.copy(pivot.worldToLocal(wp));
        // quaternion stays identity – no change needed
      }

      // Give the pivot a stable name so we can find it after render
      // (avoids setting pivotRef inside useMemo, which breaks in React 18
      //  StrictMode because useMemo double-invokes and the ref ends up
      //  pointing to a pivot in the discarded second tree)
      pivot.name = '__shaft_pivot__';
    }

    return root;
  }, [scene]);

  // Sync the pivot ref AFTER the normalised tree is committed to the scene.
  // useEffect is safe here: it runs after React commits, so `normalized`
  // is the tree that R3F will actually render via <primitive>.
  useEffect(() => {
    pivotRef.current =
      (normalized.getObjectByName('__shaft_pivot__') as THREE.Group) ?? null;
    return () => { pivotRef.current = null; };
  }, [normalized]);

  useFrame((state, delta) => {
    const isPlaying = useGTSUStore.getState().consoleIsPlaying;
    const rpm       = isPlaying ? (frame?.ngg ?? 0) : 0;
    const radPerSec = (rpm / MAX_RPM) * 8 * Math.PI;

    // Spin only the rotor assembly; stop immediately when simulation pauses/ends
    if (pivotRef.current) {
      pivotRef.current.rotation.z += radPerSec * delta;
    }

    // Pulse multiplier for non-ok states: slow breathing effect (0.7–1.0)
    const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3.5) * 0.15;

    // Per-node status colouring — lerp toward target severity colour
    normalized.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      const sevFn = NODE_SEV[obj.name];
      const sev   = (frame && sevFn) ? sevFn(frame) : -1;
      // -1 = no frame / unmapped → fade to dark
      const target = sev >= 0 ? SEV_EMISSIVE[sev] : DARK;

      // Initialise lerp state on first encounter
      if (!_nodeLerp.has(obj.name)) _nodeLerp.set(obj.name, [0,0,0,0]);
      const cur = _nodeLerp.get(obj.name)!;
      const t   = clamp01(LERP_SPEED * delta);
      cur[0] += (target[0] - cur[0]) * t;
      cur[1] += (target[1] - cur[1]) * t;
      cur[2] += (target[2] - cur[2]) * t;
      cur[3] += (target[3] - cur[3]) * t;

      // Apply pulse only on warn/caution/alert so green stays steady
      const intensityMod = sev > 0 ? pulse : 1.0;

      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => {
        const std = m as THREE.MeshStandardMaterial;
        if ('emissive' in std) {
          std.emissive.setRGB(cur[0], cur[1], cur[2]);
          std.emissiveIntensity = cur[3] * intensityMod;
        }
      });
    });
  });

  return <primitive object={normalized} />;
}

// ── Hotspot pulse (per-marker animated dot) ─────────────────────────────

function HotspotMarker({
  hotspot, hovered, onHover, onClick,
}: {
  hotspot: EngineHotspot;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick?: (id: string) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 3) * 0.18;
    ringRef.current.scale.setScalar(s);
  });

  const color = SEV_COLOR[hotspot.severity];

  return (
    <group position={hotspot.position}>
      {/* Core dot */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(hotspot.id); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick?.(hotspot.id); }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Label card */}
      <Html position={[0.08, 0.12, 0]} distanceFactor={6} occlude={false} zIndexRange={[10, 0]}>
        <div
          style={{
            pointerEvents: 'none',
            background: 'rgba(8,12,18,0.92)',
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: hovered ? '6px 10px' : '4px 8px',
            fontFamily: 'monospace',
            transform: 'translate(0, -100%)',
            whiteSpace: 'nowrap',
            transition: 'padding 0.15s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: 7, fontWeight: 700, color: '#afc3d8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {hotspot.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{hotspot.value}</span>
            {hotspot.delta && (
              <span style={{
                fontSize: 7, fontWeight: 700,
                color: hotspot.deltaTone === 'bad' ? '#dc2626' : '#16a34a',
              }}>{hotspot.delta}</span>
            )}
          </div>
          {hovered && hotspot.metric && (
            <div style={{ fontSize: 7, color: '#8ca0b6', marginTop: 3, maxWidth: 180, whiteSpace: 'normal' }}>
              {hotspot.metric}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ── Scene ───────────────────────────────────────────────────────────────

function Scene({
  frame, hotspots, onHotspotClick,
}: {
  frame: CycleTraceSample | null;
  hotspots?: EngineHotspot[];
  onHotspotClick?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#5fa8ff" />

      {/* Environment HDR — silently skipped if CDN is unreachable */}
      <EnvBoundary>
        <Suspense fallback={null}>
          <Environment preset="warehouse" />
        </Suspense>
      </EnvBoundary>

      {/* Engine mesh — separate suspense so a missing HDR doesn't block it */}
      <Suspense fallback={null}>
        <group>
          <EngineMesh frame={frame} />
        </group>
      </Suspense>

      {hotspots?.map((h) => (
        <HotspotMarker
          key={h.id}
          hotspot={h}
          hovered={hovered === h.id}
          onHover={setHovered}
          onClick={onHotspotClick}
        />
      ))}

      <gridHelper args={[8, 16, 0x223344, 0x14202c]} position={[0, -1.4, 0]} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2.2} maxDistance={9} />
    </>
  );
}

// ── Public component ───────────────────────────────────────────────────

export interface EngineModel3DProps {
  frame:          CycleTraceSample | null;
  hotspots?:      EngineHotspot[];
  onHotspotClick?: (id: string) => void;
  /** Camera position. Default fits the full engine + hotspots. */
  cameraPosition?: [number, number, number];
}

export function EngineModel3D({ frame, hotspots, onHotspotClick, cameraPosition }: EngineModel3DProps) {
  if (!HAS_WEBGL) return <WebGLUnavailable />;
  return (
    <WebGLBoundary>
      <Canvas
        camera={{ position: cameraPosition ?? [3.6, 2.2, 3.8], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: 'radial-gradient(ellipse at center, #0e1822 0%, #06090d 80%)' }}
      >
        <Scene frame={frame} hotspots={hotspots} onHotspotClick={onHotspotClick} />
      </Canvas>
    </WebGLBoundary>
  );
}

// ── Legend component for use beside the canvas ──────────────────────────

export function HotspotLegend({ items }: { items: EngineHotspot[] }) {
  if (!items.length) return null;
  const grouped = {
    good:   items.filter(h => h.severity === 'good').length,
    warn:   items.filter(h => h.severity === 'warn').length,
    orange: items.filter(h => h.severity === 'orange').length,
    bad:    items.filter(h => h.severity === 'bad').length,
  };
  return (
    <div style={{ display: 'flex', gap: 10, padding: '6px 10px', fontFamily: 'monospace', fontSize: 10 }}>
      {(['good', 'warn', 'orange', 'bad'] as const).map(sev => (
        <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: SEV_COLOR[sev] }} />
          <span style={{ color: '#afc3d8' }}>
            {sev === 'good' ? 'OK' : sev === 'warn' ? 'WARN' : sev === 'orange' ? 'DEGRADED' : 'CRITICAL'} · {grouped[sev]}
          </span>
        </div>
      ))}
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
