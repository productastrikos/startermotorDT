import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { useGTSUStore } from "../store/useGTSUStore";

const MAX_NGG_RPM = 22000;
const JPT_GROUND_LIMIT = 900;

// ── Props kept for backward-compat (OverviewPage calls with no props) ──────
export interface ComponentStatus {
  id: string;
  name: string;
  status: "normal" | "warning" | "critical";
  temperature: number;
  efficiency: number;
  position?: [number, number, number];
}

interface EngineDigitalTwinProps {
  components?: ComponentStatus[];
  showTemperature?: boolean;
  showEfficiency?: boolean;
  title?: string;
  modelUrl?: string;
}

// ── Color palette matching dashboard theme ────────────────────────────────
const STATUS_COLORS = {
  critical: { border: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.12)", glow: "#ef4444" },
  warning:  { border: "#f59e0b", text: "#f59e0b", bg: "rgba(245,158,11,0.12)", glow: "#f59e0b" },
  normal:   { border: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.12)", glow: "#10b981" },
} as const;

// ── Single HUD telemetry card ─────────────────────────────────────────────
function HudCard({
  label,
  value,
  unit,
  sublabel,
  status,
}: {
  label: string;
  value: string;
  unit: string;
  sublabel?: string;
  status: "normal" | "warning" | "critical";
}) {
  const c = STATUS_COLORS[status];
  return (
    <div
      style={{
        background: "rgba(4,7,18,0.90)",
        border: `1.5px solid ${c.border}`,
        borderRadius: 7,
        padding: "5px 10px",
        minWidth: 100,
        boxShadow: `0 0 14px ${c.bg}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* status dot + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.glow,
            display: "inline-block",
            boxShadow: `0 0 6px ${c.glow}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 8,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      {/* main value */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: c.text,
          lineHeight: 1.15,
          fontFamily: "'Courier New', monospace",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 3, color: "#6b7280" }}>
            {unit}
          </span>
        )}
      </div>
      {/* sub-label */}
      {sublabel && (
        <div style={{ fontSize: 8.5, color: "#4b5563", marginTop: 2, whiteSpace: "nowrap" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ── 3D model primitive ─────────────────────────────────────────────────────
function GTSUModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} scale={0.5} />;
}

// ── Main export ───────────────────────────────────────────────────────────
export function EngineDigitalTwin({
  // components prop accepted but not used — live telemetry drives the HUD
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  components = [],
  title = "GTSU-110 Digital Twin",
  modelUrl = "/Starter Asm..glb",
}: EngineDigitalTwinProps) {
  const { telemetry, health } = useGTSUStore();

  // ── Derive status (mirrors App.tsx threshold logic) ───────────────────
  const jpt1Status: "normal" | "warning" | "critical" =
    telemetry.jpt1 >= JPT_GROUND_LIMIT ? "critical" : telemetry.jpt1 >= 820 ? "warning" : "normal";

  const nggPct = telemetry.nggPct ?? (telemetry.ngg / MAX_NGG_RPM) * 100;
  const nggStatus: "normal" | "warning" | "critical" =
    nggPct > 97 ? "critical" : nggPct > 92 ? "warning" : "normal";

  const p2p1Status: "normal" | "warning" | "critical" =
    telemetry.p2p1 < 3.4 ? "critical" : telemetry.p2p1 < 3.6 ? "warning" : "normal";

  const foulingStatus: "normal" | "warning" | "critical" =
    health.compressorFoulingIndex >= 50
      ? "critical"
      : health.compressorFoulingIndex >= 25
      ? "warning"
      : "normal";

  const secuStatus: "normal" | "warning" | "critical" =
    !telemetry.secuMainHealthy || !telemetry.bitPass
      ? "critical"
      : telemetry.ipsMode > 0
      ? "warning"
      : "normal";

  const fuelStatus: "normal" | "warning" | "critical" =
    telemetry.fuelMassFlow > 8.5 ? "critical" : telemetry.fuelMassFlow > 7.5 ? "warning" : "normal";

  const ipsLabels = [
    "IPS Mode 0 — Closed-Loop",
    "IPS Mode 1 — Emergency Armed",
    "IPS Mode 2 — Open-Loop",
  ];

  // ── Ambient tint color reflects fleet health ──────────────────────────
  const anyC = [jpt1Status, nggStatus, p2p1Status, secuStatus].includes("critical");
  const anyW = [jpt1Status, nggStatus, p2p1Status, secuStatus].includes("warning");
  const ambientColor = anyC ? "#ff3a3a" : anyW ? "#ffb347" : "#70ffd8";

  // ── Live indicator dot class ──────────────────────────────────────────
  const dotCls = anyC ? "bg-red-500" : anyW ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* ── 3D Canvas ──────────────────────────────────────────────────── */}
      <Canvas
        camera={{ position: [0, 0.6, 5], fov: 44 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        {/* Health-tinted ambient + neutral key light */}
        <ambientLight intensity={0.55} color={ambientColor} />
        <directionalLight position={[6, 8, 5]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-4, 2, -4]} intensity={0.35} color="#a8c4e8" />

        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.55} adjustCamera>
            <GTSUModel modelUrl={modelUrl} />
          </Stage>
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* ── CSS HUD overlay ─────────────────────────────────────────────
          Positioned to mirror the GTSU-110 reference image (Starter Asm..JPG):
            ┌──[Fouling/RUL]─────[Title]─────[Ngg/Speed]──┐
            │                                               │
            │ [JPT1/Combustor]   🔧 3D MODEL  [P2/P1 Comp] │
            │                                               │
            └──[Fuel/Stepper]──[OAT/Bus]────[SECU/IPS]────┘
      ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">

        {/* TOP-LEFT  ── Compressor Fouling (gas-inlet dome, left end) */}
        <div className="absolute top-3 left-3">
          <HudCard
            label="Compressor Fouling"
            value={health.compressorFoulingIndex.toFixed(1)}
            unit="%"
            sublabel={`RUL: ${health.rul} h  ·  ${health.rulCycles} cycles`}
            status={foulingStatus}
          />
        </div>

        {/* TOP-RIGHT ── Ngg Speed (stator / rotor winding center) */}
        <div className="absolute top-3 right-3">
          <HudCard
            label="Ngg — Gas Generator"
            value={nggPct.toFixed(1)}
            unit="% Ngg"
            sublabel={`${telemetry.ngg.toLocaleString()} RPM  ·  max 22 000`}
            status={nggStatus}
          />
        </div>

        {/* MID-LEFT  ── JPT1 (combustor dome — left end of model) */}
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <HudCard
            label="JPT1 — Combustor"
            value={Math.round(telemetry.jpt1).toString()}
            unit="°C"
            sublabel={`Gnd limit: ${JPT_GROUND_LIMIT}°C  ·  Δ+${health.residualJpt1.toFixed(1)}°C`}
            status={jpt1Status}
          />
        </div>

        {/* MID-RIGHT ── P2/P1 (compressor / rotor-gear section, right end) */}
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          <HudCard
            label="P2/P1 — Compressor"
            value={telemetry.p2p1.toFixed(3)}
            unit=":1"
            sublabel={`Base: ${health.baselineP2p1}  ·  Δ${health.residualP2p1.toFixed(3)}`}
            status={p2p1Status}
          />
        </div>

        {/* BOTTOM-LEFT ── Fuel Flow / Stepper (stepper motor, bottom-front) */}
        <div className="absolute bottom-3 left-3">
          <HudCard
            label="Fuel Flow — Stepper"
            value={telemetry.fuelMassFlow.toFixed(2)}
            unit="kg/h"
            sublabel={`Pos: ${telemetry.stepperPosition} steps  ·  3-phase motor`}
            status={fuelStatus}
          />
        </div>

        {/* BOTTOM-RIGHT ── SECU / IPS (end-cap / control unit) */}
        <div className="absolute bottom-3 right-3">
          <HudCard
            label="SECU / IPS — BIT"
            value={telemetry.secuMainHealthy && telemetry.bitPass ? "PASS" : "FAIL"}
            unit=""
            sublabel={ipsLabels[telemetry.ipsMode]}
            status={secuStatus}
          />
        </div>

        {/* CENTER-TOP ── model title badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <div
            style={{
              background: "rgba(4,7,18,0.80)",
              border: "1px solid rgba(99,102,241,0.40)",
              borderRadius: 6,
              padding: "3px 12px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${dotCls}`} />
              <span
                style={{
                  fontSize: 9,
                  color: "#a5b4fc",
                  letterSpacing: "0.09em",
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: "nowrap",
                }}
              >
                {title} &nbsp;·&nbsp; LIVE ISO 23247
              </span>
            </div>
          </div>
        </div>

        {/* CENTER-BOTTOM ── OAT / bus health strip */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <div
            style={{
              background: "rgba(4,7,18,0.80)",
              border: "1px solid rgba(71,85,105,0.45)",
              borderRadius: 6,
              padding: "3px 12px",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "#6b7280",
                fontFamily: "'Courier New', monospace",
                whiteSpace: "nowrap",
              }}
            >
              OAT {telemetry.oat.toFixed(1)} °C &nbsp;|&nbsp;
              MIL-1553B {telemetry.milBusHealth}% &nbsp;|&nbsp;
              ARINC 429 {telemetry.arinc429Health}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
