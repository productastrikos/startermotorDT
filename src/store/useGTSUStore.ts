import { create } from 'zustand';
import { GTSUTelemetry, GTSUHealthState, StartScenario } from '../types/engine';
import { generateCurrentTelemetry, generateHealthState } from '../utils/mockData';
import type { Alert } from '../components/AlertNotification';
import type { FaultEvent } from '../lib/faultDetectionEngine';
import type { OverallRUL } from '../lib/rulEstimator';
import type { PhysicsBaseline, ResidualEntry } from '../lib/physicsModel';
import type { SimFrame, ExtendedScenario, SeverityLevel } from '../lib/telemetrySimulator';
import { buildScenarioTrace, frameToTelemetry } from '../lib/telemetrySimulator';
import { detectFaults, aggregateOperationalCall } from '../lib/faultDetectionEngine';
import { estimateRUL } from '../lib/rulEstimator';
import { computePhysicsBaseline, computeResiduals } from '../lib/physicsModel';
import type { MaintenanceAction, MaintenancePriority } from '../types/engine';

let _alertCounter = 0;
let _maintenanceCounter = 0;

export type OperationMode = 'live-test' | 'post-test-review';

// ─── Legacy simulation state (StartSequencePage still uses this) ─────────────

export interface SimulationMetrics {
  peakJpt1: number;
  maxNggPct: number;
  minP2p1: number;
  timeToSelfSustaining: number;
  fuelUsedKg: number;
  aborted: boolean;
}

export interface SimulationState {
  durationSec: number;
  elapsedSec: number;
  isRunning: boolean;
  advisoriesApplied: boolean;
  beforeTrace: Array<{ t: number; jpt1: number; nggPct: number; p2p1: number; fuelFlow: number }>;
  afterTrace:  Array<{ t: number; jpt1: number; nggPct: number; p2p1: number; fuelFlow: number }>;
  beforeMetrics: SimulationMetrics;
  afterMetrics:  SimulationMetrics;
}

const SIM_DURATION_SEC = 40;

function toTraceSample(t: number, jpt1: number, ngg: number, p2p1: number, fuelFlow: number) {
  return { t, jpt1, nggPct: (ngg / 22000) * 100, p2p1, fuelFlow };
}

function buildSimulationTraces() {
  const beforeTrace: SimulationState['beforeTrace'] = [];
  const afterTrace:  SimulationState['afterTrace']  = [];
  for (let t = 0; t <= SIM_DURATION_SEC; t++) {
    const nggBefore  = Math.min(17100, 1200 + t * 395 + Math.sin(t * 0.23) * 260);
    const jptBefore  = Math.min(888,   58   + t * 17.2 + Math.sin(t * 0.36) * 10);
    const p2Before   = Math.max(3.22,  3.76 - t * 0.010 + Math.sin(t * 0.18) * 0.02);
    const fuelBefore = Math.min(8.6,   1.2  + t * 0.155 + Math.sin(t * 0.25) * 0.1);
    const nggAfter   = Math.min(18800, 1350 + t * 440 + Math.sin(t * 0.22) * 240);
    const jptAfter   = Math.min(770,   55   + t * 14.1 + Math.sin(t * 0.33) * 8);
    const p2After    = Math.min(3.92,  3.82 - t * 0.003 + Math.sin(t * 0.19) * 0.018);
    const fuelAfter  = Math.min(7.2,   1.0  + t * 0.13 + Math.sin(t * 0.23) * 0.08);
    beforeTrace.push(toTraceSample(t, jptBefore, nggBefore, p2Before, fuelBefore));
    afterTrace.push(toTraceSample(t, jptAfter,  nggAfter,  p2After,  fuelAfter));
  }
  return { beforeTrace, afterTrace };
}

function computeMetrics(trace: SimulationState['beforeTrace']): SimulationMetrics {
  const peakJpt1     = Math.max(...trace.map(p => p.jpt1));
  const maxNggPct    = Math.max(...trace.map(p => p.nggPct));
  const minP2p1      = Math.min(...trace.map(p => p.p2p1));
  const sustain      = trace.find(p => p.nggPct >= 75)?.t ?? SIM_DURATION_SEC;
  const fuelUsedKg   = trace.reduce((acc, p) => acc + p.fuelFlow / 3600, 0);
  const aborted      = peakJpt1 >= 900 || maxNggPct < 65;
  return {
    peakJpt1:           Number(peakJpt1.toFixed(1)),
    maxNggPct:          Number(maxNggPct.toFixed(1)),
    minP2p1:            Number(minP2p1.toFixed(2)),
    timeToSelfSustaining: sustain,
    fuelUsedKg:         Number(fuelUsedKg.toFixed(2)),
    aborted,
  };
}

function buildInitialSimulation(): SimulationState {
  const { beforeTrace, afterTrace } = buildSimulationTraces();
  return {
    durationSec:       SIM_DURATION_SEC,
    elapsedSec:        0,
    isRunning:         false,
    advisoriesApplied: false,
    beforeTrace,
    afterTrace,
    beforeMetrics:     computeMetrics(beforeTrace),
    afterMetrics:      computeMetrics(afterTrace),
  };
}

// ─── Extended Sim State ───────────────────────────────────────────────────────

export interface ExtendedSimState {
  scenario:     ExtendedScenario;
  severity:     SeverityLevel;
  trace:        SimFrame[];
  elapsedSec:   number;
  isRunning:    boolean;
  speedMultiplier: 1 | 2 | 5;
}

function buildExtendedSim(scenario: ExtendedScenario, severity: SeverityLevel): ExtendedSimState {
  return {
    scenario,
    severity,
    trace:        buildScenarioTrace(scenario, severity),
    elapsedSec:   0,
    isRunning:    false,
    speedMultiplier: 1,
  };
}

// ─── History Buffer ───────────────────────────────────────────────────────────

type HistoryEntry = { t: number; jpt1: number; nggPct: number; p2p1: number; fuelFlow: number; vibration: number };
const MAX_HISTORY = 60;

// ─── Maintenance Actions Generator ───────────────────────────────────────────

function generateMaintenanceFromFaults(faults: FaultEvent[]): MaintenanceAction[] {
  return faults.map(fault => {
    const priority: MaintenancePriority =
      fault.severity === 'critical' ? 'urgent' :
      fault.operationalCall === 'no-go' ? 'high' : 'medium';

    const inspectionItems: string[] = [];
    if (fault.type === 'HOT_START') {
      inspectionItems.push('Borescope combustor liner', 'Check HPT blade trailing edges', 'Inspect fuel nozzle spray pattern', 'Review SECU fuel schedule parameters');
    } else if (fault.type === 'HUNG_START') {
      inspectionItems.push('Check igniter plugs and leads', 'Inspect turbine entry guide vanes', 'Verify compressor inlet for obstruction', 'Check starter current draw vs spec');
    } else if (fault.type === 'COMP_FOULING') {
      inspectionItems.push('On-line compressor wash (approved solution)', 'Measure P2/P1 before and after wash', 'Inspect air inlet filter element', 'Review operating environment for contaminants');
    } else if (fault.type === 'SENSOR_DRIFT') {
      inspectionItems.push('Swap JPT1 thermocouple probe', 'Check signal cable continuity', 'Calibrate sensor channel on SECU', 'Verify connector corrosion free');
    } else if (fault.type === 'FUEL_ANOMALY') {
      inspectionItems.push('Stepper motor full-sweep functional test', 'Inspect metering valve linkage', 'Check LVDT feedback calibration', 'Measure stepper winding resistance');
    } else if (fault.type === 'VIBRATION') {
      inspectionItems.push('Bearing run-out measurement', 'Borescope turbine blades for damage', 'Balance check on rotor assembly', 'Inspect turbine tip clearance');
    } else if (fault.type === 'SECU_FAULT') {
      inspectionItems.push('Run full SECU ground BIT', 'Check all connector pins for fretting', 'Verify SECU supply voltage', 'Inspect IPS protection relay');
    } else {
      inspectionItems.push('General visual inspection', 'Functional test per maintenance manual');
    }

    return {
      id:                `MA-${Date.now()}-${_maintenanceCounter++}`,
      priority,
      action:            fault.recommendation.split('.')[0] + '.',
      component:         fault.affectedComponent,
      reason:            fault.title,
      evidence:          fault.evidence,
      estimatedDowntime: fault.severity === 'critical' ? '8–12 hours' : fault.severity === 'warning' ? '2–6 hours' : '1–2 hours',
      tradeRequired:     fault.type.includes('SECU') ? 'Avionics Technician' : fault.type.includes('FUEL') ? 'Fuel Systems Technician' : 'Gas Turbine Technician',
      inspectionItems,
      status:            'open' as const,
      linkedFaultId:     fault.id,
      createdAt:         new Date(),
      updatedAt:         new Date(),
    };
  });
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface GTSUStore {
  // ── Core state ─────────────────────────────────────────────────────────────
  telemetry:        GTSUTelemetry;
  health:           GTSUHealthState;
  alerts:           Alert[];
  activeScenario:   StartScenario;
  operationMode:    OperationMode;
  simulation:       SimulationState;
  lastRefresh:      Date;

  // ── Extended state ─────────────────────────────────────────────────────────
  extSim:           ExtendedSimState;
  activeFaults:     FaultEvent[];
  rulData:          OverallRUL;
  physicsBaseline:  PhysicsBaseline;
  residuals:        ResidualEntry[];
  maintenanceActions: MaintenanceAction[];
  telemetryHistory: HistoryEntry[];
  vibration:        number;
  thermalLifeConsumed: number;
  cumulativeStarts: number;
  dataQuality:      number;
  focusedFaultId:   string | null;
  focusedComponentId: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  refreshTelemetry:    () => void;
  setOperationMode:    (mode: OperationMode) => void;
  startSimulation:     (applyAdvisories: boolean) => void;
  tickSimulation:      () => void;
  stopSimulation:      () => void;
  resetSimulation:     () => void;
  addAlert:            (alert: Omit<Alert, 'id'>) => void;
  dismissAlert:        (id: string) => void;
  setScenario:         (scenario: StartScenario) => void;

  // ── Extended actions ───────────────────────────────────────────────────────
  startExtSim:         (scenario: ExtendedScenario, severity?: SeverityLevel) => void;
  tickExtSim:          () => void;
  stopExtSim:          () => void;
  resetExtSim:         () => void;
  setExtScenario:      (scenario: ExtendedScenario) => void;
  setExtSeverity:      (severity: SeverityLevel) => void;
  setExtSpeed:         (speed: 1 | 2 | 5) => void;
  injectFault:         (faultType: string) => void;
  clearFaults:         () => void;
  acknowledgeFault:    (id: string) => void;
  resolveFault:        (id: string) => void;
  focusFault:          (id: string | null) => void;
  focusComponent:      (id: string | null) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceAction['status']) => void;
}

// ─── Initial computed state ───────────────────────────────────────────────────

const _initTelemetry = generateCurrentTelemetry();
const _initHealth    = generateHealthState();
const _initBaseline  = computePhysicsBaseline(43, 'self-sustaining', _initTelemetry.stepperPosition, _initTelemetry.oat, _initTelemetry.nggPct);
const _initResiduals = computeResiduals(_initTelemetry, _initBaseline);
const _initRUL       = estimateRUL(_initHealth, []);

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGTSUStore = create<GTSUStore>((set, get) => ({
  // ── Core ────────────────────────────────────────────────────────────────────
  telemetry:           _initTelemetry,
  health:              _initHealth,
  alerts:              [],
  activeScenario:      'normal',
  operationMode:       'live-test',
  simulation:          buildInitialSimulation(),
  lastRefresh:         new Date(),

  // ── Extended ────────────────────────────────────────────────────────────────
  extSim:              buildExtendedSim('normal', 'medium'),
  activeFaults:        [],
  rulData:             _initRUL,
  physicsBaseline:     _initBaseline,
  residuals:           _initResiduals,
  maintenanceActions:  [],
  telemetryHistory:    [],
  vibration:           1.2,
  thermalLifeConsumed: _initHealth.creepLifeConsumption,
  cumulativeStarts:    312,
  dataQuality:         1.0,
  focusedFaultId:      null,
  focusedComponentId:  null,

  // ── Core actions ─────────────────────────────────────────────────────────────
  refreshTelemetry: () =>
    set({ telemetry: generateCurrentTelemetry(), health: generateHealthState(), lastRefresh: new Date() }),

  setOperationMode: (mode) => set({ operationMode: mode }),

  startSimulation: (applyAdvisories) =>
    set((state) => {
      const sim   = state.simulation;
      const trace = applyAdvisories ? sim.afterTrace : sim.beforeTrace;
      const first = trace[0];
      return {
        operationMode: 'live-test',
        simulation: { ...sim, elapsedSec: 0, isRunning: true, advisoriesApplied: applyAdvisories },
        telemetry: {
          ...state.telemetry, timestamp: new Date(),
          jpt1: first.jpt1, nggPct: first.nggPct,
          ngg: Math.round((first.nggPct / 100) * 22000),
          p2p1: first.p2p1, fuelMassFlow: first.fuelFlow,
          startDuration: 0, startPhase: 'cranking',
        },
      };
    }),

  tickSimulation: () =>
    set((state) => {
      const sim = state.simulation;
      if (!sim.isRunning) return state;
      const next  = Math.min(sim.elapsedSec + 1, sim.durationSec);
      const trace = sim.advisoriesApplied ? sim.afterTrace : sim.beforeTrace;
      const pt    = trace[next] ?? trace[trace.length - 1];
      const phase = next < 6 ? 'cranking' : next < 13 ? 'light-up' : next < 26 ? 'acceleration' : 'self-sustaining';
      return {
        simulation: { ...sim, elapsedSec: next, isRunning: next < sim.durationSec },
        telemetry: {
          ...state.telemetry, timestamp: new Date(),
          jpt1: pt.jpt1, nggPct: pt.nggPct,
          ngg: Math.round((pt.nggPct / 100) * 22000),
          p2p1: pt.p2p1, fuelMassFlow: pt.fuelFlow,
          startDuration: next, startPhase: phase as GTSUTelemetry['startPhase'],
        },
      };
    }),

  stopSimulation:  () => set(s => ({ simulation: { ...s.simulation, isRunning: false } })),
  resetSimulation: () => set(s => ({ simulation: { ...s.simulation, elapsedSec: 0, isRunning: false } })),

  addAlert: (alert) =>
    set(s => ({ alerts: [{ ...alert, id: `alert-${Date.now()}-${_alertCounter++}` }, ...s.alerts].slice(0, 8) })),

  dismissAlert: (id) => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),

  setScenario: (scenario) => set({ activeScenario: scenario }),

  // ── Extended Simulation ────────────────────────────────────────────────────

  startExtSim: (scenario, severity = 'medium') => {
    const trace = buildScenarioTrace(scenario, severity);
    const first = trace[0];
    const baseTelemetry = get().telemetry;
    const telem  = frameToTelemetry(first, baseTelemetry);
    const baseline = computePhysicsBaseline(0, first.phase, first.stepperPos, first.oat, first.nggPct);
    const residuals = computeResiduals(telem, baseline);
    set({
      extSim: {
        scenario, severity, trace,
        elapsedSec: 0, isRunning: true, speedMultiplier: get().extSim.speedMultiplier,
      },
      telemetry: telem,
      physicsBaseline: baseline,
      residuals,
      vibration: first.vibration,
      thermalLifeConsumed: first.thermalLifeConsumed,
      dataQuality: first.dataQuality,
      telemetryHistory: [],
      activeFaults: [],
      maintenanceActions: [],
      focusedFaultId: null,
    });
  },

  tickExtSim: () => {
    const { extSim, telemetry, health, telemetryHistory, alerts } = get();
    if (!extSim.isRunning) return;

    const next  = extSim.elapsedSec + 1;
    const frame = extSim.trace[Math.min(next, extSim.trace.length - 1)];
    if (!frame) { set(s => ({ extSim: { ...s.extSim, isRunning: false } })); return; }

    const newTelemetry   = frameToTelemetry(frame, telemetry);
    const baseline       = computePhysicsBaseline(frame.t, frame.phase, frame.stepperPos, frame.oat, frame.nggPct);
    const residuals      = computeResiduals(newTelemetry, baseline);

    // Append to history buffer
    const newHistoryEntry: HistoryEntry = {
      t: frame.t, jpt1: frame.jpt1, nggPct: frame.nggPct,
      p2p1: frame.p2p1, fuelFlow: frame.fuelFlow, vibration: frame.vibration,
    };
    const newHistory = [...telemetryHistory, newHistoryEntry].slice(-MAX_HISTORY);

    // Run fault detection
    const faultInput = {
      telemetry: { ...newTelemetry, vibration: frame.vibration } as GTSUTelemetry & { vibration: number },
      health,
      residuals,
      history: newHistory,
      elapsed: frame.t,
    };
    const detectedFaults = detectFaults(faultInput);

    // Compute RUL
    const rulData = estimateRUL(health, detectedFaults);

    // Generate maintenance actions from new faults
    const existingFaultTypes = new Set(get().activeFaults.map(f => f.type));
    const newFaults = detectedFaults.filter(f => !existingFaultTypes.has(f.type));
    const newMaintenanceActions = generateMaintenanceFromFaults(newFaults);

    // Auto-generate alerts for newly detected faults
    const newAlerts: Alert[] = newFaults.map(f => ({
      id: `fault-alert-${f.id}`,
      type: f.severity === 'critical' ? 'critical' as const : 'warning' as const,
      message: `${f.title}: ${f.rootCause.substring(0, 80)}...`,
      timestamp: new Date(),
    }));

    set({
      extSim:   { ...extSim, elapsedSec: next, isRunning: next < extSim.trace.length - 1 },
      telemetry: newTelemetry,
      physicsBaseline: baseline,
      residuals,
      vibration: frame.vibration,
      thermalLifeConsumed: frame.thermalLifeConsumed,
      dataQuality: frame.dataQuality,
      telemetryHistory: newHistory,
      activeFaults: detectedFaults,
      rulData,
      maintenanceActions: [...get().maintenanceActions, ...newMaintenanceActions].slice(0, 20),
      alerts: [...newAlerts, ...alerts].slice(0, 8),
    });
  },

  stopExtSim:  () => set(s => ({ extSim: { ...s.extSim, isRunning: false } })),
  resetExtSim: () => {
    const { extSim } = get();
    const trace = buildScenarioTrace(extSim.scenario, extSim.severity);
    set({
      extSim: { ...extSim, trace, elapsedSec: 0, isRunning: false },
      activeFaults: [], maintenanceActions: [], telemetryHistory: [],
      focusedFaultId: null,
    });
  },

  setExtScenario: (scenario) => {
    const { extSim } = get();
    const trace = buildScenarioTrace(scenario, extSim.severity);
    set({ extSim: { ...extSim, scenario, trace, elapsedSec: 0, isRunning: false }, activeFaults: [], maintenanceActions: [] });
  },

  setExtSeverity: (severity) => {
    const { extSim } = get();
    const trace = buildScenarioTrace(extSim.scenario, severity);
    set({ extSim: { ...extSim, severity, trace, elapsedSec: 0, isRunning: false }, activeFaults: [], maintenanceActions: [] });
  },

  setExtSpeed: (speed) => set(s => ({ extSim: { ...s.extSim, speedMultiplier: speed } })),

  injectFault: (faultType) => {
    // Force a fault by modifying telemetry to match fault signature
    const { telemetry, health, telemetryHistory, residuals } = get();
    let modTelemetry = { ...telemetry };
    if (faultType === 'HOT_START')     modTelemetry = { ...modTelemetry, jpt1: 920, startPhase: 'light-up' as const };
    if (faultType === 'HUNG_START')    modTelemetry = { ...modTelemetry, nggPct: 52, ngg: 11440, startPhase: 'acceleration' as const, startDuration: 28 };
    if (faultType === 'SECU_FAULT')    modTelemetry = { ...modTelemetry, secuMainHealthy: false, bitPass: false, ipsMode: 1 as const };
    if (faultType === 'VIBRATION')     (modTelemetry as GTSUTelemetry & { vibration: number }).vibration = 11.5;
    const faultInput = {
      telemetry: { ...modTelemetry, vibration: (modTelemetry as GTSUTelemetry & { vibration?: number }).vibration ?? 11.5 } as GTSUTelemetry & { vibration: number },
      health, residuals, history: telemetryHistory, elapsed: modTelemetry.startDuration ?? 25,
    };
    const detectedFaults = detectFaults(faultInput);
    const rulData = estimateRUL(health, detectedFaults);
    const newMaintenance = generateMaintenanceFromFaults(detectedFaults.filter(f => !get().activeFaults.some(af => af.type === f.type)));
    set({ telemetry: modTelemetry, activeFaults: detectedFaults, rulData, maintenanceActions: [...get().maintenanceActions, ...newMaintenance].slice(0, 20) });
  },

  clearFaults: () => set({ activeFaults: [], maintenanceActions: [], focusedFaultId: null }),

  acknowledgeFault: (id) =>
    set(s => ({ activeFaults: s.activeFaults.map(f => f.id === id ? { ...f, status: 'acknowledged' as const } : f) })),

  resolveFault: (id) =>
    set(s => ({ activeFaults: s.activeFaults.map(f => f.id === id ? { ...f, status: 'resolved' as const } : f) })),

  focusFault: (id) => set({ focusedFaultId: id }),

  focusComponent: (id) => set({ focusedComponentId: id }),

  updateMaintenanceStatus: (id, status) =>
    set(s => ({ maintenanceActions: s.maintenanceActions.map(m => m.id === id ? { ...m, status, updatedAt: new Date() } : m) })),
}));

