/**
 * digitalTwinMapper.ts
 * Maps telemetry and fault states to 3D model component overlay states.
 *
 * Each component entry defines:
 *  - id: matches the part ID in EngineDigitalTwin PART_DEFS
 *  - faultTypes: which fault types trigger highlighting
 *  - overlayColor/emissive: visual state per severity level
 *  - telemetryKey: which telemetry drives the heat map
 */

import type { FaultEvent, FaultSeverity } from './faultDetectionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComponentOverlayState {
  /** Matches PartDef.id in EngineDigitalTwin */
  componentId:     string;
  label:           string;
  severity:        FaultSeverity | 'normal';
  overlayColor:    string;   // hex
  emissiveColor:   string;   // hex
  emissiveIntensity: number; // 0–1
  pulse:           boolean;  // blink/pulse animation for critical
  tooltip:         string;
  thermalValue:    number;   // 0–1 for heat map gradient
}

// ─── Color Palettes ───────────────────────────────────────────────────────────

const COLORS = {
  normal:   { overlay: '#6ea8d8', emissive: '#0a2540', intensity: 0.10, pulse: false },
  info:     { overlay: '#3b82f6', emissive: '#1e3a5f', intensity: 0.15, pulse: false },
  warning:  { overlay: '#f59e0b', emissive: '#78350f', intensity: 0.28, pulse: false },
  critical: { overlay: '#ef4444', emissive: '#7f1d1d', intensity: 0.40, pulse: true  },
};

// ─── Component → Fault Type Mapping ─────────────────────────────────────────

const COMPONENT_FAULT_MAP: Record<string, string[]> = {
  housing:     ['SECU_FAULT'],
  stator:      ['HUNG_START'],
  armature:    ['HUNG_START', 'VIBRATION'],
  commutator:  ['HOT_START', 'THERMAL_CREEP'],
  gear:        ['FUEL_ANOMALY'],
  solenoid:    ['COMP_FOULING'],
  endbell:     ['SECU_FAULT'],
  bracket:     ['SENSOR_DRIFT'],
  brushes:     ['HOT_START'],
  bearings:    ['VIBRATION'],
};

// ─── Main Mapper Function ─────────────────────────────────────────────────────

/**
 * Returns an overlay state for every known component based on active faults.
 * If a component has no active faults, it returns a 'normal' state.
 */
export function mapComponentOverlays(
  faults:      FaultEvent[],
  jpt1:        number,   // for thermal gradient on hot section
  nggPct:      number,   // for vibration indicator on rotor
  p2p1:        number,   // for airflow indicator on compressor
): ComponentOverlayState[] {
  const activeFaultTypes = new Set(faults.map(f => f.type));

  return Object.entries(COMPONENT_FAULT_MAP).map(([componentId, linkedFaults]) => {
    // Find worst-severity fault linked to this component
    const relevantFaults = faults.filter(f => linkedFaults.includes(f.type));
    const worstSeverity  = relevantFaults.some(f => f.severity === 'critical')
      ? 'critical'
      : relevantFaults.some(f => f.severity === 'warning')
        ? 'warning'
        : relevantFaults.some(f => f.severity === 'info')
          ? 'info'
          : 'normal';

    const colors = COLORS[worstSeverity];

    // Per-component specialised thermal value
    let thermalValue = 0;
    if (componentId === 'commutator' || componentId === 'brushes') {
      // Hot-section: scale JPT1 from 400–900 °C → 0–1
      thermalValue = Math.max(0, Math.min(1, (jpt1 - 400) / 500));
    } else if (componentId === 'armature' || componentId === 'stator') {
      // Rotor: scale Ngg 0–100% → 0–1
      thermalValue = Math.max(0, Math.min(1, nggPct / 100));
    } else if (componentId === 'solenoid' || componentId === 'gear') {
      // Compressor side: P2/P1 normalised (0 = bad, 1 = nominal)
      thermalValue = Math.max(0, Math.min(1, (p2p1 - 1.0) / 3.0));
    }

    const linkedFaultTitles = relevantFaults.map(f => f.title).join('; ');
    const tooltip = worstSeverity !== 'normal'
      ? `${linkedFaultTitles}`
      : componentId.charAt(0).toUpperCase() + componentId.slice(1) + ' — Nominal';

    return {
      componentId,
      label:            componentId,
      severity:         worstSeverity,
      overlayColor:     colors.overlay,
      emissiveColor:    colors.emissive,
      emissiveIntensity: colors.intensity,
      pulse:            colors.pulse,
      tooltip,
      thermalValue,
    };
  });
}

/** Returns the overlay state for a single component by id */
export function getComponentOverlay(
  componentId: string,
  faults:      FaultEvent[],
  jpt1:        number,
  nggPct:      number,
  p2p1:        number,
): ComponentOverlayState {
  const all = mapComponentOverlays(faults, jpt1, nggPct, p2p1);
  return all.find(o => o.componentId === componentId) ?? {
    componentId,
    label:             componentId,
    severity:          'normal',
    overlayColor:      COLORS.normal.overlay,
    emissiveColor:     COLORS.normal.emissive,
    emissiveIntensity: COLORS.normal.intensity,
    pulse:             false,
    tooltip:           'Nominal',
    thermalValue:      0,
  };
}

/** Returns whether any fault is linked to a given component */
export function isComponentFaulted(componentId: string, faults: FaultEvent[]): boolean {
  const linked = COMPONENT_FAULT_MAP[componentId] ?? [];
  return faults.some(f => linked.includes(f.type) && f.status === 'active');
}

/** Returns the set of component IDs that have active faults */
export function faultedComponentIds(faults: FaultEvent[]): Set<string> {
  const faultedIds = new Set<string>();
  for (const [componentId, linkedFaults] of Object.entries(COMPONENT_FAULT_MAP)) {
    if (faults.some(f => linkedFaults.includes(f.type) && f.status === 'active')) {
      faultedIds.add(componentId);
    }
  }
  return faultedIds;
}
