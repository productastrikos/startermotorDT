/**
 * physicsModel.ts
 * Physics-based baseline model for GTSU-110 Gas Turbine Starter Unit.
 *
 * Computes expected telemetry values using simplified but credible engineering
 * relationships. All equations are documented inline. Model is structured as a
 * pure-function library — no side effects, no state.
 *
 * Key assumptions:
 *  - Ground-level operation (ISA sea level reference: 15 °C, 101.325 kPa)
 *  - Simplified compressor map: quadratic RPM-fraction → pressure ratio
 *  - JPT1 modelled as fuel–air enthalpy release minus work extraction
 *  - OAT correction: Δ1°C ambient → Δ0.4°C JPT1 (from HAL ground-test regression)
 *  - Thermal load normalised to [0,1] between 400 °C and JPT ground limit (900 °C)
 */

import type { GTSUTelemetry, StartPhase } from '../types/engine';

// ─── Physical Constants ───────────────────────────────────────────────────────
export const MAX_NGG_RPM   = 22000;
export const LIGHT_UP_NGG  = 12625;
export const JPT_GND_LIMIT = 900;
export const NOMINAL_P2P1  = 3.86;
export const ISA_OAT       = 15;   // °C
export const STEPPER_MAX   = 255;

// ─── Data Structures ─────────────────────────────────────────────────────────

export interface PhysicsBaseline {
  expectedJpt1:           number;   // °C
  expectedNgg:            number;   // RPM
  expectedNggPct:         number;   // %
  expectedP2p1:           number;   // dimensionless
  expectedFuelFlow:       number;   // kg/h
  expectedStartDuration:  number;   // seconds (nominal)
  thermalLoad:            number;   // 0–1 normalised
  /** Virtual sensor: isentropic compressor efficiency 0–1 */
  compEfficiency:         number;
  /** Virtual sensor: estimated thermal gradient °C/s */
  thermalGradient:        number;
  /** Virtual sensor: combustion efficiency 0–1 */
  combustionEfficiency:   number;
  timestamp:              Date;
}

export interface ResidualEntry {
  parameter:          string;
  channel:            string;         // display-friendly label (alias for parameter)
  unit:               string;
  actual:             number;
  expected:           number;
  residual:           number;         // actual − expected
  sigma:              number;         // 1-sigma noise floor used for normalisation
  normalizedResidual: number;         // residual / sigma
  severityBand:       'normal' | 'warning' | 'critical';
  confidence:         number;         // model confidence 0–1
}

// ─── Compressor Map (simplified polynomial) ──────────────────────────────────
/**
 * Estimates P2/P1 from normalised shaft speed.
 * Based on a quadratic fit to a generic single-stage centrifugal compressor map.
 *
 * P2/P1 = 1 + k₂ · n²   where n ∈ [0,1]
 * k₂ ≈ 3.2  → peak P2/P1 ≈ 4.2 at 100 % Ngg (above self-sustaining range)
 *
 * Fouling factor reduces effective pressure ratio:
 *   effective = clean × (1 − fouling × 0.20)
 *   fouling ∈ [0, 0.5] (50 % = severe fouling)
 */
function compressorPressureRatio(nggFraction: number, fouling: number = 0): number {
  const clean = 1.0 + 3.2 * nggFraction * nggFraction;
  return clean * (1 - fouling * 0.20);
}

// ─── Expected JPT1 ───────────────────────────────────────────────────────────
/**
 * JPT1 model (simplified adiabatic combustion + heat transfer):
 *   T_exhaust ≈ T_inlet + ΔT_combustion − ΔT_turbine_work
 *
 * Simplified to phase-dependent empirical relationships calibrated to
 * GTSU-110 ground test envelope.
 */
export function computeExpectedJpt1(
  t:           number,     // elapsed time (s)
  phase:       StartPhase,
  stepperPos:  number,     // 0–255
  oat:         number,     // °C
  nggPct:      number,     // %
): number {
  const oatCorr     = (oat - ISA_OAT) * 0.40;   // 0.4°C per °C OAT deviation
  const fuelFrac    = stepperPos / STEPPER_MAX;   // 0–1

  switch (phase) {
    case 'idle':
      return oat + 2;

    case 'cranking': {
      // Motoring without combustion — JPT1 ≈ ambient + slight compressor heat
      return oat + oatCorr + 2 + t * 0.8;
    }

    case 'light-up': {
      // Ignition: JPT1 rises steeply with fuel fraction and time since light-up (t≈8)
      const tLU = Math.max(0, t - 8);
      return oat + oatCorr + 85 + fuelFrac * 540 * Math.min(1, tLU / 4);
    }

    case 'acceleration': {
      // Ngg-correlated temperature rise
      const tAcc = Math.max(0, t - 12);
      const base  = 355 + fuelFrac * 410;
      return base + oatCorr + (nggPct - 57) * 3.1 + tAcc * 1.2;
    }

    case 'self-sustaining':
    default:
      // Steady-state: primarily fuel command + OAT driven
      return 622 + oatCorr + (fuelFrac - 0.58) * 175;
  }
}

// ─── Expected Ngg (% of max RPM) ─────────────────────────────────────────────
/**
 * Starter torque–speed model:
 *   During cranking: Ngg rises linearly with time (constant starter torque assumption)
 *   After light-up:  Combustion adds turbine work → exponential rise
 *   Self-sustaining: Ngg stabilises at regulatory setpoint (~85 %)
 */
export function computeExpectedNggPct(t: number, phase: StartPhase): number {
  switch (phase) {
    case 'idle':     return 0;
    case 'cranking': return Math.min(48.6, t * 8.9);
    case 'light-up': return 48.6 + Math.max(0, t - 8) * 2.8;
    case 'acceleration': {
      const tAcc = Math.max(0, t - 12);
      return 57.4 + tAcc * 2.72;
    }
    case 'self-sustaining':
    default:
      return 85.4;
  }
}

// ─── Expected P2/P1 ──────────────────────────────────────────────────────────
export function computeExpectedP2p1(nggPct: number, foulingFactor = 0): number {
  const n = Math.max(0, Math.min(1, nggPct / 100));
  return compressorPressureRatio(n, foulingFactor);
}

// ─── Full Physics Baseline ────────────────────────────────────────────────────
export function computePhysicsBaseline(
  t:             number,
  phase:         StartPhase,
  stepperPos:    number,
  oat:           number,
  nggPct:        number,
  foulingFactor  = 0,
): PhysicsBaseline {
  const expJpt1    = computeExpectedJpt1(t, phase, stepperPos, oat, nggPct);
  const expNggPct  = computeExpectedNggPct(t, phase);
  const expP2p1    = computeExpectedP2p1(nggPct, foulingFactor);
  const expFuel    = (stepperPos / STEPPER_MAX) * 8.4;
  const thermalLd  = Math.max(0, Math.min(1, (expJpt1 - 400) / (JPT_GND_LIMIT - 400)));

  // Virtual sensor estimates
  const nggFrac          = Math.max(0, Math.min(1, nggPct / 100));
  // Isentropic compressor efficiency: peaks ~0.82 at design point, degrades with fouling
  const compEff          = Math.max(0.40, 0.82 * (1 - foulingFactor * 0.28) * (nggFrac > 0.1 ? 1 : nggFrac * 10));
  // Thermal gradient estimate: rate of JPT1 rise from physics model
  const expJpt1Prev      = computeExpectedJpt1(Math.max(0, t - 1), phase, stepperPos, oat, nggPct);
  const thermGrad        = Math.max(0, expJpt1 - expJpt1Prev);
  // Combustion efficiency: ~0.97 at self-sustaining; lower during transients
  const combEff          = phase === 'idle' || phase === 'cranking' ? 0
    : phase === 'light-up' ? 0.72 + nggFrac * 0.18
    : 0.92 + nggFrac * 0.05;

  return {
    expectedJpt1:          +expJpt1.toFixed(1),
    expectedNgg:           Math.round((expNggPct / 100) * MAX_NGG_RPM),
    expectedNggPct:        +expNggPct.toFixed(1),
    expectedP2p1:          +expP2p1.toFixed(2),
    expectedFuelFlow:      +expFuel.toFixed(2),
    expectedStartDuration: 25,
    thermalLoad:           +thermalLd.toFixed(2),
    compEfficiency:        +compEff.toFixed(2),
    thermalGradient:       +thermGrad.toFixed(2),
    combustionEfficiency:  +Math.min(1, combEff).toFixed(2),
    timestamp:             new Date(),
  };
}

// ─── Residual Analytics ───────────────────────────────────────────────────────
/**
 * Computes signed residuals for key telemetry parameters.
 * Sigma (noise floor) values derived from HAL GTSU-110 sensor specifications.
 */
export function computeResiduals(
  telemetry: GTSUTelemetry,
  baseline:  PhysicsBaseline,
): ResidualEntry[] {
  const entries: ResidualEntry[] = [];

  const add = (
    parameter:  string,
    unit:       string,
    actual:     number,
    expected:   number,
    sigma:      number,
    confidence: number,
  ) => {
    const residual     = actual - expected;
    const normRes      = sigma > 0 ? residual / sigma : 0;
    const absNorm      = Math.abs(normRes);
    const severityBand: ResidualEntry['severityBand'] =
      absNorm >= 3 ? 'critical' : absNorm >= 2 ? 'warning' : 'normal';
    entries.push({ parameter, channel: parameter, unit, actual: +actual.toFixed(2), expected: +expected.toFixed(2), residual: +residual.toFixed(2), sigma, normalizedResidual: +normRes.toFixed(2), severityBand, confidence });
  };

  add('JPT1',       '°C',  telemetry.jpt1,        baseline.expectedJpt1,    15,    0.94);
  add('Ngg',        '%',   telemetry.nggPct,       baseline.expectedNggPct,  2.0,   0.96);
  add('P2/P1',      '−',   telemetry.p2p1,         baseline.expectedP2p1,    0.06,  0.91);
  add('Fuel Flow',  'kg/h',telemetry.fuelMassFlow,  baseline.expectedFuelFlow, 0.4, 0.89);

  return entries;
}
