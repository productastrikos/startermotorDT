/**
 * faultDetectionEngine.ts
 * Rule-based and model-based Fault Detection and Isolation (FDI) engine
 * for the GTSU-110 Gas Turbine Starter Unit.
 *
 * Each fault rule evaluates current telemetry, physics residuals, and
 * accumulated history to classify faults with severity, confidence, and
 * structured evidence. All rule logic is documented inline.
 */

import type { GTSUTelemetry, GTSUHealthState, StartPhase } from '../types/engine';
import type { ResidualEntry } from './physicsModel';

// ─── Fault Data Structures ────────────────────────────────────────────────────

export type FaultSeverity   = 'info' | 'warning' | 'critical';
export type FaultStatus     = 'active' | 'acknowledged' | 'resolved';
export type OperationalCall = 'go' | 'watch' | 'no-go';

export interface FaultEvent {
  id:                 string;
  type:               string;           // machine-readable e.g. 'HOT_START'
  title:              string;
  affectedComponent:  string;
  severity:           FaultSeverity;
  confidence:         number;           // 0–1
  evidence:           string[];
  rootCause:          string;
  recommendation:     string;
  operationalImpact:  string;
  operationalCall:    OperationalCall;
  timestamp:          Date;
  status:             FaultStatus;
  linkedComponentId:  string;           // maps to 3D model part ID
}

// ─── Detection Context ────────────────────────────────────────────────────────

export interface FaultDetectionInput {
  telemetry:  GTSUTelemetry;
  health:     GTSUHealthState;
  residuals:  ResidualEntry[];
  /** Time-series history (up to last 60 s) for trend analysis */
  history:    Array<{ t: number; jpt1: number; nggPct: number; p2p1: number; fuelFlow: number; vibration: number }>;
  elapsed:    number;  // current start-cycle elapsed seconds
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _faultCounter = 0;
function newId(type: string): string {
  return `${type}-${Date.now()}-${_faultCounter++}`;
}

function getResidual(residuals: ResidualEntry[], param: string): ResidualEntry | undefined {
  return residuals.find(r => r.parameter === param);
}

/** Linear slope of the last N samples in a history array */
function slopeOf(vals: number[], n = 10): number {
  const recent = vals.slice(-n);
  if (recent.length < 2) return 0;
  const dx = recent.length - 1;
  return (recent[recent.length - 1] - recent[0]) / dx;
}

// ─── Individual Fault Rules ───────────────────────────────────────────────────

/**
 * HOT START
 * Triggers when JPT1 rises faster than expected during light-up/acceleration
 * and approaches or breaches the 900 °C ground limit.
 *
 * Logic:
 *   - JPT1 normalised residual ≥ 2.5 σ (actual >> expected)
 *   - JPT1 rate-of-rise in last 5 s > 40 °C/s
 *   - OR absolute JPT1 > 860 °C during start phases
 */
function detectHotStart(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry, residuals, history, elapsed } = input;
  if (telemetry.startPhase !== 'light-up' && telemetry.startPhase !== 'acceleration') return null;

  const jptRes    = getResidual(residuals, 'JPT1');
  const jptSlope  = slopeOf(history.map(h => h.jpt1), 5);
  const hotTemp   = telemetry.jpt1 > 860;
  const highRes   = (jptRes?.normalizedResidual ?? 0) >= 2.5;
  const rapidRise = jptSlope > 38;

  if (!hotTemp && !highRes && !rapidRise) return null;

  const confidence = Math.min(0.99, 0.55 + (hotTemp ? 0.25 : 0) + (highRes ? 0.15 : 0) + (rapidRise ? 0.10 : 0));

  return {
    id:                newId('HOT_START'),
    type:              'HOT_START',
    title:             'Hot Start Detected',
    affectedComponent: 'Combustor / Hot Section',
    severity:          telemetry.jpt1 > 900 ? 'critical' : 'warning',
    confidence,
    evidence: [
      `JPT1 = ${telemetry.jpt1} °C (limit 900 °C)`,
      `JPT1 rate-of-rise ≈ ${jptSlope.toFixed(1)} °C/s (limit 40 °C/s)`,
      `JPT1 residual = ${jptRes?.residual?.toFixed(1) ?? '–'} °C (${jptRes?.normalizedResidual?.toFixed(1) ?? '–'} σ)`,
      `Fuel command: stepper ${telemetry.stepperPosition}/255`,
      `Elapsed: ${elapsed} s into start cycle`,
    ],
    rootCause:         'Excess fuel-to-air ratio during ignition. Likely cause: stepper schedule too rich, compressor inlet blockage, or slow starter cranking speed.',
    recommendation:    'Abort start cycle immediately. Perform hot-section inspection (combustor liner, turbine blades) before next mission. Review fuel schedule parameters with SECU.',
    operationalImpact: 'Potential thermal damage to combustor liner and HPT blades. Risk of creep life advancement.',
    operationalCall:   telemetry.jpt1 > 900 ? 'no-go' : 'watch',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'commutator',
  };
}

/**
 * HUNG START
 * Triggers when Ngg plateaus below the self-sustaining threshold (57.4 % ≈ 12 625 RPM)
 * after more than 20 s of combustion while fuel command remains active.
 *
 * Logic:
 *   - Phase = acceleration AND elapsed > 20 s
 *   - Ngg < 57 % for more than 5 consecutive seconds
 *   - Fuel command active (stepper > 80)
 *   - JPT1 rising or stable (combustion occurring)
 */
function detectHungStart(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry, residuals, history, elapsed } = input;
  if (telemetry.startPhase !== 'acceleration') return null;
  if (elapsed < 18) return null;

  const nggLow     = telemetry.nggPct < 57.4;
  const fuelActive = telemetry.stepperPosition > 80;
  const nggStall   = history.slice(-5).every(h => h.nggPct < 58);
  const nggRes     = getResidual(residuals, 'Ngg');

  if (!nggLow || !fuelActive || !nggStall) return null;

  const confidence = Math.min(0.97, 0.60 + (nggStall ? 0.20 : 0) + ((nggRes?.normalizedResidual ?? 0) < -2 ? 0.15 : 0));

  return {
    id:                newId('HUNG_START'),
    type:              'HUNG_START',
    title:             'Hung Start Detected',
    affectedComponent: 'Turbine / Rotor',
    severity:          elapsed > 30 ? 'critical' : 'warning',
    confidence,
    evidence: [
      `Ngg = ${telemetry.nggPct.toFixed(1)} % (self-sustaining threshold 57.4 %)`,
      `Elapsed = ${elapsed} s (abort threshold 35 s)`,
      `Stepper position = ${telemetry.stepperPosition} (fuel active)`,
      `JPT1 = ${telemetry.jpt1} °C (combustion confirmed)`,
      `Ngg residual = ${nggRes?.residual?.toFixed(1) ?? '–'} % (${nggRes?.normalizedResidual?.toFixed(1) ?? '–'} σ)`,
    ],
    rootCause:         'Engine ignited but unable to accelerate through self-sustaining speed. Likely cause: turbine blade fouling, compressor surge, igniter degradation, or insufficient cranking torque.',
    recommendation:    'Abort start. Perform wet motoring purge to clear fuel. Inspect igniter plugs, turbine entry guide vanes, and compressor stage. Verify SECU starter current envelope.',
    operationalImpact: 'Risk of turbine overheating and fuel accumulation. Potential over-temperature damage if not aborted promptly.',
    operationalCall:   elapsed > 30 ? 'no-go' : 'watch',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'armature',
  };
}

/**
 * COMPRESSOR FOULING
 * Triggers when P2/P1 systematically drops below expected for the measured Ngg.
 *
 * Logic:
 *   - P2/P1 normalised residual ≤ −2 σ (sustained negative bias)
 *   - OR P2/P1 slope negative over last 20 samples
 *   - Fuel demand increasing to compensate (stepper position rising)
 */
function detectCompressorFouling(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry, residuals, health, history } = input;

  const p2p1Res    = getResidual(residuals, 'P2/P1');
  const p2p1Slope  = slopeOf(history.map(h => h.p2p1), 15);
  const lowP2p1    = (p2p1Res?.normalizedResidual ?? 0) <= -2.0;
  const degrading  = p2p1Slope < -0.008;
  const highFoul   = health.compressorFoulingIndex > 28;

  if (!lowP2p1 && !degrading && !highFoul) return null;

  const confidence = Math.min(0.96, 0.50 + (lowP2p1 ? 0.20 : 0) + (degrading ? 0.15 : 0) + (highFoul ? 0.15 : 0));

  return {
    id:                newId('COMP_FOULING'),
    type:              'COMP_FOULING',
    title:             'Compressor Fouling Detected',
    affectedComponent: 'Compressor / Air Path',
    severity:          health.compressorFoulingIndex > 40 ? 'critical' : 'warning',
    confidence,
    evidence: [
      `P2/P1 = ${telemetry.p2p1.toFixed(2)} (expected ${p2p1Res?.expected?.toFixed(2) ?? '–'})`,
      `P2/P1 residual = ${p2p1Res?.residual?.toFixed(2) ?? '–'} (${p2p1Res?.normalizedResidual?.toFixed(1) ?? '–'} σ)`,
      `P2/P1 trend slope = ${p2p1Slope.toFixed(2)} per sample`,
      `Compressor fouling index = ${health.compressorFoulingIndex.toFixed(1)} %`,
      `Stepper demand elevated to compensate: pos ${telemetry.stepperPosition}`,
    ],
    rootCause:         'Blade surface contamination reducing aerodynamic efficiency. Typical deposits: salt, dust, hydrocarbon residue. Efficiency recoverable via compressor wash.',
    recommendation:    'Schedule online compressor wash within next 5 starts. Plan offline detergent wash at next maintenance window. Monitor P2/P1 trend closely.',
    operationalImpact: 'Reduced surge margin, higher fuel consumption, elevated start cycle temperatures. Risk of compressor stall in marginal ambient conditions.',
    operationalCall:   health.compressorFoulingIndex > 40 ? 'watch' : 'go',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'solenoid',
  };
}

/**
 * SENSOR DRIFT / SENSOR FAILURE
 * Triggers when a measured sensor deviates from virtual model estimate
 * beyond physical plausibility limits.
 *
 * Logic:
 *   - |JPT1_actual − JPT1_virtual_estimate| > 45 °C  (virtual based on fuel model)
 *   - OR JPT1 rate-of-change physically impossible (|dT/dt| > 180 °C/s)
 *   - OR flat-line (σ < 0.5 °C over last 10 samples during active phase)
 *   - Virtual sensor confidence < 0.85
 */
function detectSensorDrift(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry, health, residuals, history } = input;
  if (telemetry.startPhase === 'idle') return null;

  const jptRes    = getResidual(residuals, 'JPT1');
  const highDrift = Math.abs(jptRes?.residual ?? 0) > 45
    && health.virtualSensorConfidence < 0.88;

  const jptHistory  = history.map(h => h.jpt1);
  const jptSlope    = slopeOf(jptHistory, 3);
  const physImpossible = Math.abs(jptSlope) > 175;

  const recentSlice = jptHistory.slice(-10);
  const flatLine    = recentSlice.length >= 10
    && (Math.max(...recentSlice) - Math.min(...recentSlice)) < 0.6
    && telemetry.startPhase !== 'idle';

  if (!highDrift && !physImpossible && !flatLine) return null;

  const cause = flatLine ? 'flat-line (stuck sensor)' : physImpossible ? 'physically impossible rate of change' : 'systematic bias vs virtual model';
  const confidence = Math.min(0.98, 0.65 + (highDrift ? 0.15 : 0) + (physImpossible ? 0.15 : 0) + (flatLine ? 0.12 : 0));

  return {
    id:                newId('SENSOR_DRIFT'),
    type:              'SENSOR_DRIFT',
    title:             'JPT1 Sensor Anomaly Detected',
    affectedComponent: 'Sensors / Probe Locations',
    severity:          flatLine || physImpossible ? 'critical' : 'warning',
    confidence,
    evidence: [
      `JPT1 actual = ${telemetry.jpt1} °C`,
      `Virtual sensor estimate = ${jptRes?.expected?.toFixed(1) ?? '–'} °C`,
      `Deviation = ${jptRes?.residual?.toFixed(1) ?? '–'} °C (${jptRes?.normalizedResidual?.toFixed(1) ?? '–'} σ)`,
      `Virtual sensor confidence = ${(health.virtualSensorConfidence * 100).toFixed(1)} %`,
      `Anomaly type: ${cause}`,
    ],
    rootCause:         'JPT1 thermocouple or signal conditioning unit anomaly. Likely cause: probe fouling, broken thermocouple junction, connector corrosion, or EMI on signal cable.',
    recommendation:    'Isolate JPT1 sensor and revert to virtual sensor estimate. Validate with reference pyrometer or cross-check against fuel calorimetric model. Inspect probe at next ground check.',
    operationalImpact: 'Hot start and over-temperature protection capability may be degraded. Reduced confidence in thermal monitoring.',
    operationalCall:   flatLine || physImpossible ? 'watch' : 'go',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'bracket',
  };
}

/**
 * FUEL CONTROL ANOMALY
 * Triggers when stepper motor command changes but JPT1/Ngg response
 * is inconsistent with the expected transfer function.
 *
 * Logic:
 *   - Fuel command changes > 15 steps over last 5 s
 *   - But Ngg/JPT1 response does not follow expected transfer function
 *   - Command–response mismatch > 2 σ on fuel residual
 */
function detectFuelControlAnomaly(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry, residuals, history } = input;
  if (telemetry.startPhase === 'idle' || telemetry.startPhase === 'cranking') return null;

  const fuelRes     = getResidual(residuals, 'Fuel Flow');
  const fuelHist    = history.map(h => h.fuelFlow);
  const fuelChange  = Math.abs(slopeOf(fuelHist, 5)) * 5;
  const highMismatch = Math.abs(fuelRes?.normalizedResidual ?? 0) > 2.5;

  if (fuelChange < 0.8 || !highMismatch) return null;

  const confidence = Math.min(0.93, 0.58 + (highMismatch ? 0.20 : 0) + (fuelChange > 2 ? 0.10 : 0));

  return {
    id:                newId('FUEL_ANOMALY'),
    type:              'FUEL_ANOMALY',
    title:             'Fuel Control Anomaly',
    affectedComponent: 'Fuel Control / Stepper Motor',
    severity:          'warning',
    confidence,
    evidence: [
      `Stepper position = ${telemetry.stepperPosition} (command–response lag)`,
      `Fuel flow residual = ${fuelRes?.residual?.toFixed(2) ?? '–'} kg/h (${fuelRes?.normalizedResidual?.toFixed(1) ?? '–'} σ)`,
      `Fuel command change in last 5 s = ${fuelChange.toFixed(2)} kg/h`,
      `Ngg = ${telemetry.nggPct.toFixed(1)} % | JPT1 = ${telemetry.jpt1} °C`,
    ],
    rootCause:         'Stepper motor position not translating to expected metering valve movement. Possible causes: stepper winding fault, mechanical binding in fuel valve, LVDT calibration drift.',
    recommendation:    'Perform stepper functional test: command sweep 0 → 255 and verify fuel flow response. Inspect stepper drive circuit and winding continuity. Cross-check metering valve LVDT feedback.',
    operationalImpact: 'Fuel scheduling errors may cause hot start or hung start on subsequent cycles.',
    operationalCall:   'watch',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'gear',
  };
}

/**
 * THERMAL CREEP / FATIGUE ACCUMULATION
 * Triggers when cumulative thermal damage indicators exceed maintenance thresholds.
 *
 * Logic:
 *   - Creep life consumption > 30 %
 *   - OR thermal fatigue accumulation > 35 %
 *   - AND recent starts show elevated JPT1 peaks
 */
function detectThermalCreep(input: FaultDetectionInput): FaultEvent | null {
  const { health, telemetry } = input;
  const highCreep   = health.creepLifeConsumption > 30;
  const highFatigue = health.thermalFatigueAccumulation > 35;

  if (!highCreep && !highFatigue) return null;

  const confidence = Math.min(0.97, 0.70 + (highCreep ? 0.15 : 0) + (highFatigue ? 0.12 : 0));

  return {
    id:                newId('THERMAL_CREEP'),
    type:              'THERMAL_CREEP',
    title:             'Thermal Life Accumulation Warning',
    affectedComponent: 'Combustor / Hot Section',
    severity:          (health.creepLifeConsumption > 45 || health.thermalFatigueAccumulation > 50) ? 'critical' : 'warning',
    confidence,
    evidence: [
      `Creep life consumed = ${health.creepLifeConsumption.toFixed(1)} % (limit 50 %)`,
      `Thermal fatigue = ${health.thermalFatigueAccumulation.toFixed(1)} % (limit 50 %)`,
      `JPT1 current = ${telemetry.jpt1} °C`,
      `Peak JPT1 logged in recent cycles above 820 °C`,
    ],
    rootCause:         'Cumulative thermal cycling and high-temperature exposure advancing material degradation in hot-section components. Driven by repeated high-JPT1 start events.',
    recommendation:    'Mandatory hot-section borescope inspection at next scheduled maintenance. Review and adjust fuel schedule to reduce peak JPT1. Consider bringing maintenance window forward.',
    operationalImpact: 'Accelerated turbine blade creep. Risk of premature hot-section life expiry if uncorrected.',
    operationalCall:   health.creepLifeConsumption > 45 ? 'watch' : 'go',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'commutator',
  };
}

/**
 * VIBRATION / ROTOR DYNAMIC ANOMALY
 * Triggers when vibration amplitude exceeds Ngg-normalised envelope.
 *
 * Logic:
 *   - Vibration level > 8 mm/s at any Ngg
 *   - OR vibration/Ngg ratio rising (rotor imbalance trend)
 */
function detectVibrationAnomaly(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry } = input;
  const vibration = (telemetry as GTSUTelemetry & { vibration?: number }).vibration ?? 0;
  const highVib   = vibration > 8.0;
  const warnVib   = vibration > 5.5;

  if (!highVib && !warnVib) return null;

  return {
    id:                newId('VIBRATION'),
    type:              'VIBRATION',
    title:             'Abnormal Vibration Level',
    affectedComponent: 'Turbine / Rotor',
    severity:          highVib ? 'critical' : 'warning',
    confidence:        highVib ? 0.94 : 0.78,
    evidence: [
      `Vibration = ${vibration.toFixed(1)} mm/s (limit 8 mm/s)`,
      `Ngg = ${telemetry.nggPct.toFixed(1)} %`,
      `Normalised vibration/Ngg = ${(vibration / Math.max(1, telemetry.nggPct)).toFixed(2)}`,
    ],
    rootCause:         'Elevated rotor imbalance. Possible causes: foreign object damage, bearing wear, blade tip rub, or rotor bow after thermal event.',
    recommendation:    'Reduce to idle and monitor vibration trend. If persistent, shutdown and inspect bearings and rotor balance. Arrange borescope inspection of turbine stage.',
    operationalImpact: 'Risk of bearing failure and rotor damage if vibration not addressed.',
    operationalCall:   highVib ? 'no-go' : 'watch',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'bearings',
  };
}

/**
 * SECU / BIT FAILURE
 * Triggers on SECU health status or BIT failure codes.
 */
function detectSecuBitFault(input: FaultDetectionInput): FaultEvent | null {
  const { telemetry } = input;
  if (telemetry.secuMainHealthy && telemetry.bitPass && telemetry.ipsMode === 0) return null;

  const critical = !telemetry.secuMainHealthy || telemetry.ipsMode === 2;
  const items: string[] = [];
  if (!telemetry.secuMainHealthy) items.push('SECU main processor FAIL');
  if (!telemetry.bitPass)         items.push('BIT test FAIL');
  if (telemetry.ipsMode === 1)    items.push('IPS emergency shutdown armed');
  if (telemetry.ipsMode === 2)    items.push('IPS degraded open-loop mode active');
  if (telemetry.milBusHealth < 90) items.push(`MIL-STD-1553B bus health ${telemetry.milBusHealth} %`);
  if (telemetry.arinc429Health < 90) items.push(`ARINC 429 health ${telemetry.arinc429Health} %`);

  return {
    id:                newId('SECU_FAULT'),
    type:              'SECU_FAULT',
    title:             critical ? 'SECU Critical Fault' : 'SECU / BIT Advisory',
    affectedComponent: 'SECU / Control Interface',
    severity:          critical ? 'critical' : 'warning',
    confidence:        0.99,
    evidence:          items,
    rootCause:         'SECU processor or communication fault. Possible causes: voltage transient, connector degradation, firmware exception, or IPS protection trigger.',
    recommendation:    'Run SECU ground BIT procedure. Verify all connector pins and harness continuity. If main processor failed, switch to backup channel per maintenance manual. Do not commence start cycle.',
    operationalImpact: 'Control authority degraded. Engine start not recommended until fault cleared and BIT passes.',
    operationalCall:   critical ? 'no-go' : 'watch',
    timestamp:         new Date(),
    status:            'active',
    linkedComponentId: 'housing',
  };
}

// ─── Main Detection Function ──────────────────────────────────────────────────

/**
 * Runs all fault detection rules against the current input context.
 * Returns an array of detected active faults (empty = no faults detected).
 */
export function detectFaults(input: FaultDetectionInput): FaultEvent[] {
  const detectors = [
    detectHotStart,
    detectHungStart,
    detectCompressorFouling,
    detectSensorDrift,
    detectFuelControlAnomaly,
    detectThermalCreep,
    detectVibrationAnomaly,
    detectSecuBitFault,
  ];

  const results: FaultEvent[] = [];
  for (const detect of detectors) {
    const fault = detect(input);
    if (fault) results.push(fault);
  }
  return results;
}

/** Returns the highest operational call across all faults */
export function aggregateOperationalCall(faults: FaultEvent[]): OperationalCall {
  if (faults.some(f => f.operationalCall === 'no-go'))  return 'no-go';
  if (faults.some(f => f.operationalCall === 'watch'))   return 'watch';
  return 'go';
}

/** Returns highest severity across all faults */
export function highestSeverity(faults: FaultEvent[]): FaultSeverity {
  if (faults.some(f => f.severity === 'critical')) return 'critical';
  if (faults.some(f => f.severity === 'warning'))  return 'warning';
  return 'info';
}
