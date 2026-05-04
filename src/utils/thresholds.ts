import { ThresholdStatus } from "../types/engine";

export const getThresholdStatus = (value: number, metric: string): ThresholdStatus => {
  const thresholds: Record<string, { critical: (v: number) => boolean; warning: (v: number) => boolean }> = {
    // ── GTSU-110 Telemetry Thresholds ──────────────────────────────────────────
    /** JPT1 ground ops: warn ≥ 820°C, critical ≥ 900°C */
    jpt1: {
      critical: (v) => v >= 900,
      warning: (v) => v >= 820 && v < 900,
    },
    /** Ngg: warn if below light-up threshold during start, critical very low */
    ngg: {
      critical: (v) => v < 10000,
      warning: (v) => v >= 10000 && v < 12625,
    },
    nggPct: {
      critical: (v) => v < 45,
      warning: (v) => v >= 45 && v < 57,
    },
    /** P2/P1: warn if 10% below nominal 3.86, critical if 20% below */
    p2p1: {
      critical: (v) => v < 3.09,
      warning: (v) => v >= 3.09 && v < 3.47,
    },
    /** Stepper position: warn if at high fuel (>200 steps), critical >230 */
    stepperPosition: {
      critical: (v) => v > 230,
      warning: (v) => v >= 200 && v <= 230,
    },
    fuelMassFlow: {
      critical: (v) => v > 9,
      warning: (v) => v >= 7.5 && v <= 9,
    },
    milBusHealth: {
      critical: (v) => v < 80,
      warning: (v) => v >= 80 && v < 95,
    },
    arinc429Health: {
      critical: (v) => v < 80,
      warning: (v) => v >= 80 && v < 95,
    },
    startDuration: {
      critical: (v) => v > 65,
      warning: (v) => v >= 52 && v <= 65,
    },
    // ── PHM / Health indices ──────────────────────────────────────────────────
    starterReadiness: {
      critical: (v) => v < 60,
      warning: (v) => v >= 60 && v < 80,
    },
    rul: {
      critical: (v) => v < 100,
      warning: (v) => v >= 100 && v < 250,
    },
    compressorFoulingIndex: {
      critical: (v) => v > 50,
      warning: (v) => v >= 25 && v <= 50,
    },
    creepLifeConsumption: {
      critical: (v) => v > 80,
      warning: (v) => v >= 40 && v <= 80,
    },
    thermalFatigueAccumulation: {
      critical: (v) => v > 75,
      warning: (v) => v >= 35 && v <= 75,
    },
    hotStartRisk: {
      critical: (v) => v > 60,
      warning: (v) => v >= 30 && v <= 60,
    },
    hungStartProbability: {
      critical: (v) => v > 50,
      warning: (v) => v >= 20 && v <= 50,
    },
    virtualSensorConfidence: {
      critical: (v) => v < 0.7,
      warning: (v) => v >= 0.7 && v < 0.85,
    },
    // ── FEA ──────────────────────────────────────────────────────────────────
    stressToYieldRatio: {
      critical: (v) => v > 0.9,
      warning: (v) => v >= 0.75 && v <= 0.9,
    },
    thermalStressMargin: {
      critical: (v) => v < 15,
      warning: (v) => v >= 15 && v < 30,
    },
    fatigueLifeRemaining: {
      critical: (v) => v < 20,
      warning: (v) => v >= 20 && v < 40,
    },
  };

  const threshold = thresholds[metric];
  if (!threshold) return "normal";
  if (threshold.critical(value)) return "critical";
  if (threshold.warning(value)) return "warning";
  return "normal";
};

export const getStatusColor = (status: ThresholdStatus): string => {
  switch (status) {
    case "critical": return "#ef4444";
    case "warning":  return "#f59e0b";
    default:         return "#10b981";
  }
};

export const getStatusColorClass = (status: ThresholdStatus): string => {
  switch (status) {
    case "critical": return "text-red-500";
    case "warning":  return "text-amber-500";
    default:         return "text-green-500";
  }
};
