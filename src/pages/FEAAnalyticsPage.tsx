import { useState } from "react";
import { Shield, Flame, Activity, Gauge, TrendingUp, Brain, X, Box, FileText, Zap, AlertTriangle } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import { HeatmapChart } from "../components/HeatmapChart";
import { FEADigitalTwin } from "../components/FEADigitalTwin";

interface TechnicalDetails {
  material: string;
  load: string;
  meshQuality: string;
  temperature: string;
  stressRange: string;
  strainRange?: string;
  boundaryConditions: string[];
  notes: string;
}

interface FEAKPIData {
  id: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  description: string;
  aiInsight: string;
  recommendedAction: string;
  confidence: number;
  trend: { x: number; y: number }[];
  predictedVsObserved?: { label: string; observed: number; predicted: number }[];
  failureModes: string[];
  nextActions: string[];
  modelRef: string;
  technicalDetails: TechnicalDetails;
  criticalRegions: string[];
}

interface ChartModalData {
  title: string;
  type: string;
  target: string;
  description: string;
  aiInsight: string;
  recommendedAction: string;
  confidence: number;
  modelRef: string;
  criticalRegions: string[];
  stressRange: string;
  material: string;
  meshSize: string;
  load: string;
  nextActions: string[];
}

export function FEAAnalyticsPage() {
  const [selectedKPI, setSelectedKPI] = useState<FEAKPIData | null>(null);
  const [selectedChart, setSelectedChart] = useState<ChartModalData | null>(null);

  const feaKPIs: FEAKPIData[] = [
    // {
    //   id: "vonMisesStress",
    //   title: "Max Von Mises Stress",
    //   value: 0.82,
    //   target: 0.75,
    //   unit: "MPa",
    //   status: "critical",
    //   description: "Maximum equivalent stress in the turbine blade structure",
    //   aiInsight:
    //     "Stress exceeds target of 0.750 MPa by 9.3% at turbine blade root fillet. Current value of 0.820 MPa is at 93% of yield strength (0.880 MPa for Ti-6Al-4V). Stress concentration factor of 2.8 detected at fillet radius. FEA indicates combined centrifugal and thermal loading as primary contributors.",
    //   recommendedAction:
    //     "Immediate action required: (1) Redesign fillet radius from 2mm to 3.5mm to reduce stress concentration, (2) Upgrade to higher-strength alloy (Inconel 718: yield 1100 MPa), (3) Run refined mesh analysis with 0.3mm element size in critical region.",
    //   confidence: 94,
    //   trend: Array.from({ length: 20 }, (_, i) => ({
    //     x: i + 1,
    //     y: 0.7 + Math.sin(i / 3) * 0.05 + i * 0.005, // values stay below 1
    //   })),

    //   predictedVsObserved: [
    //     { label: "Cycle 1", observed: 0.78, predicted: 0.785 },
    //     { label: "Cycle 2", observed: 0.795, predicted: 0.8 },
    //     { label: "Cycle 3", observed: 0.81, predicted: 0.815 },
    //     { label: "Cycle 4", observed: 0.82, predicted: 0.825 },
    //   ],
    //   failureModes: ["Blade root crack initiation", "Material yielding", "High cycle fatigue"],
    //   nextActions: [
    //     "Redesign fillet geometry to r=3.5mm",
    //     "Upgrade material to Inconel 718",
    //     "Run refined mesh analysis with 0.3mm elements",
    //     "Validate with physical strain gauge testing",
    //   ],
    //   modelRef: "models/turbine_blade_001_stress_analysis.gltf",
    //   criticalRegions: ["Blade root fillet", "Trailing edge mid-span", "Leading edge tip"],
    //   technicalDetails: {
    //     material: "Ti-6Al-4V (Grade 5)",
    //     load: "Centrifugal: 5000 N at blade tip, Thermal: 600°C gradient",
    //     meshQuality: "0.5 mm avg element size, 125,000 tetrahedral elements",
    //     temperature: "600°C max at root, 450°C at tip",
    //     stressRange: "450-820 MPa",
    //     strainRange: "0.004-0.0074 mm/mm",
    //     boundaryConditions: ["Fixed constraint at blade root disk interface", "Centrifugal load at 15,000 RPM", "Thermal gradient from combustor"],
    //     notes: "Fillet root shows peak stress of 820 MPa due to geometric stress concentration. SCF=2.8 indicates design improvement needed.",
    //   },
    // },
    {
      id: "vonMisesStress",
      title: "Max Von Mises Stress",
      value: 553, // normalized (relative to 880 MPa yield)
      target: { min: 300, max: 600 }, // ideal design range (safe fatigue zone)
      unit: "MPa",
      status: "normal", // exceeds safe limit
      description: "Maximum equivalent stress in the engine structure",
      aiInsight:
        "Current von Mises stress of 553 (≈ 720 MPa) is slightly above the recommended safe design range (0.50 – 0.70 of yield, or 440 – 620 MPa). Finite Element Analysis (FEA) shows a stress concentration factor (SCF) of 2.8 near the blade root fillet. Combined centrifugal (≈ 5000 N) and thermal (≈ 600 °C) loads are the primary contributors to localized overstress.",
      recommendedAction:
        "Recommended engineering actions: (1) Increase fillet radius from 2 mm → 3.5 mm to reduce SCF, (2) Consider material upgrade to Inconel 718 (yield ≈ 1100 MPa) for better thermal fatigue resistance, (3) Re-run FEA with refined mesh (0.3 mm elements) focusing on the root region for validation.",
      confidence: 94,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 0.7 + Math.sin(i / 3) * 0.05 + i * 0.005, // normalized stress trend (<1)
      })),
      predictedVsObserved: [
        { label: "Cycle 1", observed: 0.78, predicted: 0.785 },
        { label: "Cycle 2", observed: 0.795, predicted: 0.8 },
        { label: "Cycle 3", observed: 0.81, predicted: 0.815 },
        { label: "Cycle 4", observed: 0.82, predicted: 0.825 },
      ],
      failureModes: ["Blade root crack initiation", "Material yielding", "High-cycle fatigue"],
      nextActions: [
        "Redesign fillet geometry to r = 3.5 mm",
        "Upgrade material to Inconel 718",
        "Run refined mesh analysis with 0.3 mm elements",
        "Validate with physical strain-gauge testing",
      ],
      modelRef: "models/turbine_blade_001_stress_analysis.gltf",
      criticalRegions: ["Blade root fillet", "Trailing edge mid-span", "Leading edge tip"],
      technicalDetails: {
        material: "Ti-6Al-4V (Grade 5)",
        load: "Centrifugal: 5000 N @ blade tip, Thermal: 600 °C gradient",
        meshQuality: "0.5 mm avg element size, 125,000 tetrahedral elements",
        temperature: "600 °C max @ root, 450 °C @ tip",
        stressRange: "450 – 820 MPa",
        strainRange: "0.004 – 0.0074 mm/mm",
        boundaryConditions: ["Fixed constraint at blade root disk interface", "Centrifugal load @ 15,000 RPM", "Thermal gradient from combustor"],
        notes:
          "Peak stress of ≈ 720 MPa recorded at the root fillet, slightly above safe fatigue range. Indicates need for local geometric refinement and potential material upgrade.",
      },
    },

    // {
    //   id: "maxStrain",
    //   title: "Max Principal Strain",
    //   value: 0.0074,
    //   target: 0.0065,
    //   unit: "mm/mm",
    //   status: "warning",
    //   description: "Maximum principal strain in structural components",
    //   aiInsight:
    //     "Strain exceeds target by 13.8%. Current value approaching elastic limit. Detected at compressor blade leading edge due to aerodynamic loading and vibration. Correlation with stress analysis confirms critical region identification.",
    //   recommendedAction:
    //     "Reduce operating RPM by 2% during high-altitude conditions. Install damping wire between adjacent blades. Consider local thickness increase from 1.5mm to 2.0mm at leading edge.",
    //   confidence: 89,
    //   trend: Array.from({ length: 20 }, (_, i) => ({
    //     x: i + 1,
    //     y: 0.006 + Math.sin(i / 4) * 0.0005 + i * 0.00005,
    //   })),
    //   failureModes: ["Plastic deformation", "Low cycle fatigue", "Blade flutter"],
    //   nextActions: [
    //     "Install interblade damping system",
    //     "Increase leading edge thickness to 2.0mm",
    //     "Conduct modal analysis for resonance frequencies",
    //     "Monitor strain with real-time gauges",
    //   ],
    //   modelRef: "models/compressor_blade_strain_map.gltf",
    //   criticalRegions: ["Leading edge root", "Mid-span pressure surface"],
    //   technicalDetails: {
    //     material: "Ti-6Al-4V",
    //     load: "Aerodynamic: 3200 N distributed, Centrifugal: 4000 RPM",
    //     meshQuality: "0.4 mm elements, 98,000 nodes",
    //     temperature: "180°C operating",
    //     stressRange: "580-680 MPa",
    //     strainRange: "0.0052-0.0074 mm/mm",
    //     boundaryConditions: ["Fixed root attachment", "Distributed aerodynamic pressure", "Vibrational excitation at 850 Hz"],
    //     notes: "Leading edge shows strain concentration due to thin section and high aerodynamic loads. Damping recommended.",
    //   },
    // },
    {
      id: "maxStrain",
      title: "Max Principal Strain",
      value: 0.0065, // slightly below elastic limit but still in warning zone
      target: { min: 0.005, max: 0.006 }, // ideal operational strain window
      unit: "mm/mm",
      status: "warning",
      description: "Maximum principal strain in compressor blade leading edge under aerodynamic and centrifugal loading.",
      aiInsight:
        "Measured strain of 0.0070 mm/mm exceeds safe design range (0.0050 – 0.0060 mm/mm). The value approaches the elastic limit (~0.0075 mm/mm) for Ti-6Al-4V, indicating potential low-cycle fatigue risk. Peak strain localized at the leading edge due to aerodynamic excitation and resonance coupling.",
      recommendedAction:
        "Reduce operating RPM by 2% during high-altitude conditions. Install damping wire between adjacent blades. Increase local wall thickness from 1.5 mm → 2.0 mm at leading edge. Verify via modal and transient FEA validation.",
      confidence: 91,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 0.0058 + Math.sin(i / 4) * 0.0004 + i * 0.00005, // oscillates within range
      })),
      failureModes: ["Plastic deformation", "Low-cycle fatigue", "Blade flutter"],
      nextActions: [
        "Install inter-blade damping system",
        "Increase leading edge thickness to 2.0 mm",
        "Perform modal analysis for resonance frequencies",
        "Monitor strain with real-time gauges",
      ],
      modelRef: "models/compressor_blade_strain_map.gltf",
      criticalRegions: ["Leading edge root", "Mid-span pressure surface"],
      technicalDetails: {
        material: "Ti-6Al-4V (Grade 5)",
        load: "Aerodynamic: 3200 N distributed, Centrifugal: 4000 RPM",
        meshQuality: "0.4 mm elements, 98,000 nodes",
        temperature: "180 °C operating",
        stressRange: "580 – 680 MPa",
        strainRange: "0.0050 – 0.0075 mm/mm",
        boundaryConditions: ["Fixed root attachment", "Distributed aerodynamic pressure", "Vibrational excitation @ 850 Hz"],
        notes:
          "Leading edge exhibits localized strain amplification due to thin geometry and high dynamic loading. Damping treatment and local reinforcement advised.",
      },
    },

    // {
    //   id: "safetyFactor",
    //   title: "Minimum Safety Factor",
    //   value: 1.38,
    //   target: 1.8,
    //   unit: "",
    //   status: "critical",
    //   description: "Ratio of failure strength to applied stress (minimum across all components)",
    //   aiInsight:
    //     "Safety factor below target of 1.8 by 23%. Current value of 1.38 provides insufficient margin for turbine blade under peak load conditions. Target SF=1.8 ensures safe operation under off-design and fatigue conditions.",
    //   recommendedAction:
    //     "Critical: Reduce peak operating load by 15% or upgrade to higher yield strength material. Conduct stress redistribution through topology optimization. Target SF=1.8 achievable with material upgrade to Inconel 718.",
    //   confidence: 96,
    //   trend: Array.from({ length: 20 }, (_, i) => ({
    //     x: i + 1,
    //     y: 1.6 - i * 0.011 + Math.random() * 0.05,
    //   })),
    //   failureModes: ["Structural yielding", "Catastrophic failure", "Fatigue crack propagation"],
    //   nextActions: [
    //     "Material upgrade to Inconel 718 (yield: 1100 MPa)",
    //     "Topology optimization to redistribute stress",
    //     "Reduce operating load by 15%",
    //     "Implement load shedding during transient conditions",
    //   ],
    //   modelRef: "models/turbine_assembly_safety_factor.gltf",
    //   criticalRegions: ["Turbine blade root", "Disk attachment slot", "Shaft coupling"],
    //   technicalDetails: {
    //     material: "Ti-6Al-4V (Yield: 880 MPa)",
    //     load: "Combined: Centrifugal 5000N + Thermal stress",
    //     meshQuality: "0.5 mm refined mesh at critical regions",
    //     temperature: "600°C max",
    //     stressRange: "580-820 MPa",
    //     boundaryConditions: ["Rotating frame at 15000 RPM", "Thermal gradient 600°C", "Gas bending moment 450 Nm"],
    //     notes: "Safety factor below design target. Material upgrade or load reduction mandatory for safe operation.",
    //   },
    // },
    {
      id: "safetyFactor",
      title: "Minimum Safety Factor",
      value: 1.52,
      target: { min: 1.8, max: 2.2 }, // ✅ added realistic operational range
      unit: "",
      status: "warning",
      description: "Ratio of failure strength to applied stress (minimum across all components).",
      aiInsight:
        "Safety factor below target operational range (1.8 – 2.2). Current value of 1.38 provides insufficient margin for turbine blade under peak load. Design target SF ≥ 1.8 ensures safe operation under fatigue and off-design conditions.",
      recommendedAction:
        "Critical: Reduce peak operating load by 15% or upgrade to a higher yield strength material. Perform topology optimization to redistribute stress. Material upgrade to Inconel 718 recommended to reach SF ≥ 1.8.",
      confidence: 96,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 1.6 - i * 0.011 + Math.random() * 0.05,
      })),
      failureModes: ["Structural yielding", "Catastrophic failure", "Fatigue crack propagation"],
      nextActions: [
        "Material upgrade to Inconel 718 (yield: 1100 MPa)",
        "Topology optimization to redistribute stress",
        "Reduce operating load by 15%",
        "Implement load shedding during transient conditions",
      ],
      modelRef: "models/turbine_assembly_safety_factor.gltf",
      criticalRegions: ["Turbine blade root", "Disk attachment slot", "Shaft coupling"],
      technicalDetails: {
        material: "Ti-6Al-4V (Yield: 880 MPa)",
        load: "Combined: Centrifugal 5000N + Thermal stress",
        meshQuality: "0.5 mm refined mesh at critical regions",
        temperature: "600°C max",
        stressRange: "580–820 MPa",
        boundaryConditions: ["Rotating frame at 22000 RPM (GTSU-110 Ngg max)", "Thermal gradient 600°C", "Gas bending moment 450 Nm"],
        notes: "Safety factor below design target. Material upgrade or load reduction mandatory for safe operation.",
      },
    },

    {
      id: "fatigueLife",
      title: "Predicted Fatigue Life",
      value: 35400,
      target: 50000,
      unit: "cycles",
      status: "warning",
      description: "Remaining fatigue cycles before crack initiation (S-N curve based)",
      aiInsight:
        "Fatigue life 29% below target. Current prediction of 35,400 cycles based on Goodman analysis with stress amplitude 180 MPa and mean stress 550 MPa. Surface oxidation and mean stress effects reducing life. Target of 50,000 cycles achievable with surface treatment.",
      recommendedAction:
        "Apply shot peening to induce compressive residual stress (-200 MPa). This extends life by 35-40%. Implement protective coating to prevent oxidation. Schedule replacement at 32,000 cycles with 10% safety margin.",
      confidence: 87,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 50000 - i * 730 - Math.random() * 400,
      })),
      failureModes: ["High cycle fatigue crack", "Surface crack initiation", "Progressive crack growth"],
      nextActions: [
        "Apply shot peening for compressive residual stress",
        "Install oxidation-resistant coating",
        "Reduce stress amplitude through damping",
        "Schedule replacement at 32,000 cycles",
      ],
      modelRef: "models/blade_fatigue_hotspots.gltf",
      criticalRegions: ["Trailing edge fillet", "Leading edge impact zone", "Root attachment holes"],
      technicalDetails: {
        material: "Ti-6Al-4V (Fatigue limit: 510 MPa at 10^7 cycles)",
        load: "Cyclic stress: amplitude 180 MPa, mean 550 MPa",
        meshQuality: "0.4 mm surface mesh for fatigue analysis",
        temperature: "450-600°C cyclic",
        stressRange: "370-730 MPa (R=0.51)",
        boundaryConditions: ["Cyclic loading at 850 Hz", "Temperature cycling 450-600°C", "Combined bending and tension"],
        notes: "Goodman diagram indicates life reduction due to mean stress. Surface treatment can extend to target life.",
      },
    },
    {
      id: "meshQuality",
      title: "Mesh Quality (Min)",
      value: 0.42,
      target: { min: 0.6, max: 0.85 }, // ✅ Ideal target range (consistent with technicalDetails)
      unit: "",
      status: "warning",
      description: "Minimum element quality metric (0–1 scale, Jacobian-based measure of element distortion).",
      aiInsight:
        "Mesh quality below the desired range (0.60–0.85) in 8% of elements. Minimum quality of 0.42 detected in fillet and cooling hole regions. Poor mesh may underpredict stress by up to 8%. A target minimum of 0.6 ensures solution accuracy within 2%.",
      recommendedAction:
        "Remesh critical regions with 0.3 mm elements and curvature-based refinement. Use hex-dominant mesh at fillets. Improve minimum quality to >0.6 and verify mesh convergence (<3% stress variation).",
      confidence: 92,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 0.38 + i * 0.002 + Math.random() * 0.02,
      })),
      failureModes: ["Solution non-convergence", "Inaccurate stress prediction", "False stress concentrations"],
      nextActions: [
        "Remesh with curvature-based refinement",
        "Use hex-dominant mesh at fillets",
        "Run mesh convergence study",
        "Target minimum quality: 0.6–0.85",
      ],
      modelRef: "models/mesh_quality_visualization.gltf",
      criticalRegions: ["Blade root fillet", "Cooling hole intersections", "Thin trailing edge"],
      technicalDetails: {
        material: "N/A (Mesh property)",
        load: "N/A",
        meshQuality: "Current: 0.42 min, 0.78 avg | Target: 0.6–0.85 range",
        temperature: "N/A",
        stressRange: "Accuracy ±5–8% in low-quality regions",
        boundaryConditions: ["Mesh type: Tetrahedral", "Element count: 125,000", "Node count: 32,000"],
        notes: "Poor-quality elements at complex geometry may cause local stress underprediction. Remeshing required for convergence reliability.",
      },
    },

    // {
    //   id: "convergence",
    //   title: "Solver Convergence",
    //   value: 0.0085,
    //   target: 0.001,
    //   unit: "",
    //   status: "warning",
    //   description: "Relative residual norm (convergence criterion for iterative solver)",
    //   aiInsight:
    //     "Convergence residual 8.5x above target. Current value of 0.0085 indicates incomplete solution convergence. Target of 0.001 ensures stress accuracy within 1%. Material nonlinearity and contact regions causing slow convergence.",
    //   recommendedAction:
    //     "Increase solver iterations from 500 to 1500. Use line search algorithm for nonlinear material. Refine contact pair definitions. Monitor convergence plot for oscillation. If not converging, simplify geometry or use implicit solver.",
    //   confidence: 85,
    //   trend: Array.from({ length: 20 }, (_, i) => ({
    //     x: i + 1,
    //     y: 0.05 - i * 0.002 + Math.random() * 0.001,
    //   })),
    //   failureModes: ["Non-converged solution", "Inaccurate results", "Solver divergence"],
    //   nextActions: [
    //     "Increase max iterations to 1500",
    //     "Enable line search algorithm",
    //     "Refine contact definitions",
    //     "Use implicit solver if oscillation persists",
    //   ],
    //   modelRef: "models/convergence_history.gltf",
    //   criticalRegions: ["Contact surfaces", "Nonlinear material regions", "Large deformation zones"],
    //   technicalDetails: {
    //     material: "Ti-6Al-4V with nonlinear stress-strain",
    //     load: "Nonlinear contact and large deformation",
    //     meshQuality: "0.5 mm with contact refinement",
    //     temperature: "600°C (temperature-dependent properties)",
    //     stressRange: "Convergence-dependent accuracy",
    //     boundaryConditions: ["Nonlinear contact pairs: 12", "Material nonlinearity enabled", "Max iterations: 500 (increase needed)"],
    //     notes: "Slow convergence due to nonlinear effects. Increase iterations and use advanced solver settings.",
    //   },
    // },
    {
      id: "convergence",
      title: "Solver Convergence",
      value: 0.0085,
      target: { min: 0.0005, max: 0.001 }, // ✅ Ideal residual range for full convergence
      unit: "",
      status: "warning",
      description: "Relative residual norm (measures numerical convergence of the iterative solver). Lower is better for solution accuracy.",
      aiInsight:
        "Convergence residual is 8.5× higher than the acceptable range (0.0005–0.001). Current residual of 0.0085 indicates partial convergence, likely due to nonlinear contact interactions and material hardening effects. This may lead to a 3–5% deviation in computed stress fields.",
      recommendedAction:
        "Increase solver iterations from 500 → 1500. Enable line search algorithm for nonlinear material models. Refine contact pair definitions. Monitor residual vs. iteration plot for oscillations. If persistent, simplify geometry or switch to implicit solver for improved stability.",
      confidence: 85,
      trend: Array.from({ length: 20 }, (_, i) => ({
        x: i + 1,
        y: 0.009 - i * 0.0003 + Math.random() * 0.0004,
      })),
      failureModes: ["Non-converged solution", "Inaccurate stress/strain results", "Solver divergence"],
      nextActions: [
        "Increase max iterations to 1500",
        "Enable line search algorithm",
        "Refine contact definitions",
        "Switch to implicit solver if oscillation persists",
      ],
      modelRef: "models/convergence_history.gltf",
      criticalRegions: ["Contact surfaces", "Nonlinear material zones", "Large deformation regions"],
      technicalDetails: {
        material: "Ti-6Al-4V with nonlinear stress–strain behavior",
        load: "Nonlinear contact and large deformation conditions",
        meshQuality: "0.5 mm with local refinement near contact surfaces",
        temperature: "600°C (temperature-dependent material properties)",
        stressRange: "Accuracy varies ±3–5% with residual >0.005",
        boundaryConditions: ["12 nonlinear contact pairs", "Material nonlinearity enabled", "Max iterations: 500 (increase recommended to 1500)"],
        notes:
          "Convergence slowed due to contact and material nonlinearity. Increase iteration limit and apply damping to stabilize residual reduction.",
      },
    },
  ];

  // const stressDistributionData = [
  //   { label: "Turbine Blade", value: 820, color: "#ef4444" },
  //   { label: "Compressor Blade", value: 650, color: "#f59e0b" },
  //   { label: "Combustion Chamber", value: 580, color: "#10b981" },
  //   { label: "Shaft", value: 420, color: "#10b981" },
  //   { label: "Nozzle", value: 380, color: "#10b981" },
  // ];
  const stressDistributionData = [
    { label: "Fan", value: 0.72, color: "#facc15" }, // Low stress zone
    { label: "Compressor", value: 0.78, color: "#facc15" }, // Moderate
    { label: "Combustor", value: 0.6, color: "#facc15" }, // Slightly lower but thermally stressed
    { label: "Turbine", value: 0.82, color: "#ef4444" }, // Highest stress region
    { label: "Nozzle", value: 0.67, color: "#facc15" }, // Moderate-low
  ];

  const thermalHeatmapData = [
    { component: "Inlet(FAN)", metric: "T1", value: 45 },
    { component: "Inlet(FAN)", metric: "T2", value: 52 },
    { component: "Inlet(FAN)", metric: "T3", value: 48 },
    { component: "Compressor", metric: "T1", value: 68 },
    { component: "Compressor", metric: "T2", value: 72 },
    { component: "Compressor", metric: "T3", value: 75 },
    { component: "Combustor", metric: "T1", value: 92 },
    { component: "Combustor", metric: "T2", value: 95 },
    { component: "Combustor", metric: "T3", value: 98 },
    { component: "Turbine", metric: "T1", value: 88 },
    { component: "Turbine", metric: "T2", value: 85 },
    { component: "Turbine", metric: "T3", value: 82 },
    { component: "Exhaust(Nozzle)", metric: "T1", value: 65 },
    { component: "Exhaust(Nozzle)", metric: "T2", value: 58 },
    { component: "Exhaust(Nozzle)", metric: "T3", value: 52 },
  ];

  // GTSU-110: Ngg 0–22,000 RPM — shaft and blade deformation vs speed
  const deformationVsRPMData = Array.from({ length: 20 }, (_, i) => ({
    x: (i + 1) * 1100,   // 1100 → 22000 RPM (Ngg range)
    y: 0.08 + Math.pow(i / 12, 1.8),
  }));

  // const fatigueTrendData = Array.from({ length: 20 }, (_, i) => ({
  //   x: i * 2500,
  //   y: 50000 - i * 2100 - Math.random() * 500,
  // }));
  const fatigueTrendData = Array.from({ length: 20 }, (_, i) => {
    const x = i * 2500; // cycle count
    const baseY = 50000 * Math.exp(-i / 5); // exponential decay
    const noise = (Math.random() - 0.5) * 2000; // ±1000 random variation
    return { x, y: baseY + noise };
  });

  const handleChartClick = (chartType: string) => {
    const chartData: { [key: string]: ChartModalData } = {
      stress: {
        title: "Stress Distribution Analysis",
        type: "Stress Heatmap",
        target: "Max stress below 750 MPa across all components",
        description: "Von Mises stress distribution showing critical hotspots exceeding target",
        aiInsight:
          "Turbine blade exhibits peak stress of 820 MPa (9.3% above target) at root fillet. Stress redistribution analysis shows top 3 regions with stress >80% of yield: (1) Blade root fillet: 820 MPa, (2) Trailing edge: 735 MPa, (3) Leading edge tip: 690 MPa. Geometric stress concentration factor of 2.8 at fillet indicates design improvement needed.",
        recommendedAction:
          "Priority actions: (1) Redesign fillet radius to 3.5mm to reduce SCF to 2.0, (2) Local reinforcement with 0.5mm thickness increase at trailing edge, (3) Material upgrade to Inconel 718 provides 25% strength margin, (4) Run topology optimization for load path efficiency.",
        confidence: 92,
        modelRef: "models/assembly_stress_heatmap.gltf",
        criticalRegions: ["Turbine blade root fillet", "Blade trailing edge mid-span", "Compressor leading edge"],
        stressRange: "380-820 MPa",
        material: "Ti-6Al-4V (Yield: 880 MPa)",
        meshSize: "0.5 mm avg, 0.3 mm at hotspots",
        load: "Centrifugal: 22000 RPM (GTSU-110 Ngg max), Thermal: 600°C gradient, Aerodynamic pressure",
        nextActions: [
          "Refine mesh to 0.3mm in critical regions",
          "Run topology optimization",
          "Consider local stiffening or material upgrade",
          "Validate with strain gauge physical testing",
        ],
      },
      thermal: {
        title: "Thermal Gradient Analysis",
        type: "Temperature Heatmap",
        target: "Thermal gradients <150°C/cm to minimize thermal stress",
        description: "Temperature distribution showing thermal gradients and hot spots",
        aiInsight:
          "Combustor section shows peak temperature of 98% normalized (1225°C). Hot spot detected at T2 position indicates uneven fuel distribution causing local thermal stress of +85 MPa. Turbine cooling effectiveness at 88% with thermal gradients of 180°C/cm exceeding target of 150°C/cm.",
        recommendedAction:
          "Optimize fuel injector spray pattern to reduce hot spot at combustor T2 position. Increase film cooling hole density by 20% at turbine leading edge. Redesign cooling channel geometry for uniform heat removal. Target gradient reduction to <150°C/cm.",
        confidence: 88,
        modelRef: "models/thermal_distribution.gltf",
        criticalRegions: ["Combustor hot spot T2", "Turbine leading edge", "Blade trailing edge"],
        stressRange: "Thermal stress: 45-130 MPa",
        material: "Inconel 625 combustor liner with TBC",
        meshSize: "0.8 mm thermal elements",
        load: "Heat flux: 450 kW/m² at combustor, Convection: 2500 W/m²K",
        nextActions: [
          "Optimize fuel injector spray angle",
          "Increase cooling hole density by 20%",
          "Redesign internal cooling channels",
          "Apply advanced TBC coating (0.5mm)",
        ],
      },
      deformation: {
        title: "Deformation vs RPM Analysis",
        type: "Displacement Chart",
        target: "Blade tip displacement <3.5 mm at max RPM (15000)",
        description: "Blade tip displacement correlation with engine rotational speed",
        aiInsight:
          "Non-linear deformation pattern observed above 12,000 RPM indicates onset of aeroelastic effects. At 15,000 RPM, displacement reaches 3.2 mm (91% of target). Exponential increase beyond 12,000 RPM suggests approaching critical speed. Current displacement within limits but trending toward target.",
        recommendedAction:
          "Monitor displacement trend carefully. If exceeding 3.5mm: (1) Reduce max RPM to 14,500, (2) Implement interblade damping to reduce vibration amplitude, (3) Increase blade stiffness via thickness adjustment or material upgrade, (4) Conduct flutter analysis for critical speeds.",
        confidence: 85,
        modelRef: "models/blade_deformation_animation.gltf",
        criticalRegions: ["Blade tip", "Mid-span suction surface", "Root attachment"],
        stressRange: "Deformation-induced stress: 180-420 MPa",
        material: "Ti-6Al-4V",
        meshSize: "0.4 mm blade elements",
        load: "Centrifugal force at variable RPM (5000-15000)",
        nextActions: [
          "Install interblade damping wire",
          "Conduct flutter analysis for critical speeds",
          "Consider tip shroud for stiffness",
          "Monitor real-time displacement with proximity probes",
        ],
      },
      fatigue: {
        title: "Fatigue Life Trend Analysis",
        type: "S-N Curve Analysis",
        target: "Fatigue life >50,000 cycles (design requirement)",
        description: "Predicted remaining fatigue life based on cumulative damage (Miner's rule)",
        aiInsight:
          "Fatigue consumption rate accelerating 15% faster than linear projection due to increasing stress amplitudes and environmental effects (oxidation, mean stress). Current trajectory: 35,400 cycles remaining (29% below target). Goodman analysis indicates mean stress of 550 MPa and amplitude of 180 MPa reducing life.",
        recommendedAction:
          "Immediate actions: (1) Shot peen blade surfaces to induce -200 MPa compressive residual stress (extends life 35%), (2) Apply oxidation-resistant coating (Cr-Al), (3) Reduce stress amplitude via damping or RPM reduction, (4) Schedule replacement at 32,000 cycles with 10% safety margin.",
        confidence: 89,
        modelRef: "models/fatigue_life_contour.gltf",
        criticalRegions: ["Trailing edge fillet", "Leading edge FOD zone", "Root bolt holes"],
        stressRange: "Cyclic stress: 370-730 MPa, Amplitude: 180 MPa",
        material: "Ti-6Al-4V (Fatigue limit: 510 MPa)",
        meshSize: "0.3 mm surface mesh for crack initiation sites",
        load: "Cyclic bending + tension, 850 Hz frequency",
        nextActions: [
          'Apply shot peening (Almen intensity 0.008-0.012")',
          "Install Cr-Al coating for oxidation protection",
          "Implement vibration damping system",
          "Plan replacement at 32,000 cycles",
        ],
      },
    };

    setSelectedChart(chartData[chartType]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">GTSU-110 Structural FEA & AI Insights</h2>
          <p className="text-gray-400 mt-1">GTSU-110 component structural analysis · Ti-6Al-4V / Inconel 718 / Inconel 625 · Ngg 0–22,000 RPM · ASME V&V 10</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 border border-purple-500/30 rounded-lg">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-gray-300">
            AI Engine: <span className="text-purple-500 font-semibold">Active</span>
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-5">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-400">FEA Analysis Status</h3>
            <p className="text-sm text-gray-300 mt-1">
              Last analysis: 2 minutes ago | 5 GTSU-110 components | 125,000 mesh elements | Ngg max: 22,000 RPM | Convergence: 0.0085
              <br />
              Click any KPI or chart for detailed technical analysis, 3D visualization, and AI-powered recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feaKPIs.map((kpi) => {
          const targetDelta = ((kpi.value - kpi.target) / kpi.target) * 100;
          return (
            <KPICard
              key={kpi.id}
              title={kpi.title}
              // value={kpi.value.toFixed(kpi.id === "safetyFactor" || kpi.id === "meshQuality" || kpi.id === "convergence" ? 2 : 0)}
              // value={kpi.value.toFixed(
              //   kpi.id === "safetyFactor" || kpi.id === "meshQuality" || kpi.id === "convergence" || kpi.id === "vonMisesStress" ? 2 : 2
              // )}
              value={
                typeof kpi.value === "number"
                  ? ["maxStrain", "convergence", "minStrain"].includes(kpi.id)
                    ? kpi.value.toPrecision(3) // small decimal, preserve precision
                    : kpi.value.toFixed(2) // normal rounding
                  : kpi.value
              }
              unit={kpi.unit}
              status={kpi.status}
              trend={targetDelta > 0 ? "up" : "down"}
              trendValue={`${Math.abs(targetDelta).toFixed(1)}% ${targetDelta > 0 ? "above" : "below"} target`}
              icon={
                kpi.id === "vonMisesStress" ? (
                  <Shield className="w-5 h-5" />
                ) : kpi.id === "maxStrain" ? (
                  <Activity className="w-5 h-5" />
                ) : kpi.id === "safetyFactor" ? (
                  <Gauge className="w-5 h-5" />
                ) : kpi.id === "fatigueLife" ? (
                  <TrendingUp className="w-5 h-5" />
                ) : kpi.id === "meshQuality" ? (
                  <Box className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )
              }
              onClick={() => setSelectedKPI(kpi)}
            />
          );
        })}
      </div>
      <FEADigitalTwin modelPath="/jet_engine.glb" />
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div onClick={() => handleChartClick("stress")} className="cursor-pointer transition-all hover:ring-2 hover:ring-green-500/50 rounded-lg">
          <BarChart data={stressDistributionData} title="Stress Distribution (Von Mises)" yAxisLabel="Stress (MPa)" height={350} />
        </div>
        <div onClick={() => handleChartClick("thermal")} className="cursor-pointer transition-all hover:ring-2 hover:ring-green-500/50 rounded-lg">
          <HeatmapChart data={thermalHeatmapData} title="Thermal Gradient Heatmap" minValue={0} maxValue={100} />
        </div>
      </div> */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          onClick={() => handleChartClick("deformation")}
          className="cursor-pointer transition-all hover:ring-2 hover:ring-green-500/50 rounded-lg"
        >
          <LineChart
            data={deformationVsRPMData}
            title="Blade Displacement vs Ngg (GTSU-110)"
            color="#3b82f6"
            yAxisLabel="Displacement (mm)"
            xAxisLabel="Ngg (RPM)"
            height={280}
          />
        </div>
        <div onClick={() => handleChartClick("fatigue")} className="cursor-pointer transition-all hover:ring-2 hover:ring-green-500/50 rounded-lg">
          <LineChart
            data={fatigueTrendData}
            title="Fatigue Life Trend"
            color="#3b82f6"
            yAxisLabel="Remaining Cycles"
            xAxisLabel="Operating Cycles"
            height={280}
          />
        </div>
      </div>

      {selectedKPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedKPI(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Brain className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedKPI.title}</h2>
                  <p className="text-gray-400 mt-1">{selectedKPI.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedKPI(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Value */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-gray-700 rounded-lg p-6">
                  <p className="text-sm text-gray-400 mb-2">Current Value</p>
                  <div className="flex items-baseline space-x-3">
                    <span
                      className={`text-4xl font-bold ${
                        selectedKPI.status === "critical" ? "text-red-500" : selectedKPI.status === "warning" ? "text-amber-500" : "text-green-500"
                      }`}
                    >
                      {typeof selectedKPI.value === "number"
                        ? selectedKPI.title === "Max Principal Strain" || selectedKPI.title === "Solver Convergence"
                          ? selectedKPI.value.toPrecision(3) // preserve small decimals
                          : selectedKPI.value.toFixed(2)
                        : selectedKPI.value}
                    </span>
                    {selectedKPI.unit && <span className="text-xl text-gray-500">{selectedKPI.unit}</span>}
                  </div>
                </div>

                {/* Target Value */}
                {/* {selectedKPI.target !== undefined && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6">
                    <p className="text-sm text-gray-400 mb-2">Target Value</p>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-bold text-blue-500">
                        {typeof selectedKPI.target === "number"
                          ? selectedKPI.title === "Max Principal Strain"
                            ? selectedKPI.target.toPrecision(3)
                            : selectedKPI.target.toFixed(2)
                          : selectedKPI.target}
                      </span>
                      {selectedKPI.unit && <span className="text-xl text-gray-500">{selectedKPI.unit}</span>}
                    </div>
                  </div>
                )} */}
                {selectedKPI.target !== undefined && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6">
                    <p className="text-sm text-gray-400 mb-2">Target Value</p>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-bold text-blue-500">
                        {typeof selectedKPI.target === "number" ? (
                          // ✅ handle single numeric target
                          selectedKPI.title === "Max Principal Strain" || selectedKPI.title === "Solver Convergence" ? (
                            selectedKPI.target.toPrecision(3)
                          ) : (
                            selectedKPI.target.toFixed(2)
                          )
                        ) : selectedKPI.target.min !== undefined && selectedKPI.target.max !== undefined ? (
                          // ✅ handle range target (min–max)
                          selectedKPI.title === "Max Principal Strain" || selectedKPI.title === "Solver Convergence" ? (
                            <>
                              {selectedKPI.target.min.toPrecision(3)} – {selectedKPI.target.max.toPrecision(3)}
                            </>
                          ) : (
                            <>
                              {selectedKPI.target.min.toFixed(2)} – {selectedKPI.target.max.toFixed(2)}
                            </>
                          )
                        ) : (
                          selectedKPI.target
                        )}
                      </span>
                      {selectedKPI.unit && <span className="text-xl text-gray-500">{selectedKPI.unit}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-amber-400">Target Performance Gap</h3>
                  <span
                    className={`text-2xl font-bold ${
                      selectedKPI.value > selectedKPI.target
                        ? "text-red-500"
                        : selectedKPI.value < selectedKPI.target * 0.95
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {((Math.abs(selectedKPI.value - selectedKPI.target) / selectedKPI.target) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="absolute top-0 left-0 h-4 bg-blue-500/30 rounded-full"
                    style={{ width: `${(selectedKPI.target / Math.max(selectedKPI.value, selectedKPI.target)) * 100}%` }}
                  />
                  <div
                    className={`absolute top-0 left-0 h-4 rounded-full ${
                      selectedKPI.status === "critical" ? "bg-red-500" : selectedKPI.status === "warning" ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${(selectedKPI.value / Math.max(selectedKPI.value, selectedKPI.target)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Current</span>
                  <span>Target</span>
                </div>
              </div> */}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">AI Analysis</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedKPI.aiInsight}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-amber-400 mb-2">Recommended Action</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedKPI.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Box className="w-5 h-5 text-green-500" />
                  <span>3D Model Reference</span>
                </h3>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <code className="text-sm text-green-400">{selectedKPI.modelRef}</code>
                  <p className="text-xs text-gray-400 mt-2">Interactive 3D visualization available in external viewer</p>
                </div>
              </div> */}

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>Technical Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Material</p>
                      <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.material}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Load Conditions</p>
                      <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.load}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mesh Quality</p>
                      <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.meshQuality}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Temperature</p>
                      <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.temperature}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stress Range</p>
                      <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.stressRange}</p>
                    </div>
                    {selectedKPI.technicalDetails.strainRange && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Strain Range</p>
                        <p className="text-sm text-gray-200">{selectedKPI.technicalDetails.strainRange}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Boundary Conditions</p>
                      <ul className="text-sm text-gray-200 space-y-1">
                        {selectedKPI.technicalDetails.boundaryConditions.map((bc, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{bc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Engineering Notes</p>
                  <p className="text-sm text-gray-300">{selectedKPI.technicalDetails.notes}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Critical Regions</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedKPI.criticalRegions.map((region, idx) => (
                    <span key={idx} className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Related FMEA Failure Modes</h3>
                <div className="space-y-2">
                  {selectedKPI.failureModes.map((fm, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{fm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Next Actions to Reach Target</h3>
                <ol className="space-y-2">
                  {selectedKPI.nextActions.map((action, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded">
                      <span className="text-green-500 font-bold mt-0.5">{idx + 1}.</span>
                      <span className="text-sm text-gray-300">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* <div>
                <h3 className="text-lg font-semibold text-white mb-4">Historical Trend (Last 20 Cycles)</h3>
                <LineChart
                  data={selectedKPI.trend}
                  title=""
                  color={selectedKPI.status === "critical" ? "#ef4444" : selectedKPI.status === "warning" ? "#f59e0b" : "#10b981"}
                  height={250}
                  yAxisLabel={selectedKPI.unit}
                  xAxisLabel="Cycle"
                />
              </div> */}

              {selectedKPI.predictedVsObserved && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Predicted vs Observed</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {selectedKPI.predictedVsObserved.map((data, idx) => (
                      <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-2">{data.label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Observed:</span>
                            <span className="text-sm font-semibold text-green-500">{data.observed}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Predicted:</span>
                            <span className="text-sm font-semibold text-blue-500">{data.predicted}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-gray-700">
                            <span className="text-xs text-gray-500">Error:</span>
                            <span className="text-xs font-semibold text-gray-400">
                              {((Math.abs(data.predicted - data.observed) / data.observed) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex space-x-3">
              <button
                onClick={() => setSelectedKPI(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              {/* <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Export Technical Report</span>
              </button> */}
            </div>
          </div>
        </div>
      )}

      {selectedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedChart(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-700 p-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Brain className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedChart.title}</h2>
                  <p className="text-gray-400 mt-1">{selectedChart.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedChart(null)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Analysis Type & Target</h3>
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold">{selectedChart.type}</span>
                </p>
                <p className="text-amber-400 text-sm mt-2">
                  <span className="font-semibold">Target:</span> {selectedChart.target}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">AI Confidence Score</p>
                  <span className="text-2xl font-bold text-green-500">{selectedChart.confidence}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${selectedChart.confidence}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">AI Analysis</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedChart.aiInsight}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-amber-400 mb-2">Recommended Actions</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedChart.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Box className="w-5 h-5 text-green-500" />
                  <span>3D Model Reference</span>
                </h3>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <code className="text-sm text-green-400">{selectedChart.modelRef}</code>
                  <p className="text-xs text-gray-400 mt-2">Interactive 3D visualization available in external viewer</p>
                </div>
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Stress Range</p>
                  <p className="text-sm text-gray-200">{selectedChart.stressRange}</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Material</p>
                  <p className="text-sm text-gray-200">{selectedChart.material}</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Mesh Size</p>
                  <p className="text-sm text-gray-200">{selectedChart.meshSize}</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Load</p>
                  <p className="text-sm text-gray-200">{selectedChart.load}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Critical Regions Identified</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedChart.criticalRegions.map((region, idx) => (
                    <span key={idx} className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Priority Actions</h3>
                <ol className="space-y-2">
                  {selectedChart.nextActions.map((action, idx) => (
                    <li key={idx} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded">
                      <span className="text-green-500 font-bold mt-0.5">{idx + 1}.</span>
                      <span className="text-sm text-gray-300">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="bg-gray-900 border-t border-gray-700 p-6 flex space-x-3 sticky bottom-0">
              <button
                onClick={() => setSelectedChart(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              {/* <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Export Analysis</span>
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
