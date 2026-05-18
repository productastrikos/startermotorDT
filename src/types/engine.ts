// GTSU-110 Gas Turbine Starter Engine — Digital Twin Types

export type ThresholdStatus = "critical" | "warning" | "normal";

export type StartPhase =
  | "idle"
  | "cranking"
  | "light-up"
  | "acceleration"
  | "self-sustaining"
  | "abort";

export type StartScenario = "normal" | "hot-start" | "hung-start" | "fouling" | "sensor-drift";

// ─── Core telemetry (mirrors SECU ARINC/MIL-STD-1553B outputs) ─────────────

export interface GTSUTelemetry {
  timestamp: Date;
  /** Jet Pipe Temperature °C — ground limit 900, in-flight 1020 */
  jpt1: number;
  /** Gas Generator Speed RPM — light-up detection > 12625 */
  ngg: number;
  /** Ngg as % of max (≈ 22000 RPM) */
  nggPct: number;
  /** Compressor pressure ratio (P2/P1) — dimensionless */
  p2p1: number;
  /** Outside Air Temperature °C */
  oat: number;
  /** 3-phase stepper motor position (discrete steps 0-255) */
  stepperPosition: number;
  /** Estimated fuel mass flow kg/h derived from stepper */
  fuelMassFlow: number;
  /** SECU main-processor health: true = healthy */
  secuMainHealthy: boolean;
  /** Built-In-Test pass/fail */
  bitPass: boolean;
  /** IPS mode: 0=normal monitoring, 1=emergency shutdown armed, 2=degraded open-loop */
  ipsMode: 0 | 1 | 2;
  /** MIL-STD-1553B bus health 0–100 */
  milBusHealth: number;
  /** ARINC 429 bus health 0–100 */
  arinc429Health: number;
  /** Start sequence duration seconds */
  startDuration: number;
  /** Current phase in the start sequence */
  startPhase: StartPhase;
}

// ─── PHM / Prognostics ───────────────────────────────────────────────────────

export interface GTSUHealthState {
  timestamp: Date;
  starterReadiness: number;
  rul: number;
  rulCycles: number;
  compressorFoulingIndex: number;
  creepLifeConsumption: number;
  thermalFatigueAccumulation: number;
  hotStartRisk: number;
  hungStartProbability: number;
  virtualSensorConfidence: number;
  baselineJpt1: number;
  baselineP2p1: number;
  residualJpt1: number;
  residualP2p1: number;
  /** Compressor component health score 0–100 (100 = new, 0 = failed) */
  compressorHealth: number;
  /** Combustor / hot-section health score 0–100 */
  combustorHealth: number;
}

// ─── Start-sequence time-series ──────────────────────────────────────────────

export interface StartCycleSample {
  t: number;
  ngg: number;
  jpt1: number;
  p2p1: number;
  stepperPos: number;
  fuelFlow: number;
  phase: StartPhase;
  event?: string;
}

// ─── Structural / thermal FEA data ──────────────────────────────────────────

export interface FEAData {
  timestamp: Date;
  componentName: string;
  maxStress: number;
  yieldStrength: number;
  stressToYieldRatio: number;
  fatigueLifeRemaining: number;
  thermalStressMargin: number;
  displacement: number;
  material: string;
  creepParameter?: number;
  temperature: number;
}

// ─── FMEA ────────────────────────────────────────────────────────────────────

export interface FMEAData {
  timestamp: Date;
  componentName: string;
  failureMode: string;
  failureMechanism: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  diagnosticSignature: string;
  recommendedAction: string;
  mtbf?: number;
}

// ─── AI / PHM recommendations ───────────────────────────────────────────────

export interface AIRecommendation {
  id: string;
  timestamp: Date;
  recommendationType: "maintenance" | "optimization" | "alert";
  priority: "critical" | "warning" | "info";
  title: string;
  description: string;
  affectedComponent: string;
  confidenceScore: number;
  status: "pending" | "acknowledged" | "resolved";
  detectedCondition?: string;
}

// ─── V&V / Compliance ────────────────────────────────────────────────────────

export interface VVComplianceItem {
  standard: string;
  description: string;
  status: "aligned" | "in-progress" | "planned";
  notes: string;
}

// ─── Legacy alias kept so existing components compile ────────────────────────

export interface PerformanceMetric extends GTSUTelemetry {
  flightCycle?: number;
  systemAvailability?: number;
  remainingUsefulLife?: number;
  engineEfficiency?: number;
}

export interface VibrationData {
  timestamp: Date;
  sensorLocation: string;
  amplitude: number;
  frequency: number;
  measurementType: "displacement" | "velocity" | "acceleration";
}

export interface DesignIteration {
  iterationNumber: number;
  timestamp: Date;
  optimizationScore: number;
  compressorEfficiency: number;
  pressureRatio: number;
  thermalStressMargin: number;
  designParameters: Record<string, number>;
  fuelStepperBias: number;
  startDuration: number;
}

// ─── Extended Telemetry (with vibration + thermal life) ──────────────────────

export interface ExtendedTelemetry extends GTSUTelemetry {
  vibration:           number;   // mm/s
  thermalLifeConsumed: number;   // cumulative % of thermal life budget
  dataQuality:         number;   // 0–1 per-frame data integrity
  cumulativeStarts:    number;   // total start count for lifecycle tracking
}

// ─── Maintenance Actions ─────────────────────────────────────────────────────

export type MaintenancePriority = 'urgent' | 'high' | 'medium' | 'low';
export type MaintenanceStatus   = 'open' | 'acknowledged' | 'in-progress' | 'closed';

export interface MaintenanceAction {
  id:                string;
  priority:          MaintenancePriority;
  action:            string;
  component:         string;
  reason:            string;
  evidence:          string[];
  estimatedDowntime: string;   // e.g. "4 hours"
  tradeRequired:     string;   // e.g. "Avionics Tech"
  inspectionItems:   string[];
  status:            MaintenanceStatus;
  linkedFaultId?:    string;
  createdAt:         Date;
  updatedAt:         Date;
}

// ─── Extended Start Scenario ─────────────────────────────────────────────────

export type ExtendedStartScenario =
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

