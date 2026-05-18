/**
 * telemetrySimulator.ts
 * Enhanced multi-scenario telemetry simulator for GTSU-110.
 *
 * Generates realistic time-series telemetry for all required fault scenarios.
 * Supports variable severity levels and configurable playback speed.
 * Designed to feed the Zustand store in real-time at 1 Hz ticks.
 */

import type { GTSUTelemetry, StartPhase } from '../types/engine';

// ─── Scenario Definitions ─────────────────────────────────────────────────────

export type ExtendedScenario =
  | 'normal'
  | 'hot-start'
  | 'hung-start'
  | 'compressor-fouling'
  | 'sensor-drift'
  | 'fuel-anomaly'
  | 'secu-fault'
  | 'high-vibration'
  | 'thermal-creep'
  | 'data-dropout';

export type SeverityLevel = 'low' | 'medium' | 'high';

export const SCENARIO_LABELS: Record<ExtendedScenario, string> = {
  'normal':             'Normal Start',
  'hot-start':          'Hot Start',
  'hung-start':         'Hung Start',
  'compressor-fouling': 'Compressor Fouling',
  'sensor-drift':       'Sensor Drift',
  'fuel-anomaly':       'Fuel Control Anomaly',
  'secu-fault':         'SECU / BIT Failure',
  'high-vibration':     'High Vibration Event',
  'thermal-creep':      'Thermal Creep Accumulation',
  'data-dropout':       'Communication Dropout',
};

export const SCENARIO_DESCRIPTIONS: Record<ExtendedScenario, string> = {
  'normal':             'Nominal start cycle — JPT1 and Ngg within all limits. Stepper schedule follows normal fuel law.',
  'hot-start':          'Excess fuel causes JPT1 to exceed the 900 °C ground limit. SECU abort logic engages.',
  'hung-start':         'Engine ignites but Ngg stalls below 57.4 % self-sustaining speed. Fuel continues; risk of over-temperature.',
  'compressor-fouling': 'Progressive blade fouling causes P2/P1 to decline below expected; SECU demands higher fuel to maintain speed.',
  'sensor-drift':       'JPT1 thermocouple develops systematic bias; virtual sensor model detects deviation and raises advisory.',
  'fuel-anomaly':       'Stepper motor commands are not reflected in metered fuel flow — command–response mismatch.',
  'secu-fault':         'SECU main processor BIT failure followed by IPS emergency-armed state.',
  'high-vibration':     'Abnormal rotor vibration develops during acceleration phase; bearing wear indicator.',
  'thermal-creep':      'Multiple successive high-JPT1 starts advancing thermal life consumption beyond threshold.',
  'data-dropout':       'MIL-STD-1553B bus intermittent — telemetry dropouts occur; data quality degrades.',
};

export const SCENARIO_RISK: Record<ExtendedScenario, string> = {
  'normal':             'Low',
  'hot-start':          'Critical',
  'hung-start':         'High',
  'compressor-fouling': 'Medium',
  'sensor-drift':       'Medium',
  'fuel-anomaly':       'Medium',
  'secu-fault':         'High',
  'high-vibration':     'High',
  'thermal-creep':      'Medium',
  'data-dropout':       'Low',
};

// ─── Simulation Frame ─────────────────────────────────────────────────────────

export interface SimFrame {
  t:           number;
  jpt1:        number;
  nggPct:      number;
  ngg:         number;
  p2p1:        number;
  fuelFlow:    number;
  stepperPos:  number;
  oat:         number;
  vibration:   number;   // mm/s
  phase:       StartPhase;
  secuHealthy: boolean;
  bitPass:     boolean;
  ipsMode:     0 | 1 | 2;
  milBusHealth: number;
  arinc429Health: number;
  thermalLifeConsumed: number;  // cumulative %
  event?:      string;
  dataQuality: number;  // 0–1
}

// ─── Scenario Generator ───────────────────────────────────────────────────────

const MAX_NGG_RPM   = 22000;
const DURATION      = 60;  // seconds

function noise(spread: number): number {
  return (Math.random() - 0.5) * 2 * spread;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function buildScenarioTrace(
  scenario: ExtendedScenario,
  severity: SeverityLevel = 'medium',
): SimFrame[] {
  const frames: SimFrame[] = [];

  const sevMul = severity === 'low' ? 0.6 : severity === 'high' ? 1.5 : 1.0;
  const oatBase = 28 + noise(4);

  for (let t = 0; t <= DURATION; t++) {
    let nggPct      = 0;
    let jpt1        = oatBase;
    let p2p1        = 1.0;
    let stepperPos  = 0;
    let fuelFlow    = 0;
    let phase: StartPhase = 'idle';
    let secuHealthy = true;
    let bitPass     = true;
    let ipsMode: 0|1|2 = 0;
    let milBus      = 98 + Math.round(noise(2));
    let arinc       = 97 + Math.round(noise(3));
    let vibration   = 0.8 + Math.random() * 0.4;
    let thermalLife = 0;
    let event: string | undefined;
    let dataQuality = 1.0;

    // ── Normal Start ──────────────────────────────────────────────────────────
    if (scenario === 'normal') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase + noise(1); phase = 'cranking';
        if (t === 0) event = 'Start Command Issued';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase + noise(2); stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
        if (t === 4) event = 'Fuel-On / Igniter Active';
      } else if (t < 12) {
        nggPct = 48.5 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 64 + noise(4); stepperPos = 102 + (t - 8) * 10; fuelFlow = 2.0 + (t - 8) * 0.5; phase = 'light-up';
        if (t === 9) event = 'Light-Up Confirmed';
      } else if (t < 25) {
        nggPct = 57.4 + (t - 12) * 2.1; jpt1 = 356 + (t - 12) * 22 + noise(6); stepperPos = 142 + (t - 12) * 1.2; fuelFlow = 4.0 + (t - 12) * 0.18; phase = 'acceleration';
        if (t === 25) event = 'Self-Sustaining Speed';
      } else {
        nggPct = Math.min(85.4, 84 + noise(0.4)); jpt1 = 642 + noise(8); stepperPos = 148; fuelFlow = 6.4 + noise(0.3); phase = 'self-sustaining';
      }
    }

    // ── Hot Start ─────────────────────────────────────────────────────────────
    else if (scenario === 'hot-start') {
      const excess = sevMul * 1.0;
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
        if (t === 0) event = 'Start Command';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.2; jpt1 = oatBase; stepperPos = (t - 3) * 30 * excess; fuelFlow = (t - 3) * 0.72 * excess; phase = 'cranking';
        if (t === 4) event = 'Fuel-On (enriched schedule)';
      } else if (t < 15) {
        nggPct = 48 + (t - 8) * 1.4; jpt1 = 100 + (t - 8) * (148 * excess) + noise(5); stepperPos = 160 + (t - 8) * 5; fuelFlow = 3.5 + (t - 8) * 0.8; phase = 'light-up';
        if (t === 9) event = 'Light-Up — JPT1 rising rapidly';
      } else {
        nggPct = 50 + noise(1); jpt1 = Math.min(980, 900 + (t - 15) * (6 * excess) + noise(4)); stepperPos = 185; fuelFlow = 9.0; phase = 'abort';
        if (t === 15) event = '⚠ HOT START — ABORT COMMANDED';
        secuHealthy = jpt1 > 950 ? false : true;
        ipsMode = jpt1 > 950 ? 1 : 0;
      }
    }

    // ── Hung Start ────────────────────────────────────────────────────────────
    else if (scenario === 'hung-start') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
        if (t === 4) event = 'Fuel-On';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 1.8; jpt1 = 100 + (t - 8) * 42 + noise(3); stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up (weak)';
      } else if (t < 35) {
        nggPct = 53 + Math.sin((t - 12) * 0.5) * (2 * sevMul) + noise(0.5);
        jpt1 = 268 + (t - 12) * (8 * sevMul) + noise(4);
        stepperPos = 145; fuelFlow = 4.5; phase = 'acceleration';
        if (t === 16) event = `⚠ HUNG START — Ngg stalled at ~${nggPct.toFixed(1)}%`;
        vibration = 2.5 + (t - 12) * 0.1;
      } else {
        nggPct = 51; jpt1 = 380 + noise(5); phase = 'abort';
        if (t === 35) event = 'Abort — exceeded max start time';
      }
    }

    // ── Compressor Fouling ────────────────────────────────────────────────────
    else if (scenario === 'compressor-fouling') {
      const foulingRate = 0.016 * sevMul;
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.2; jpt1 = 100 + (t - 8) * 62 + noise(4); stepperPos = 108 + (t - 8) * 12; fuelFlow = 2.2 + (t - 8) * 0.55; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else if (t < 30) {
        nggPct = 57.4 + (t - 12) * 1.8; jpt1 = 350 + (t - 12) * 24 + noise(5); stepperPos = 155 + (t - 12) * 2; fuelFlow = 4.8 + (t - 12) * 0.2; phase = 'acceleration';
        if (t === 18) event = '⚠ P2/P1 drop detected — fouling signature';
        p2p1 = Math.max(3.1, 3.86 - t * foulingRate);
      } else {
        nggPct = Math.min(84, 82 + noise(0.4)); jpt1 = Math.min(720, 690 + noise(6)); stepperPos = 162; fuelFlow = 7.1 + noise(0.3); phase = 'self-sustaining';
        p2p1 = Math.max(3.0, 3.86 - t * foulingRate);
      }
    }

    // ── Sensor Drift ──────────────────────────────────────────────────────────
    else if (scenario === 'sensor-drift') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 63 + noise(3); stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else {
        nggPct = Math.min(85.4, 57.4 + (t - 12) * 2.1); jpt1 = 356 + (t - 12) * 22; stepperPos = 148; fuelFlow = 6.4; phase = t < 25 ? 'acceleration' : 'self-sustaining';
        // Drift onset after t=28
        const driftOffset = t > 28 ? (t - 28) * (12 * sevMul) : 0;
        jpt1 += driftOffset + noise(3);
        if (t === 30) event = '⚠ JPT1 sensor drift detected — virtual model active';
      }
    }

    // ── Fuel Anomaly ──────────────────────────────────────────────────────────
    else if (scenario === 'fuel-anomaly') {
      if (t < 8) {
        nggPct = t < 3 ? t * 9 : 27 + (t - 3) * 4.3; jpt1 = oatBase + noise(2); stepperPos = t < 3 ? 0 : (t - 3) * 20; fuelFlow = t < 3 ? 0 : (t - 3) * 0.42; phase = 'cranking';
        if (t === 4) event = 'Fuel-On';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 63; stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else {
        const cmdFlow = (stepperPos / 255) * 8.4;
        const anomaly = t > 22 ? Math.sin((t - 22) * 0.8) * 1.8 * sevMul : 0;
        nggPct = Math.min(85, 57 + (t - 12) * 2.0);
        jpt1   = 350 + (t - 12) * 20 + noise(5);
        stepperPos = 148 + (t > 22 ? Math.round(Math.sin((t - 22) * 0.6) * 18 * sevMul) : 0);
        fuelFlow = cmdFlow + anomaly;   // fuel flow doesn't match command
        phase    = t < 25 ? 'acceleration' : 'self-sustaining';
        if (t === 24) event = '⚠ Fuel metering mismatch detected';
      }
    }

    // ── SECU Fault ────────────────────────────────────────────────────────────
    else if (scenario === 'secu-fault') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.2; jpt1 = 100 + (t - 8) * 62; stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else {
        nggPct = Math.min(84, 57 + (t - 12) * 1.9); jpt1 = 350 + (t - 12) * 18; stepperPos = 148; fuelFlow = 6.0; phase = t < 25 ? 'acceleration' : 'self-sustaining';
        if (t >= 20) {
          secuHealthy = false; bitPass = false;
          ipsMode     = t >= 25 ? 1 : 0;
          milBus      = Math.max(55, 98 - (t - 20) * 4);
          arinc       = Math.max(60, 97 - (t - 20) * 3);
          if (t === 20) event = '⚠ SECU BIT FAIL — Main processor fault';
          if (t === 25) event = '⚠ IPS Emergency Shutdown Armed';
        }
      }
    }

    // ── High Vibration ────────────────────────────────────────────────────────
    else if (scenario === 'high-vibration') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 63; stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else {
        nggPct = Math.min(85, 57 + (t - 12) * 2.0); jpt1 = 352 + (t - 12) * 20 + noise(5); stepperPos = 148; fuelFlow = 6.4; phase = t < 25 ? 'acceleration' : 'self-sustaining';
        vibration = t > 16 ? 1.2 + (t - 16) * (0.35 * sevMul) + Math.sin(t) * 0.8 : 1.0;
        if (t === 18) event = '⚠ Vibration rising — rotor imbalance signature';
      }
    }

    // ── Thermal Creep ─────────────────────────────────────────────────────────
    else if (scenario === 'thermal-creep') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 65 + noise(4); stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
        if (t === 9) event = 'Light-Up';
      } else {
        nggPct = Math.min(85, 57 + (t - 12) * 2.1); jpt1 = 360 + (t - 12) * 26 + noise(6); stepperPos = 150; fuelFlow = 6.5; phase = t < 25 ? 'acceleration' : 'self-sustaining';
        thermalLife = Math.min(55, (t - 12) * (1.4 * sevMul));
        if (t === 22) event = '⚠ Thermal life accumulation threshold breached';
      }
    }

    // ── Data Dropout ──────────────────────────────────────────────────────────
    else if (scenario === 'data-dropout') {
      if (t < 3) {
        nggPct = t * 9; jpt1 = oatBase; phase = 'cranking';
      } else if (t < 8) {
        nggPct = 27 + (t - 3) * 4.3; jpt1 = oatBase; stepperPos = (t - 3) * 20; fuelFlow = (t - 3) * 0.42; phase = 'cranking';
      } else if (t < 12) {
        nggPct = 48 + (t - 8) * 2.3; jpt1 = 100 + (t - 8) * 63; stepperPos = 100; fuelFlow = 2.0; phase = 'light-up';
      } else {
        nggPct = Math.min(85, 57 + (t - 12) * 2.0); jpt1 = 350 + (t - 12) * 20 + noise(5); stepperPos = 148; fuelFlow = 6.4; phase = t < 25 ? 'acceleration' : 'self-sustaining';
        // Periodic dropout events
        const dropout = (t % 12 < 3) || (t % 17 < 2);
        if (dropout) {
          milBus  = Math.max(30, milBus - 40);
          arinc   = Math.max(40, arinc - 35);
          dataQuality = 0.15 + Math.random() * 0.25;
          if (t === 14 || t === 26 || t === 39) event = '⚠ Telemetry dropout — 1553B bus intermittent';
        } else {
          dataQuality = 0.95 + Math.random() * 0.05;
        }
      }
    }

    // ── P2/P1 for non-fouling scenarios ──────────────────────────────────────
    if (scenario !== 'compressor-fouling') {
      if (t < 8)  p2p1 = 1.0 + t * 0.038;
      else if (t < 12) p2p1 = 1.30 + (t - 8) * 0.12;
      else         p2p1 = Math.min(3.86, 1.78 + (t - 12) * 0.086) + noise(0.02);
    }

    const clampedNggPct = Math.max(0, nggPct) + noise(0.15);

    frames.push({
      t,
      jpt1:               Math.max(oatBase, +jpt1.toFixed(1) + noise(2)),
      nggPct:             +Math.max(0, Math.min(100, clampedNggPct)).toFixed(2),
      ngg:                Math.round(Math.max(0, clampedNggPct / 100) * MAX_NGG_RPM),
      p2p1:               +Math.max(1.0, Math.min(4.2, p2p1)).toFixed(2),
      fuelFlow:           +Math.max(0, fuelFlow).toFixed(2),
      stepperPos:         Math.round(Math.max(0, Math.min(255, stepperPos))),
      oat:                +(oatBase + noise(0.5)).toFixed(1),
      vibration:          +Math.max(0, vibration).toFixed(2),
      phase,
      secuHealthy,
      bitPass,
      ipsMode,
      milBusHealth:       Math.max(0, Math.min(100, milBus)),
      arinc429Health:     Math.max(0, Math.min(100, arinc)),
      thermalLifeConsumed: +Math.max(0, thermalLife).toFixed(1),
      event,
      dataQuality:        +Math.max(0, Math.min(1, dataQuality)).toFixed(2),
    });
  }

  return frames;
}

/** Convert a SimFrame to the store's GTSUTelemetry shape */
export function frameToTelemetry(frame: SimFrame, base: GTSUTelemetry): GTSUTelemetry {
  return {
    ...base,
    timestamp:      new Date(),
    jpt1:           frame.jpt1,
    ngg:            frame.ngg,
    nggPct:         frame.nggPct,
    p2p1:           frame.p2p1,
    oat:            frame.oat,
    stepperPosition: frame.stepperPos,
    fuelMassFlow:   frame.fuelFlow,
    secuMainHealthy: frame.secuHealthy,
    bitPass:        frame.bitPass,
    ipsMode:        frame.ipsMode,
    milBusHealth:   frame.milBusHealth,
    arinc429Health: frame.arinc429Health,
    startPhase:     frame.phase,
    startDuration:  frame.t,
  };
}
