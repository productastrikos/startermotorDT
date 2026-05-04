import { useState } from "react";
import {
  Brain,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  LineChart as LineChartIcon,
  RefreshCcw,
  CheckCircle,
  ArrowRight,
  Info,
  Lightbulb,
  Network,
} from "lucide-react";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import ReactECharts from "echarts-for-react";

interface OptimizationKPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  status: "optimal" | "warning" | "critical";
  trend: { x: number; y: number }[];
  aiAdvisory: string;
  suggestedActions: string[];
  targetVsActual: { metric: string; target: number; actual: number }[];
}

interface DesignInput {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  constraint?: { min: number; max: number };
  description: string;
  trend: { x: number; y: number }[];
  aiAdvisory: string;
  recommendedValue: number;
}

interface OptimizationVariable {
  id: string;
  label: string;
  baseline: number;
  current: number;
  optimized: number;
  unit: string;
  impact: number;
  description: string;
  kpiImpacts: {
    thrust: number;
    sfc: number;
    stress: number;
    fatigueLife: number;
  };
  aiRationale: string;
}

interface ParetoPoint {
  id: string;
  thrust: number;
  sfc: number;
  stress: number;
  fatigueLife: number;
  label: string;
  selected: boolean;
  tradeoffAnalysis: string;
  optimalityScore: number;
  aiRecommendation: string;
}

interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status: "optimal" | "warning" | "critical";
  type: "component" | "kpi";
  affectedKPIs?: string[];
  aiAdvisory?: string;
  impactValues?: { kpi: string; impact: string; value: number }[];
}

interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
  impact: string;
}

interface AIRecommendation {
  id: string;
  title: string;
  variable: string;
  currentValue: number;
  recommendedValue: number;
  impact: string;
  rationale: string;
  expectedImprovement: {
    thrust: number;
    sfc: number;
    stress: number;
  };
  implementationSteps: string[];
  confidence: number;
}

export function SmartOptimizationPage() {
  const [selectedKPI, setSelectedKPI] = useState<OptimizationKPI | null>(null);
  const [selectedInput, setSelectedInput] = useState<DesignInput | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<OptimizationVariable | null>(null);
  const [selectedParetoPoint, setSelectedParetoPoint] = useState<ParetoPoint | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showNetwork, setShowNetwork] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [kpis, setKpis] = useState<OptimizationKPI[]>([
    {
      id: "thrust",
      label: "Start Duration",
      value: 43,
      unit: "s",
      target: 40,
      status: "warning",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 52 - i * 0.5 })),
      aiAdvisory:
        "Start duration 7.5% above target (43s vs 40s). PINN surrogate model suggests stepper schedule bias of −6 steps reduces duration by 4.2s while maintaining JPT1 < 780°C during acceleration phase.",
      suggestedActions: [
        "Apply stepper schedule early-ramp bias of −6 steps",
        "Verify crank speed ramp profile (nominal: 4500 RPM/s)",
        "Check igniter spark timing consistency across start cycles",
      ],
      targetVsActual: [
        { metric: "Ground Start", target: 40, actual: 43 },
        { metric: "Hot Day Start", target: 48, actual: 51 },
        { metric: "In-Flight 4 km", target: 55, actual: 58 },
      ],
    },
    {
      id: "sfc",
      label: "Peak JPT1",
      value: 648,
      unit: "°C",
      target: 720,
      status: "optimal",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 620 + i * 1.4 })),
      aiAdvisory:
        "Peak JPT1 of 648°C is 72°C below ground warning limit. PINN baseline shows +13°C residual deviation. Hot-start risk index elevated at 12%. Pre-check fuel atomisation nozzle before next start cycle.",
      suggestedActions: [
        "Maintain stepper schedule at nominal −4 steps bias",
        "Pre-check fuel nozzle atomisation pattern at next MRO",
        "Monitor JPT1 gradient (°C/s) over next 5 start cycles",
        "Verify combustor liner integrity at 18% creep life consumption",
      ],
      targetVsActual: [
        { metric: "Light-Up", target: 135, actual: 143 },
        { metric: "Acceleration", target: 600, actual: 621 },
        { metric: "Self-Sustaining", target: 720, actual: 648 },
      ],
    },
    {
      id: "fatigueLife",
      label: "P2/P1 Ratio",
      value: 3.74,
      unit: "",
      target: 3.86,
      status: "warning",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 3.86 - i * 0.006 })),
      aiAdvisory:
        "P2/P1 compressor pressure ratio 3.1% below baseline (3.86). PINN residual confirms progressive compressor fouling — fouling index at 24%. Stepper fuel demand increased 8.5% to compensate Ngg.",
      suggestedActions: [
        "Schedule compressor wash within 20 start cycles",
        "Verify P2/P1 transducer calibration at next ground run",
        "Cross-check stepper fuel demand increase vs fouling trend",
        "Review compressor wash schedule interval",
      ],
      targetVsActual: [
        { metric: "Nominal", target: 3.86, actual: 3.74 },
        { metric: "Min Acceptable", target: 3.50, actual: 3.74 },
        { metric: "Fouling Alert", target: 3.60, actual: 3.74 },
      ],
    },
    {
      id: "maxStress",
      label: "Hot Start Risk",
      value: 12,
      unit: "%",
      target: 8,
      status: "warning",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 5 + i * 0.35 })),
      aiAdvisory:
        "Hot start risk index at 12% — 4% above target. Kalman state estimator shows JPT1 gradient exceeding nominal by 12°C/s over last 3 starts. PINN baseline deviation at +13°C. Pre-check fuel nozzle atomisation.",
      suggestedActions: [
        "Pre-check fuel nozzle atomisation before next start attempt",
        "Verify stepper schedule fuel enrichment limits are nominal",
        "Review last 3 start JPT1 gradient profiles in PHM dashboard",
        "Confirm SECU abort threshold is set to 900°C (ground limit)",
      ],
      targetVsActual: [
        { metric: "JPT1 Gradient", target: 60, actual: 72 },
        { metric: "PINN Residual", target: 8, actual: 13 },
        { metric: "Fuel Flow Dev.", target: 5, actual: 8.5 },
      ],
    },
    {
      id: "rpn",
      label: "FMEA Max RPN",
      value: 108,
      unit: "",
      target: 80,
      status: "critical",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 115 - i * 0.5 })),
      aiAdvisory:
        "Highest FMEA RPN is 108 (Hot Start — S:9, O:3, D:4). 35% above target RPN of 80. SECU abort logic mitigates severity; focus on reducing occurrence frequency via fuel nozzle pre-check.",
      suggestedActions: [
        "Pre-flight fuel nozzle atomisation check (reduces occurrence)",
        "Verify JPT1 gradient monitoring sensitivity in SECU BIT",
        "Schedule combustor liner inspection at 18% creep life",
        "Review start fuel schedule for excess enrichment reduction",
      ],
      targetVsActual: [
        { metric: "Hot Start RPN", target: 80, actual: 108 },
        { metric: "Compressor Fouling", target: 80, actual: 105 },
        { metric: "Sensor Drift", target: 60, actual: 84 },
      ],
    },
  ]);

  const [designInputs, setDesignInputs] = useState<DesignInput[]>([
    {
      id: "targetThrust",
      label: "Target Start Duration",
      value: 40,
      min: 35,
      max: 60,
      unit: "s",
      description: "Target start sequence completion time (s) — GTSU-110 nominal <45s",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 52 - i * 0.6 })),
      aiAdvisory: "Target of 40s is achievable with stepper schedule bias optimisation. Current 43s reflects fouling-related fuel demand increase. Address fouling index first.",
      recommendedValue: 40,
    },
    {
      id: "targetSFC",
      label: "JPT1 Warning Limit",
      value: 720,
      min: 600,
      max: 900,
      unit: "°C",
      constraint: { min: 600, max: 900 },
      description: "JPT1 warning threshold — ground limit 900°C / flight limit 1020°C (CEMILAC/DGAQA)",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 620 + i * 1.4 })),
      aiAdvisory: "JPT1 warning limit set 180°C below ground abort threshold. Current peak 648°C is 72°C below warning. PINN residual trending up +13°C — monitor closely.",
      recommendedValue: 720,
    },
    {
      id: "maxTemp",
      label: "Light-Up JPT1 Threshold",
      value: 135,
      min: 100,
      max: 200,
      unit: "°C",
      constraint: { min: 100, max: 200 },
      description: "JPT1 detection threshold for successful light-up confirmation (GTSU-110: >135°C)",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 130 + Math.sin(i / 3) * 5 })),
      aiAdvisory:
        "Light-up JPT1 threshold at 135°C nominal. Current average light-up JPT1 is 143°C — 8°C margin above threshold. Adequate for reliable light-up detection.",
      recommendedValue: 135,
    },
    {
      id: "altitude",
      label: "In-Flight Start Altitude",
      value: 4000,
      min: 0,
      max: 6000,
      unit: "m",
      description: "Maximum altitude for in-flight start capability (GTSU-110 rated to 6 km)",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 3000 + i * 50 })),
      aiAdvisory: "GTSU-110 in-flight start capability rated to 6 km. Start logic optimised for 4 km nominal envelope. Colder OAT at altitude improves JPT1 margin but increases crank energy.",
      recommendedValue: 4000,
    },
    {
      id: "ambientTemp",
      label: "OAT (Ground)",
      value: 35,
      min: -20,
      max: 55,
      unit: "°C",
      description: "Outside Air Temperature at start location — affects fuel/air ratio and JPT1",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: 28 + Math.sin(i / 4) * 8 })),
      aiAdvisory: "Hot-day OAT of 35°C increases JPT1 risk. Stepper schedule should be adjusted for high-OAT conditions. SECU hot-start detection sensitivity increased above 40°C OAT.",
      recommendedValue: 35,
    },
    {
      id: "maxStressLimit",
      label: "Stepper Bias Offset",
      value: -4,
      min: -20,
      max: 10,
      unit: "steps",
      constraint: { min: -20, max: 10 },
      description: "Fuel stepper early-ramp schedule offset (negative = earlier fuel advance, reduces start duration)",
      trend: Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: -i * 0.2 })),
      aiAdvisory: "Current bias of −4 steps provides good start duration vs JPT1 margin tradeoff. Recommended optimum is −6 steps (saves 4.2s duration, JPT1 stays <780°C).",
      recommendedValue: -6,
    },
  ]);

  const [optimizationVars, setOptimizationVars] = useState<OptimizationVariable[]>([
    {
      id: "bladeChord",
      label: "Stepper Bias",
      baseline: 0,
      current: -4,
      optimized: -6,
      unit: "steps",
      impact: 3.2,
      description: "Fuel stepper schedule bias — negative values advance fuel earlier to reduce start duration",
      kpiImpacts: { thrust: 3.2, sfc: -1.1, stress: 2.5, fatigueLife: -1.8 },
      aiRationale:
        "Bias of −6 steps reduces start duration by 4.2s (3.2% improvement) by advancing fuel enrichment during cranking phase. JPT1 stays below 780°C in PINN validation on 500 synthetic cycles.",
    },
    {
      id: "bladeTwist",
      label: "Light-Up Enrichment",
      baseline: 2.0,
      current: 2.2,
      optimized: 2.15,
      unit: "kg/h",
      impact: 2.8,
      description: "Fuel enrichment at light-up phase — higher values improve ignition reliability at cold OAT",
      kpiImpacts: { thrust: 2.8, sfc: -0.6, stress: -1.2, fatigueLife: 1.5 },
      aiRationale:
        "Enrichment of 2.15 kg/h at light-up phase balances ignition reliability vs JPT1 overshoot risk. Reduction from 2.2 to 2.15 reduces hot-start risk by 8% with negligible impact on light-up probability.",
    },
    {
      id: "bladeThickness",
      label: "Crank Speed Target",
      baseline: 4500,
      current: 4500,
      optimized: 4800,
      unit: "RPM",
      impact: -1.5,
      description: "Starter crank speed during cranking phase — higher values reduce time to light-up",
      kpiImpacts: { thrust: -1.5, sfc: 0.8, stress: -4.2, fatigueLife: 5.8 },
      aiRationale:
        "Increasing crank speed to 4800 RPM reduces cranking phase duration by ~2s. Trade-off: slightly higher starter motor current draw. Ensures reliable Ngg acceleration to 12,625 RPM light-up threshold.",
    },
    {
      id: "bladeCount",
      label: "Igniter Timing",
      baseline: 0,
      current: 0,
      optimized: -0.5,
      unit: "s",
      impact: 1.8,
      description: "Igniter spark timing offset relative to fuel-on command (negative = earlier spark, improves light-up reliability)",
      kpiImpacts: { thrust: 1.8, sfc: -0.3, stress: 0.5, fatigueLife: 0.2 },
      aiRationale: "Advancing igniter timing by 0.5s relative to fuel-on improves light-up probability at cold OAT (−10°C) and reduces light-up JPT1 gradient. Minimal effect on nominal starts.",
    },
    {
      id: "pressureRatio",
      label: "Compressor Wash Interval",
      baseline: 200,
      current: 160,
      optimized: 175,
      unit: "cycles",
      impact: 4.5,
      description: "Interval between compressor washes (start cycles) — shorter intervals reduce fouling but increase MRO cost",
      kpiImpacts: { thrust: 4.5, sfc: -2.8, stress: 3.8, fatigueLife: -2.1 },
      aiRationale:
        "Reducing wash interval from 200 to 175 cycles recovers P2/P1 to baseline 3.86. Fouling index currently at 24% — 80% of wash trigger threshold. Wash at 175 cycles prevents fouling-driven performance loss.",
    },
    {
      id: "coolingFlow",
      label: "JPT1 Abort Margin",
      baseline: 50,
      current: 50,
      optimized: 45,
      unit: "°C",
      impact: -0.8,
      description: "Safety margin below JPT1 ground limit (900°C) before SECU abort trigger — currently 252°C from limit",
      kpiImpacts: { thrust: -0.8, sfc: 0.6, stress: -5.2, fatigueLife: 8.5 },
      aiRationale:
        "Current JPT1 peak is 648°C vs 900°C abort limit — 252°C margin. Tightening abort margin to 45°C below warning threshold improves abort sensitivity. Hot-start risk index elevated at 12% warrants monitoring.",
    },
    {
      id: "casingClearance",
      label: "Ngg Light-Up Threshold",
      baseline: 12625,
      current: 12625,
      optimized: 12800,
      unit: "RPM",
      impact: 1.2,
      description: "Ngg threshold for light-up detection and fuel schedule phase transition (GTSU-110 nominal: 12,625 RPM)",
      kpiImpacts: { thrust: 1.2, sfc: -0.9, stress: 0.1, fatigueLife: -0.2 },
      aiRationale:
        "Nominal GTSU-110 light-up Ngg is 12,625 RPM. Raising threshold to 12,800 RPM allows more stable acceleration before full fuel schedule handover, slightly reducing hot-start risk.",
    },
  ]);

  const [paretoPoints, setParetoPoints] = useState<ParetoPoint[]>([
    {
      id: "p1",
      thrust: 148000,
      sfc: 0.56,
      stress: 720,
      fatigueLife: 52000,
      label: "Conservative",
      selected: false,
      tradeoffAnalysis: "Prioritizes component life and reliability over peak performance. 2% thrust reduction traded for 47% longer fatigue life.",
      optimalityScore: 72,
      aiRecommendation: "Recommended for extended service intervals. Low stress ensures 52,000 cycle life with minimal maintenance.",
    },
    {
      id: "p2",
      thrust: 150000,
      sfc: 0.58,
      stress: 780,
      fatigueLife: 42000,
      label: "Baseline",
      selected: false,
      tradeoffAnalysis: "Balanced design meeting all requirements. Provides target thrust with acceptable SFC and stress levels.",
      optimalityScore: 85,
      aiRecommendation: "Optimal baseline configuration. Meets thrust target while maintaining 42,000 cycle life. No immediate changes recommended.",
    },
    {
      id: "p3",
      thrust: 152000,
      sfc: 0.58,
      stress: 820,
      fatigueLife: 35400,
      label: "Current",
      selected: true,
      tradeoffAnalysis: "Exceeds thrust target by 1.3% but stress exceeds limit by 9.3%. Fatigue life 29% below target requires mitigation.",
      optimalityScore: 65,
      aiRecommendation:
        "CAUTION: High stress configuration. Recommend moving toward Baseline or Conservative point. Apply shot peening to extend life.",
    },
    {
      id: "p4",
      thrust: 155000,
      sfc: 0.62,
      stress: 880,
      fatigueLife: 28000,
      label: "Aggressive",
      selected: false,
      tradeoffAnalysis: "Maximum thrust at expense of efficiency and life. Stress at material limit. 44% SFC penalty vs Conservative.",
      optimalityScore: 48,
      aiRecommendation: "NOT RECOMMENDED: Critical stress levels require material upgrade to Inconel 718. Fatigue life only 28,000 cycles.",
    },
    {
      id: "p5",
      thrust: 145000,
      sfc: 0.54,
      stress: 680,
      fatigueLife: 58000,
      label: "Efficient",
      selected: false,
      tradeoffAnalysis: "Maximizes fuel efficiency and component life. 3.3% thrust reduction yields 7% SFC improvement and 64% life extension.",
      optimalityScore: 78,
      aiRecommendation:
        "Excellent for missions prioritizing endurance. Best SFC and longest life (58,000 cycles). Consider for long-range applications.",
    },
  ]);

  // const networkNodes: NetworkNode[] = [
  //   {
  //     id: "compressor",
  //     label: "Compressor",
  //     x: 150,
  //     y: 200,
  //     status: "optimal",
  //     type: "component",
  //     affectedKPIs: ["Thrust", "SFC", "Pressure Ratio"],
  //     aiAdvisory:
  //       "Compressor operating at optimal efficiency (86.5%). Stage loading well-balanced. Current pressure ratio of 44 provides excellent thrust contribution.",
  //     impactValues: [
  //       { kpi: "Thrust", impact: "+4.5%", value: 6750 },
  //       { kpi: "SFC", impact: "-1.2%", value: -0.007 },
  //       { kpi: "Efficiency", impact: "+2.8%", value: 2.8 },
  //     ],
  //   },
  //   {
  //     id: "combustor",
  //     label: "Combustor",
  //     x: 300,
  //     y: 200,
  //     status: "warning",
  //     type: "component",
  //     affectedKPIs: ["SFC", "Temperature", "Emissions"],
  //     aiAdvisory:
  //       "Combustor efficiency at 98.2% but pattern factor needs optimization. Consider refining fuel-air mixing to reduce hot spots and improve SFC by additional 2%.",
  //     impactValues: [
  //       { kpi: "SFC", impact: "+3.1%", value: 0.017 },
  //       { kpi: "Temperature", impact: "TIT 1600°C", value: 1600 },
  //       { kpi: "Pattern Factor", impact: "0.18", value: 0.18 },
  //     ],
  //   },
  //   {
  //     id: "turbine",
  //     label: "Turbine",
  //     x: 450,
  //     y: 200,
  //     status: "critical",
  //     type: "component",
  //     affectedKPIs: ["Stress", "Fatigue Life", "Thrust"],
  //     aiAdvisory:
  //       "CRITICAL: Turbine blade root stress at 820 MPa exceeds target by 9.3%. Immediate actions: Apply shot peening, increase fillet radius to 3.5mm, or upgrade to Inconel 718.",
  //     impactValues: [
  //       { kpi: "Max Stress", impact: "+9.3%", value: 820 },
  //       { kpi: "Fatigue Life", impact: "-29%", value: 35400 },
  //       { kpi: "Thrust Contribution", impact: "+2.1%", value: 3150 },
  //     ],
  //   },
  //   {
  //     id: "kpi-thrust",
  //     label: "Thrust",
  //     x: 225,
  //     y: 100,
  //     status: "optimal",
  //     type: "kpi",
  //     affectedKPIs: [],
  //     aiAdvisory: "Thrust output 1.3% above target (152kN vs 150kN target). Optimal performance achieved.",
  //   },
  //   {
  //     id: "kpi-sfc",
  //     label: "SFC",
  //     x: 375,
  //     y: 100,
  //     status: "warning",
  //     type: "kpi",
  //     affectedKPIs: [],
  //     aiAdvisory: "SFC 5.5% above target. Primary contributors: Combustor pattern factor and cooling flow rate. Optimization potential exists.",
  //   },
  //   {
  //     id: "kpi-stress",
  //     label: "Stress",
  //     x: 450,
  //     y: 300,
  //     status: "critical",
  //     type: "kpi",
  //     affectedKPIs: [],
  //     aiAdvisory: "Critical stress level at turbine blade root. Requires immediate mitigation to prevent premature failure.",
  //   },
  // ];

  const networkNodes: NetworkNode[] = [
    {
      id: "fan",
      label: "Compressor",
      x: 50,
      y: 200,
      status: "optimal",
      type: "component",
      affectedKPIs: ["P2/P1 Ratio", "Start Duration", "Fouling Index"],
      aiAdvisory:
        "Compressor operating nominally. Fouling index at 24% — progressive degradation detected via P2/P1 residual. Stepper fuel demand increased 8.5%. Schedule compressor wash within 20 start cycles.",
      impactValues: [
        { kpi: "P2/P1 Residual", impact: "−3.1%", value: -0.12 },
        { kpi: "Stepper Demand", impact: "+8.5%", value: 8.5 },
        { kpi: "Fouling Index", impact: "24%", value: 24 },
      ],
    },
    {
      id: "compressor",
      label: "Fuel Stepper",
      x: 150,
      y: 200,
      status: "optimal",
      type: "component",
      affectedKPIs: ["Start Duration", "Peak JPT1", "P2/P1 Ratio"],
      aiAdvisory:
        "3-phase stepper actuator controlling fuel mass flow. Current position: 148 steps. Schedule bias of −6 steps reduces start duration by 4.2s per PINN analysis. Correlation with Ngg nominal.",
      impactValues: [
        { kpi: "Start Duration", impact: "−4.2s", value: -4.2 },
        { kpi: "Peak JPT1", impact: "−15°C", value: -15 },
        { kpi: "Fuel Flow", impact: "+0.4 kg/h", value: 0.4 },
      ],
    },
    {
      id: "combustor",
      label: "Combustor",
      x: 300,
      y: 200,
      status: "warning",
      type: "component",
      affectedKPIs: ["Peak JPT1", "Hot Start Risk", "FMEA RPN"],
      aiAdvisory:
        "Combustor liner at 18% creep life consumption. JPT1 PINN baseline deviation +13°C. Fuel atomisation quality affecting hot-start risk index (12%). Inspect liner at next MRO.",
      impactValues: [
        { kpi: "JPT1 Deviation", impact: "+13°C", value: 13 },
        { kpi: "Hot Start Risk", impact: "12%", value: 12 },
        { kpi: "Creep Life", impact: "18%", value: 18 },
      ],
    },
    {
      id: "turbine",
      label: "HPT Blades",
      x: 450,
      y: 200,
      status: "warning",
      type: "component",
      affectedKPIs: ["Peak JPT1", "FMEA RPN", "Hot Start Risk"],
      aiAdvisory:
        "HPT blades (Inconel 718) at 18% creep life consumption. Larson-Miller parameter trending up. Thermal fatigue accumulation at 22%. Blade inspection recommended at 20% TBO threshold.",
      impactValues: [
        { kpi: "Creep Life", impact: "18%", value: 18 },
        { kpi: "Thermal Fatigue", impact: "22%", value: 22 },
        { kpi: "Max Stress", impact: "913 MPa", value: 913 },
      ],
    },
    {
      id: "nozzle",
      label: "SECU / IPS",
      x: 550,
      y: 200,
      status: "optimal",
      type: "component",
      affectedKPIs: ["Start Duration", "FMEA RPN", "Hot Start Risk"],
      aiAdvisory:
        "SECU (ARM + SPARTAN 6 FPGA) healthy. BIT pass. IPS in normal monitoring mode (Mode 0). MIL-STD-1553B bus health 99%. Closed-loop fuel control nominal. No abort events in last 50 cycles.",
      impactValues: [
        { kpi: "BIT", impact: "PASS", value: 1 },
        { kpi: "IPS Mode", impact: "Mode 0", value: 0 },
        { kpi: "1553B Health", impact: "99%", value: 99 },
      ],
    },
    {
      id: "kpi-thrust",
      label: "Start Duration",
      x: 225,
      y: 100,
      status: "warning",
      type: "kpi",
      affectedKPIs: [],
      aiAdvisory: "Start duration 43s — 7.5% above 40s target. Stepper bias optimisation can reduce by 4.2s.",
    },
    {
      id: "kpi-sfc",
      label: "SFC",
      x: 375,
      y: 100,
      status: "warning",
      type: "kpi",
      affectedKPIs: [],
      aiAdvisory: "SFC 5.5% above target. Primary contributors: Combustor pattern factor and cooling flow rate. Optimization potential exists.",
    },
    {
      id: "kpi-stress",
      label: "Stress",
      x: 450,
      y: 300,
      status: "critical",
      type: "kpi",
      affectedKPIs: [],
      aiAdvisory: "Critical stress level at turbine blade root. Requires immediate mitigation to prevent premature failure.",
    },
  ];

  const networkEdges: NetworkEdge[] = [
    { from: "compressor", to: "kpi-thrust", strength: 0.8, impact: "+4.5% thrust" },
    { from: "compressor", to: "combustor", strength: 0.9, impact: "Pressure feed" },
    { from: "combustor", to: "turbine", strength: 1.0, impact: "Hot gas flow" },
    { from: "combustor", to: "kpi-sfc", strength: 0.7, impact: "+3% SFC impact" },
    { from: "turbine", to: "kpi-stress", strength: 0.9, impact: "+9% stress" },
    { from: "turbine", to: "kpi-thrust", strength: 0.6, impact: "+2% thrust" },
  ];

  const aiRecommendations: AIRecommendation[] = [
    {
      id: "rec1",
      title: "Optimize Pressure Ratio",
      variable: "Pressure Ratio",
      currentValue: 44,
      recommendedValue: 44.5,
      impact: "+4.5% Thrust, -2.8% SFC",
      rationale:
        "Increasing compressor pressure ratio from 44 to 44.5 enhances thermodynamic efficiency. Higher pressure ratio increases cycle temperature ratio, directly improving thrust and reducing specific fuel consumption. Analysis shows optimal stage loading distribution maintains compressor stability while maximizing performance.",
      expectedImprovement: { thrust: 4.5, sfc: -2.8, stress: 3.8 },
      implementationSteps: [
        "Increase rotor blade twist angles by 0.8° in stages 4-6",
        "Optimize diffuser geometry to handle higher exit pressure",
        "Validate compressor map for stable operating line",
        "Update control logic for new pressure ratio set-point",
        "Conduct full-envelope testing to verify stability margins",
      ],
      confidence: 92,
    },
    {
      id: "rec2",
      title: "Reduce Cooling Flow",
      variable: "Cooling Flow",
      currentValue: 9.2,
      recommendedValue: 9.0,
      impact: "+0.8% Thrust, +8.5% Fatigue Life",
      rationale:
        "Current cooling flow rate of 9.2% exceeds requirements based on updated thermal analysis. Advanced TBC coatings provide additional 75°C thermal protection margin. Reducing to 9.0% redirects 0.2% compressor bleed back to core flow, improving thrust while maintaining blade metal temperatures within safe limits. Thermal FEA confirms 50°C safety margin remains.",
      expectedImprovement: { thrust: 0.8, sfc: -0.6, stress: -5.2 },
      implementationSteps: [
        "Apply advanced thermal barrier coating (YSZ + CMAS-resistant top coat)",
        "Reduce cooling hole diameters from 0.8mm to 0.75mm",
        "Implement film cooling optimization on pressure side",
        "Install thermocouples at 5 blade locations for validation",
        "Monitor blade metal temperature during initial 100 cycles",
      ],
      confidence: 88,
    },
    {
      id: "rec3",
      title: "Optimize Blade Twist Distribution",
      variable: "Blade Twist",
      currentValue: 26.5,
      recommendedValue: 27.2,
      impact: "+2.8% Thrust, -1.2% Stress",
      rationale:
        "CFD analysis reveals non-optimal incidence angle distribution along blade span. Current 26.5° twist causes flow separation at 85% span, reducing efficiency. Optimizing to 27.2° aligns flow angles with blade camber, eliminating separation and reducing shock losses. Reduced aerodynamic loading also decreases bending stress by 1.2%.",
      expectedImprovement: { thrust: 2.8, sfc: -0.6, stress: -1.2 },
      implementationSteps: [
        "Redesign blade twist distribution using multi-objective optimization",
        "Manufacture prototype blades with new geometry",
        "Conduct cascade testing to validate aerodynamic performance",
        "Perform modal analysis for new vibration characteristics",
        "Update production tooling and quality control procedures",
      ],
      confidence: 85,
    },
  ];

  const handleInputChange = (id: string, value: number) => {
    setDesignInputs((prev) => prev.map((input) => (input.id === id ? { ...input, value } : input)));
  };

  const handleVariableChange = (id: string, value: number) => {
    setOptimizationVars((prev) => prev.map((v) => (v.id === id ? { ...v, current: value } : v)));
  };

  const runOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 3000);
  };

  const getStatusColor = (status: "optimal" | "warning" | "critical") => {
    switch (status) {
      case "optimal":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "warning":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/30";
    }
  };

  const getStatusIcon = (status: "optimal" | "warning" | "critical") => {
    switch (status) {
      case "optimal":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "critical":
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const overallStatus =
    kpis.filter((k) => k.status === "critical").length > 0
      ? "critical"
      : kpis.filter((k) => k.status === "warning").length > 0
      ? "warning"
      : "optimal";

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Design Optimization</h2>
          <p className="text-gray-400 mt-1">PINN + GRU surrogate model � AI-driven multi-objective GTSU-110 start-sequence optimisation</p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${getStatusColor(overallStatus)}`}>
          {getStatusIcon(overallStatus)}
          <span className="text-sm font-semibold">
            {overallStatus === "optimal" ? "Optimal" : overallStatus === "warning" ? "Needs Attention" : "Critical Issues"}
          </span>
        </div>
      </div> */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">GTSU-110 Start Optimisation</h2>
          <p className="text-gray-400 mt-1">PINN + GRU surrogate model � AI-driven multi-objective GTSU-110 start-sequence optimisation</p>
          <p className="text-gray-400 mt-1">Dedicated to optimizing the engine’s most critical failure points</p>
        </div>

        <div className="flex space-x-2">
          {/* Status Box */}
          <div className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${getStatusColor(overallStatus)}`}>
            {getStatusIcon(overallStatus)}
            <span className="text-sm font-semibold">
              {overallStatus === "optimal" ? "Optimal" : overallStatus === "warning" ? "Needs Attention" : "Critical Issues"}
            </span>
          </div>

          {/* Iteration Box */}
          <div className="flex items-center px-4 py-2 border rounded-lg border-green-600 bg-gray-800">
            <span className="text-sm font-semibold text-green-200">Iteration: 20</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => setSelectedKPI(kpi)}
            className={`p-4 bg-gray-900 border rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 ${
              kpi.status === "optimal" ? "border-green-500/30" : kpi.status === "warning" ? "border-amber-500/30" : "border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">{kpi.label}</span>
              {getStatusIcon(kpi.status)}
            </div>
            <div className="flex items-baseline space-x-2">
              <span
                className={`text-2xl font-bold ${
                  kpi.status === "optimal" ? "text-green-500" : kpi.status === "warning" ? "text-amber-500" : "text-red-500"
                }`}
              >
                {typeof kpi.value === "number" && kpi.id !== "sfc" && kpi.value > 1000 ? kpi.value.toLocaleString() : kpi.value}
              </span>
              <span className="text-sm text-gray-500">{kpi.unit}</span>
            </div>
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
              {kpi.value > kpi.target ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-green-500" />}
              <span>Target: {kpi.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Design Inputs & Constraints</h3>
          </div>
          <span className="text-xs text-gray-500">Click any input for detailed analysis</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {designInputs.map((input) => {
            const isNearLimit = input.constraint ? input.value > input.constraint.max * 0.95 || input.value < input.constraint.min * 1.05 : false;
            const constraintStatus = input.constraint
              ? input.value >= input.constraint.min && input.value <= input.constraint.max
                ? "safe"
                : "warning"
              : "safe";

            return (
              <div
                key={input.id}
                onClick={() => setSelectedInput(input)}
                className={`p-4 bg-gray-800/50 border rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 group ${
                  constraintStatus === "safe" ? "border-green-500/30" : "border-red-500/30"
                }`}
                title={input.description}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">{input.label}</span>
                  {constraintStatus === "safe" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl font-bold ${constraintStatus === "safe" ? "text-green-400" : "text-red-400"}`}>
                    {typeof input.value === "number" && input.value > 1000 ? input.value.toLocaleString() : input.value}
                  </span>
                  <span className="text-xs text-gray-500">{input.unit}</span>
                </div>
                {input.constraint && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Min: {input.constraint.min}</span>
                      <span>Max: {input.constraint.max}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${constraintStatus === "safe" ? "bg-green-500" : "bg-red-500"}`}
                        style={{
                          width: `${Math.min(100, ((input.value - input.constraint.min) / (input.constraint.max - input.constraint.min)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {isNearLimit && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-amber-500">
                    <Info className="w-3 h-3" />
                    <span>Near limit</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div> */}
      {/* 
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <RefreshCcw className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Continuous Feedback Loop</h3>
        </div>

        <div className="flex items-center justify-between space-x-4">
          {["Testing", "AI Analysis", "Optimization", "Digital Twin", "Predictive Dashboard"].map((stage, idx) => (
            <div key={stage} className="flex items-center space-x-2">
              <div
                className={`px-4 py-3 rounded-lg border ${
                  idx % 2 === 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-green-500/10 border-green-500/30"
                }`}
              >
                <span className="text-sm font-semibold text-white">{stage}</span>
              </div>
              {idx < 4 && <ArrowRight className="w-5 h-5 text-gray-600" />}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">Last update: 2 minutes ago | Next cycle: 3 minutes</div>
      </div> */}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Optimization Variables</h3>
          </div>
          <span className="text-xs text-gray-500">Click any variable for detailed impact analysis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Variable</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Baseline</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Current</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Optimized</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              {optimizationVars.map((variable) => (
                <tr
                  key={variable.id}
                  onClick={() => setSelectedVariable(variable)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors group"
                  title={variable.description}
                >
                  <td className="py-3 px-4 text-white font-medium group-hover:text-cyan-400">{variable.label}</td>
                  <td className="text-center py-3 px-4 text-gray-400">
                    {variable.baseline} {variable.unit}
                  </td>
                  <td className="text-center py-3 px-4 text-blue-400 font-medium">
                    {variable.current} {variable.unit}
                  </td>
                  <td className="text-center py-3 px-4 text-green-400 font-bold">
                    {variable.optimized} {variable.unit}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold ${
                        variable.impact > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {variable.impact > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>
                        {variable.impact > 0 ? "+" : ""}
                        {variable.impact}%
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Trade-off / Pareto Front</h3>
            </div>
            <span className="text-xs text-gray-500">Click points for analysis</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {paretoPoints.map((point) => {
              const stressStatus = point.stress < 750 ? "optimal" : point.stress < 850 ? "warning" : "critical";
              return (
                <div
                  key={point.id}
                  onClick={() => setSelectedParetoPoint(point)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50 ${
                    point.selected ? "bg-green-500/10 border-green-500/50" : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{point.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          stressStatus === "optimal"
                            ? "bg-green-500/20 text-green-400"
                            : stressStatus === "warning"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {stressStatus.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">Score: {point.optimalityScore}/100</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Thrust</div>
                      <div className="text-white font-medium">{(point.thrust / 1000).toFixed(0)}kN</div>
                    </div>
                    <div>
                      <div className="text-gray-500">SFC</div>
                      <div className="text-white font-medium">{point.sfc}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Stress</div>
                      <div
                        className={`font-medium ${
                          stressStatus === "optimal" ? "text-green-400" : stressStatus === "warning" ? "text-amber-400" : "text-red-400"
                        }`}
                      >
                        {point.stress} MPa
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Life</div>
                      <div className="text-white font-medium">{(point.fatigueLife / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            </div>
            <span className="text-xs text-gray-500">Top 3 impactful changes</span>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map((rec, idx) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg cursor-pointer hover:ring-2 hover:ring-green-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white group-hover:text-green-400">{rec.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    {rec.confidence}%
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-3">{rec.impact}</div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Thrust +{rec.expectedImprovement.thrust}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">SFC {rec.expectedImprovement.sfc}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400">Stress +{rec.expectedImprovement.stress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="text-sm text-gray-400 mb-3">Overall KPI Improvement (Before → After)</div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Thrust</span>
                  <span>+8.1%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "81%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>SFC</span>
                  <span>-4.0%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Component Dependency Network</h3>
          </div>
          <span className="text-xs text-gray-500">Click components for detailed impact</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {networkNodes
            .filter((node) => node.type === "component")
            .map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/50 ${
                  node.status === "optimal"
                    ? "bg-green-500/10 border-green-500/50"
                    : node.status === "warning"
                    ? "bg-amber-500/10 border-amber-500/50"
                    : "bg-red-500/10 border-red-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-lg">{node.label}</h4>
                  {node.status === "optimal" ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : node.status === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                {node.affectedKPIs && node.affectedKPIs.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">Affects:</div>
                    <div className="flex flex-wrap gap-1">
                      {node.affectedKPIs.map((kpi) => (
                        <span key={kpi} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {node.impactValues && node.impactValues.length > 0 && (
                  <div className="space-y-1">
                    {node.impactValues.slice(0, 2).map((impact, idx) => (
                      <div key={idx} className="text-xs text-gray-300">
                        <span className="text-gray-400">{impact.kpi}:</span>
                        <span className={`ml-1 font-bold ${impact.impact.includes("+") ? "text-green-400" : "text-amber-400"}`}>{impact.impact}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <RefreshCcw className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Continuous Feedback Loop</h3>
        </div>

        <div className="flex items-center justify-between space-x-4">
          {["Testing", "AI Analysis", "Optimization", "Digital Twin", "Predictive Dashboard"].map((stage, idx) => (
            <div key={stage} className="flex items-center space-x-2">
              <div
                className={`px-4 py-3 rounded-lg border ${
                  idx % 2 === 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-green-500/10 border-green-500/30"
                }`}
              >
                <span className="text-sm font-semibold text-white">{stage}</span>
              </div>
              {idx < 4 && <ArrowRight className="w-5 h-5 text-gray-600" />}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">Last update: 2 minutes ago | Next cycle: 3 minutes</div>
      </div>

      {selectedKPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedKPI(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 rounded-lg ${
                    selectedKPI.status === "optimal" ? "bg-green-500/10" : selectedKPI.status === "warning" ? "bg-amber-500/10" : "bg-red-500/10"
                  }`}
                >
                  {getStatusIcon(selectedKPI.status)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedKPI.label} Analysis</h2>
                  <p className="text-gray-400 mt-1">
                    Current: {selectedKPI.value} {selectedKPI.unit} | Target: {selectedKPI.target} {selectedKPI.unit}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedKPI(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-5">
                <div className="flex items-start space-x-3">
                  <Brain className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">AI Advisory</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedKPI.aiAdvisory}</p>
                  </div>
                </div>
              </div>

              {/* <div>
                <h3 className="text-lg font-semibold text-white mb-4">Trend Analysis (Last 20 Cycles)</h3>
                <LineChart
                  data={selectedKPI.trend}
                  title=""
                  color={selectedKPI.status === "optimal" ? "#10b981" : selectedKPI.status === "warning" ? "#f59e0b" : "#ef4444"}
                  height={250}
                  yAxisLabel={selectedKPI.unit}
                  xAxisLabel="Cycle"
                />
              </div> */}

              {/* <div className="bg-gray-950 border border-gray-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Target vs Actual</h3>
                <div className="space-y-3">
                  {selectedKPI.targetVsActual.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{item.metric}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500">Target: {item.target}</span>
                          <span className={`font-semibold ${item.actual > item.target ? "text-red-500" : "text-green-500"}`}>
                            Actual: {item.actual}
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="absolute top-0 left-0 h-2 bg-blue-500/30 rounded-full"
                          style={{ width: `${(Math.min(item.target, item.actual) / Math.max(item.target, item.actual)) * 100}%` }}
                        />
                        <div
                          className={`absolute top-0 left-0 h-2 rounded-full ${item.actual > item.target ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${(item.actual / Math.max(item.target, item.actual)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}

              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">Suggested Corrective Actions</h3>
                <ol className="space-y-2">
                  {selectedKPI.suggestedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded">
                      <span className="text-amber-500 font-bold mt-0.5">{idx + 1}.</span>
                      <span className="text-sm text-gray-300">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex space-x-3">
              <button
                onClick={() => setSelectedKPI(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              {/* <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                Apply Recommendations
              </button> */}
            </div>
          </div>
        </div>
      )}

      {selectedInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedInput(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedInput.label}</h2>
                <p className="text-gray-400 mt-1">{selectedInput.description}</p>
              </div>
              <button onClick={() => setSelectedInput(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Current Value</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedInput.value} {selectedInput.unit}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Recommended</div>
                  <div className="text-2xl font-bold text-green-400">
                    {selectedInput.recommendedValue} {selectedInput.unit}
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Range</div>
                  <div className="text-sm font-bold text-white">
                    {selectedInput.min} - {selectedInput.max} {selectedInput.unit}
                  </div>
                </div>
              </div>

              {/* <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <LineChartIcon className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Trend Over Past 20 Cycles</h3>
                </div>
                <LineChart data={selectedInput.trend} title="" yLabel={selectedInput.unit} color="#06b6d4" height={200} />
              </div> */}

              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-400">AI Advisory</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedInput.aiAdvisory}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
              <button
                onClick={() => setSelectedInput(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVariable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedVariable(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-cyan-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedVariable.label}</h2>
                <p className="text-gray-400 mt-1">{selectedVariable.description}</p>
              </div>
              <button onClick={() => setSelectedVariable(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Baseline</div>
                  <div className="text-xl font-bold text-gray-300">
                    {selectedVariable.baseline} {selectedVariable.unit}
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Current</div>
                  <div className="text-xl font-bold text-blue-400">
                    {selectedVariable.current} {selectedVariable.unit}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Optimized</div>
                  <div className="text-xl font-bold text-green-400">
                    {selectedVariable.optimized} {selectedVariable.unit}
                  </div>
                </div>
                <div
                  className={`border rounded-lg p-4 ${
                    selectedVariable.impact > 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="text-xs text-gray-400 mb-1">Impact</div>
                  <div className={`text-xl font-bold ${selectedVariable.impact > 0 ? "text-green-400" : "text-red-400"}`}>
                    {selectedVariable.impact > 0 ? "+" : ""}
                    {selectedVariable.impact}%
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Detailed KPI Impacts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Thrust</span>
                    <span className={`font-bold ${selectedVariable.kpiImpacts.thrust > 0 ? "text-green-400" : "text-red-400"}`}>
                      {selectedVariable.kpiImpacts.thrust > 0 ? "+" : ""}
                      {selectedVariable.kpiImpacts.thrust}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">SFC</span>
                    <span className={`font-bold ${selectedVariable.kpiImpacts.sfc < 0 ? "text-green-400" : "text-red-400"}`}>
                      {selectedVariable.kpiImpacts.sfc > 0 ? "+" : ""}
                      {selectedVariable.kpiImpacts.sfc}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Stress</span>
                    <span className={`font-bold ${selectedVariable.kpiImpacts.stress < 0 ? "text-green-400" : "text-amber-400"}`}>
                      {selectedVariable.kpiImpacts.stress > 0 ? "+" : ""}
                      {selectedVariable.kpiImpacts.stress}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Fatigue Life</span>
                    <span className={`font-bold ${selectedVariable.kpiImpacts.fatigueLife > 0 ? "text-green-400" : "text-red-400"}`}>
                      {selectedVariable.kpiImpacts.fatigueLife > 0 ? "+" : ""}
                      {selectedVariable.kpiImpacts.fatigueLife}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-400">AI Rationale</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedVariable.aiRationale}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
              <button
                onClick={() => setSelectedVariable(null)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedParetoPoint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedParetoPoint(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedParetoPoint.label} Configuration</h2>
                <p className="text-gray-400 mt-1">Optimality Score: {selectedParetoPoint.optimalityScore}/100</p>
              </div>
              <button onClick={() => setSelectedParetoPoint(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Thrust</div>
                    <div className="text-2xl font-bold text-cyan-400">{(selectedParetoPoint.thrust / 1000).toFixed(1)}kN</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">SFC</div>
                    <div className="text-2xl font-bold text-blue-400">{selectedParetoPoint.sfc}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Stress</div>
                    <div
                      className={`text-2xl font-bold ${
                        selectedParetoPoint.stress < 750 ? "text-green-400" : selectedParetoPoint.stress < 850 ? "text-amber-400" : "text-red-400"
                      }`}
                    >
                      {selectedParetoPoint.stress} MPa
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Fatigue Life</div>
                    <div className="text-2xl font-bold text-purple-400">{(selectedParetoPoint.fatigueLife / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Trade-off Analysis</h3>
                <p className="text-gray-300 leading-relaxed">{selectedParetoPoint.tradeoffAnalysis}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-400">AI Recommendation</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedParetoPoint.aiRecommendation}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
              <button
                onClick={() => setSelectedParetoPoint(null)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRecommendation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedRecommendation(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-green-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRecommendation.title}</h2>
                <p className="text-gray-400 mt-1">Confidence: {selectedRecommendation.confidence}%</p>
              </div>
              <button onClick={() => setSelectedRecommendation(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Current Value</div>
                  <div className="text-xl font-bold text-white">{selectedRecommendation.currentValue}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Recommended Value</div>
                  <div className="text-xl font-bold text-green-400">{selectedRecommendation.recommendedValue}</div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Expected Improvements</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Thrust</div>
                    <div className="text-xl font-bold text-green-400">+{selectedRecommendation.expectedImprovement.thrust}%</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">SFC</div>
                    <div className="text-xl font-bold text-green-400">{selectedRecommendation.expectedImprovement.sfc}%</div>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Stress</div>
                    <div className="text-xl font-bold text-amber-400">+{selectedRecommendation.expectedImprovement.stress}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-400">Detailed Rationale</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedRecommendation.rationale}</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Implementation Steps</h3>
                <ol className="space-y-3">
                  {selectedRecommendation.implementationSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex space-x-3">
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              {/* <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors">
                Apply Recommendation
              </button> */}
            </div>
          </div>
        </div>
      )}

      {selectedNode && selectedNode.type === "component" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`sticky top-0 border-b border-gray-700 p-6 flex items-center justify-between z-10 ${
                selectedNode.status === "optimal"
                  ? "bg-gradient-to-r from-green-900 via-gray-900 to-gray-800"
                  : selectedNode.status === "warning"
                  ? "bg-gradient-to-r from-amber-900 via-gray-900 to-gray-800"
                  : "bg-gradient-to-r from-red-900 via-gray-900 to-gray-800"
              }`}
            >
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedNode.label} Component</h2>
                <p
                  className={`mt-1 font-medium ${
                    selectedNode.status === "optimal" ? "text-green-400" : selectedNode.status === "warning" ? "text-amber-400" : "text-red-400"
                  }`}
                >
                  Status: {selectedNode.status.toUpperCase()}
                </p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedNode.affectedKPIs && selectedNode.affectedKPIs.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-white mb-3">Affected KPIs</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.affectedKPIs.map((kpi) => (
                      <span key={kpi} className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-lg">
                        {kpi}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.impactValues && selectedNode.impactValues.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Numerical Impact Values</h3>
                  <div className="space-y-3">
                    {selectedNode.impactValues.map((impact, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-gray-300 font-medium">{impact.kpi}</span>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              impact.impact.includes("+") ? "text-green-400" : impact.impact.includes("-") ? "text-red-400" : "text-amber-400"
                            }`}
                          >
                            {impact.impact}
                          </div>
                          <div className="text-xs text-gray-500">Value: {impact.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.aiAdvisory && (
                <div className="bg-gradient-to-br from-purple-500/10 to-red-500/10 border border-purple-500/30 rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-400">AI Advisory</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{selectedNode.aiAdvisory}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
