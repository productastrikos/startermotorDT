import {
  PerformanceMetric,
  GTSUTelemetry,
  GTSUHealthState,
  StartCycleSample,
  FEAData,
  FMEAData,
  VibrationData,
  DesignIteration,
  AIRecommendation,
  StartScenario,
} from "../types/engine";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MAX_NGG_RPM = 22000;
const LIGHT_UP_NGG = 12625;
const LIGHT_UP_JPT = 135;
const JPT_GROUND_LIMIT = 900;
const JPT_FLIGHT_LIMIT = 1020;

// â”€â”€â”€ GTSU Live Telemetry (last 50 hourly snapshots) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generatePerformanceData = (): PerformanceMetric[] => {
  const data: PerformanceMetric[] = [];
  const now = new Date();
  for (let i = 50; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 3600000);
    const degradation = i / 50; // 0 = now, 1 = oldest
    data.push({
      timestamp: ts,
      jpt1: 620 + Math.sin(i / 4) * 30 + (1 - degradation) * 15,
      ngg: 18500 + Math.sin(i / 6) * 400,
      nggPct: ((18500 + Math.sin(i / 6) * 400) / MAX_NGG_RPM) * 100,
      p2p1: 3.8 - (1 - degradation) * 0.12 + Math.sin(i / 5) * 0.05,
      oat: 28 + Math.sin(i / 10) * 8,
      stepperPosition: 142 + Math.floor(Math.sin(i / 3) * 10),
      fuelMassFlow: 6.2 + Math.sin(i / 3) * 0.4,
      secuMainHealthy: true,
      bitPass: true,
      ipsMode: 0,
      milBusHealth: 98 + Math.floor(Math.random() * 2),
      arinc429Health: 97 + Math.floor(Math.random() * 3),
      startDuration: 42 + Math.floor(Math.random() * 4),
      startPhase: "self-sustaining",
      flightCycle: 50 - i,
      systemAvailability: 94 + Math.sin(i / 8) * 3,
      remainingUsefulLife: 480 - i * 2,
      engineEfficiency: 87 + Math.sin(i / 7) * 2,
    });
  }
  return data;
};

// â”€â”€â”€ Latest snapshot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateCurrentTelemetry = (): GTSUTelemetry => {
  const r = (base: number, spread: number) => base + (Math.random() - 0.5) * 2 * spread;
  const ngg = Math.round(r(18720, 180));
  return {
    timestamp: new Date(),
    jpt1: Math.round(r(648, 80)),        // 568–728 occasionally peaks near 820 warning
    ngg,
    nggPct: (ngg / MAX_NGG_RPM) * 100,
    p2p1: parseFloat(r(3.74, 0.12).toFixed(2)),
    oat: parseFloat(r(31, 4).toFixed(1)),
    stepperPosition: Math.round(r(148, 8)),
    fuelMassFlow: parseFloat(r(6.4, 0.4).toFixed(2)),
    secuMainHealthy: true,
    bitPass: true,
    ipsMode: 0,
    milBusHealth: Math.min(100, Math.round(r(97, 4))),
    arinc429Health: Math.min(100, Math.round(r(97, 3))),
    startDuration: Math.round(r(43, 3)),
    startPhase: "self-sustaining",
  };
};

// â”€â”€â”€ PHM Health State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateHealthState = (): GTSUHealthState => {
  const r = (base: number, spread: number) => base + (Math.random() - 0.5) * 2 * spread;
  const foulingIdx = parseFloat(r(24, 5).toFixed(1));
  const thermalFatigue = parseFloat(r(22, 4).toFixed(1));
  return {
    timestamp: new Date(),
    starterReadiness: parseFloat(r(82, 6).toFixed(1)),   // 76–88, sometimes < 80 warning
    rul: Math.round(r(392, 30)),                          // 362–422, well above 250 warning
    rulCycles: Math.round(r(210, 10)),
    compressorFoulingIndex: foulingIdx,
    creepLifeConsumption: parseFloat(r(18, 4).toFixed(1)),
    thermalFatigueAccumulation: thermalFatigue,
    hotStartRisk: parseFloat(r(14, 8).toFixed(1)),        // 6–22, occasionally > 30 warning
    hungStartProbability: parseFloat(r(8, 4).toFixed(1)),
    virtualSensorConfidence: parseFloat(r(0.94, 0.04).toFixed(2)),
    baselineJpt1: 635,
    baselineP2p1: 3.86,
    residualJpt1: parseFloat(r(13, 3).toFixed(1)),
    residualP2p1: parseFloat(r(-0.12, 0.04).toFixed(2)),
    // Derived health scores (100 = perfect, degrades with fouling / thermal fatigue)
    compressorHealth: Math.max(0, Math.min(100, parseFloat((100 - foulingIdx * 1.8).toFixed(1)))),
    combustorHealth:  Math.max(0, Math.min(100, parseFloat((100 - thermalFatigue * 1.6).toFixed(1)))),
  };
};

// â”€â”€â”€ Start-cycle scenarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateStartCycle = (scenario: StartScenario = "normal"): StartCycleSample[] => {
  const samples: StartCycleSample[] = [];

  for (let t = 0; t <= 60; t++) {
    let ngg = 0;
    let jpt1 = 28;
    let p2p1 = 1.0;
    let stepper = 0;
    let fuelFlow = 0;
    let phase: StartCycleSample["phase"] = "idle";
    let event: string | undefined;

    if (scenario === "normal") {
      if (t < 3) { ngg = t * 1500; jpt1 = 28; phase = "cranking"; if (t === 0) event = "Start Command"; }
      else if (t < 8) { ngg = 4500 + (t - 3) * 1200; jpt1 = 28 + (t - 3) * 15; stepper = (t - 3) * 20; fuelFlow = (t - 3) * 0.4; phase = "cranking"; if (t === 4) event = "Fuel-On"; }
      else if (t < 12) { ngg = 10500 + (t - 8) * 600; jpt1 = 103 + (t - 8) * 60; stepper = 100 + (t - 8) * 10; fuelFlow = 2 + (t - 8) * 0.5; phase = "light-up"; if (t === 9) event = "Light-Up"; }
      else if (t < 25) { ngg = LIGHT_UP_NGG + (t - 12) * 420; jpt1 = 343 + (t - 12) * 22; stepper = 140 + (t - 12) * 2; fuelFlow = 4 + (t - 12) * 0.18; phase = "acceleration"; }
      else { ngg = Math.min(18800, 17660 + (t - 25) * 60); jpt1 = Math.min(660, 630 + (t - 25) * 2); stepper = 148; fuelFlow = 6.4; phase = "self-sustaining"; if (t === 25) event = "Self-Sustaining"; }
    }

    if (scenario === "hot-start") {
      if (t < 3) { ngg = t * 1500; jpt1 = 28; phase = "cranking"; if (t === 0) event = "Start Command"; }
      else if (t < 8) { ngg = 4500 + (t - 3) * 1200; jpt1 = 28; stepper = (t - 3) * 30; fuelFlow = (t - 3) * 0.7; phase = "cranking"; if (t === 4) event = "Fuel-On (excess)"; }
      else if (t < 14) { ngg = 10500 + (t - 8) * 300; jpt1 = 103 + (t - 8) * 140; stepper = 160 + (t - 8) * 5; fuelFlow = 3.5 + (t - 8) * 0.8; phase = "light-up"; if (t === 9) event = "Light-Up"; }
      else { ngg = 12200; jpt1 = Math.min(JPT_GROUND_LIMIT + 80, 943 + (t - 14) * 5); stepper = 190; fuelFlow = 9; phase = "abort"; if (t === 14) event = "HOT START ABORT"; }
    }

    if (scenario === "hung-start") {
      if (t < 3) { ngg = t * 1500; jpt1 = 28; phase = "cranking"; if (t === 0) event = "Start Command"; }
      else if (t < 8) { ngg = 4500 + (t - 3) * 1200; jpt1 = 28; stepper = (t - 3) * 20; fuelFlow = (t - 3) * 0.4; phase = "cranking"; if (t === 4) event = "Fuel-On"; }
      else if (t < 12) { ngg = 10500 + (t - 8) * 600; jpt1 = 103 + (t - 8) * 30; stepper = 100; fuelFlow = 2; phase = "light-up"; if (t === 9) event = "Light-Up (weak)"; }
      else if (t < 30) { ngg = 11800 + Math.sin((t - 12) * 0.5) * 200; jpt1 = 223 + (t - 12) * 8; stepper = 145; fuelFlow = 4.5; phase = "acceleration"; if (t === 15) event = "HUNG START â€” Ngg stalled"; }
      else { ngg = 11500; jpt1 = 370; stepper = 145; fuelFlow = 4.5; phase = "abort"; if (t === 30) event = "Abort"; }
    }

    if (scenario === "fouling") {
      if (t < 3) { ngg = t * 1500; jpt1 = 28; phase = "cranking"; }
      else if (t < 8) { ngg = 4500 + (t - 3) * 1200; jpt1 = 28; stepper = (t - 3) * 20; fuelFlow = (t - 3) * 0.4; phase = "cranking"; }
      else if (t < 12) { ngg = 10500 + (t - 8) * 550; jpt1 = 103 + (t - 8) * 60; stepper = 110 + (t - 8) * 12; fuelFlow = 2.2 + (t - 8) * 0.55; phase = "light-up"; if (t === 9) event = "Light-Up"; }
      else if (t < 35) { ngg = LIGHT_UP_NGG + (t - 12) * 380; jpt1 = 343 + (t - 12) * 24; stepper = 155 + (t - 12) * 2; fuelFlow = 4.8 + (t - 12) * 0.2; phase = "acceleration"; if (t === 18) event = "Compressor fouling â€” P2/P1 drop"; }
      else { ngg = Math.min(18400, 17000 + (t - 35) * 50); jpt1 = Math.min(720, 683 + (t - 35) * 2); stepper = 162; fuelFlow = 7.2; phase = "self-sustaining"; }
      p2p1 = Math.max(3.1, 3.86 - t * 0.018); // progressive fouling drop
    }

    if (scenario === "sensor-drift") {
      if (t < 3) { ngg = t * 1500; jpt1 = 28; phase = "cranking"; }
      else if (t < 8) { ngg = 4500 + (t - 3) * 1200; jpt1 = 28; stepper = (t - 3) * 20; fuelFlow = (t - 3) * 0.4; phase = "cranking"; }
      else if (t < 12) { ngg = 10500 + (t - 8) * 600; jpt1 = 103 + (t - 8) * 60; stepper = 100; fuelFlow = 2; phase = "light-up"; }
      else { ngg = LIGHT_UP_NGG + (t - 12) * 420; jpt1 = 343 + (t - 12) * 22 + (t > 30 ? (t - 30) * 15 : 0); stepper = 148; fuelFlow = 6.4; phase = t < 25 ? "acceleration" : "self-sustaining"; if (t === 32) event = "Sensor drift detected â€” virtual sensor active"; }
    }

    if (p2p1 === 1.0 && scenario !== "fouling") {
      if (t < 8) p2p1 = 1.0 + t * 0.04;
      else if (t < 12) p2p1 = 1.32 + (t - 8) * 0.12;
      else p2p1 = Math.min(3.86, 1.8 + (t - 12) * 0.085);
    }

    samples.push({ t, ngg, jpt1, p2p1, stepperPos: stepper, fuelFlow, phase, event });
  }
  return samples;
};

// â”€â”€â”€ PHM trend data (50 start cycles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generatePHMTrend = (): GTSUHealthState[] => {
  const data: GTSUHealthState[] = [];
  const now = new Date();
  for (let i = 50; i >= 0; i--) {
    const degradation = (50 - i) / 50;
    data.push({
      timestamp: new Date(now.getTime() - i * 86400000),
      starterReadiness: 95 - degradation * 13,
      rul: 480 - degradation * 88,
      rulCycles: 260 - degradation * 50,
      compressorFoulingIndex: degradation * 24,
      creepLifeConsumption: degradation * 18,
      thermalFatigueAccumulation: degradation * 22,
      hotStartRisk: 5 + degradation * 7,
      hungStartProbability: 3 + degradation * 5,
      virtualSensorConfidence: 0.98 - degradation * 0.04,
      baselineJpt1: 635,
      baselineP2p1: 3.86,
      residualJpt1: degradation * 13,
      residualP2p1: -(degradation * 0.12),
    });
  }
  return data;
};

// â”€â”€â”€ FEA Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateFEAData = (): FEAData[] => [
  { timestamp: new Date(), componentName: "Compressor Rotor Blade", material: "Ti-6Al-4V", yieldStrength: 880, maxStress: 612, stressToYieldRatio: 0.70, fatigueLifeRemaining: 72, thermalStressMargin: 38, displacement: 0.4, creepParameter: 18200, temperature: 420 },
  { timestamp: new Date(), componentName: "Turbine Blade (HPT)", material: "Inconel 718", yieldStrength: 1100, maxStress: 913, stressToYieldRatio: 0.83, fatigueLifeRemaining: 51, thermalStressMargin: 22, displacement: 0.9, creepParameter: 21400, temperature: 870 },
  { timestamp: new Date(), componentName: "Combustor Liner", material: "Inconel 625", yieldStrength: 415, maxStress: 298, stressToYieldRatio: 0.72, fatigueLifeRemaining: 58, thermalStressMargin: 28, displacement: 1.1, creepParameter: 20100, temperature: 920 },
  { timestamp: new Date(), componentName: "Main Shaft", material: "Steel 4340", yieldStrength: 710, maxStress: 412, stressToYieldRatio: 0.58, fatigueLifeRemaining: 84, thermalStressMargin: 45, displacement: 0.2, creepParameter: 17800, temperature: 280 },
  { timestamp: new Date(), componentName: "Stepper Actuator Housing", material: "Al-7075", yieldStrength: 503, maxStress: 260, stressToYieldRatio: 0.52, fatigueLifeRemaining: 91, thermalStressMargin: 52, displacement: 0.15, creepParameter: 16500, temperature: 110 },
];

// â”€â”€â”€ FMEA Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateFMEAData = (): FMEAData[] => [
  { timestamp: new Date(), componentName: "Compressor Rotor & Stator Blades", failureMode: "Compressor Fouling", failureMechanism: "Sub-5Âµm particle adhesion on blade profiles â€” aerodynamic geometry alteration", severity: 7, occurrence: 5, detection: 3, rpn: 105, diagnosticSignature: "Gradual P2/P1 drop; increased stepper fuel demand to maintain Ngg baseline", recommendedAction: "Schedule compressor wash within 20 start cycles; increase P2/P1 monitoring frequency", mtbf: 600 },
  { timestamp: new Date(), componentName: "HPT Blades / Combustor Liner", failureMode: "Hot Start", failureMechanism: "Excessive fuel/air ratio during start â€” JPT1 exceeds structural limit (>900Â°C ground)", severity: 9, occurrence: 3, detection: 4, rpn: 108, diagnosticSignature: "JPT1 gradient > 80Â°C/s; Ngg < 12,625 RPM while JPT1 > 700Â°C", recommendedAction: "Abort start immediately; inspect combustor liner and HPT blades before next attempt", mtbf: 1200 },
  { timestamp: new Date(), componentName: "Main Shaft / Aerodynamic Flow Path", failureMode: "Hung Start", failureMechanism: "Engine ignites but fails to accelerate â€” Ngg stalls below self-sustaining RPM", severity: 8, occurrence: 4, detection: 3, rpn: 96, diagnosticSignature: "Ngg plateau < 12,625 RPM; stepper active; JPT1 slowly rising", recommendedAction: "Abort start; check for mechanical drag, bearing condition, and combustion efficiency", mtbf: 900 },
  { timestamp: new Date(), componentName: "Pressure Probes / Thermocouples", failureMode: "Sensor Drift / Failure", failureMechanism: "Step-change, flatlining, or erratic noise beyond engine physical inertia bounds", severity: 7, occurrence: 6, detection: 2, rpn: 84, diagnosticSignature: "Sensor output diverges from virtual sensor estimate by >15%; step-change signals", recommendedAction: "Activate virtual sensor redundancy; isolate faulty channel; replace probe at next MRO", mtbf: 800 },
  { timestamp: new Date(), componentName: "HPT Blades / Combustor Liner", failureMode: "Thermal Creep (Hot Corrosion)", failureMechanism: "Larson-Miller creep accumulation under sustained high-temperature cycling", severity: 9, occurrence: 2, detection: 5, rpn: 90, diagnosticSignature: "Elevated JPT1 baseline trend; creep parameter approaching TBO limit", recommendedAction: "Track Larson-Miller parameter; schedule HPT blade inspection at 18% creep life consumption", mtbf: 1500 },
  { timestamp: new Date(), componentName: "SECU ARM Processor / FPGA", failureMode: "SECU Processor Degradation", failureMechanism: "Main processor health flag set; BIT failure in closed-loop control path", severity: 8, occurrence: 2, detection: 2, rpn: 32, diagnosticSignature: "BIT fail flag; IPS takeover event logged; MIL-STD-1553B word anomaly", recommendedAction: "Replace SECU LRU immediately; log IPS takeover data for reliability analysis", mtbf: 2000 },
  { timestamp: new Date(), componentName: "IPS (Open-Loop Protection)", failureMode: "IPS Takeover Event", failureMechanism: "Main processor failure forces open-loop fuel control â€” degraded start authority", severity: 7, occurrence: 2, detection: 2, rpn: 28, diagnosticSignature: "IPS mode flag = 2 (degraded open-loop); reduced start success probability", recommendedAction: "Mandatory SECU LRU replacement before next operational sortie", mtbf: 2500 },
  { timestamp: new Date(), componentName: "3-Phase Stepper Actuator", failureMode: "Fuel Stepper Motor Anomaly", failureMechanism: "Mechanical binding or electrical fault in stepper motor â€” fuel flow inaccuracy", severity: 7, occurrence: 3, detection: 4, rpn: 84, diagnosticSignature: "Stepper position/Ngg correlation breaks down; fuel flow anomaly vs commanded position", recommendedAction: "Inspect stepper motor for binding; verify electrical connections; recalibrate fuel schedule", mtbf: 1100 },
];

// â”€â”€â”€ Vibration Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateVibrationData = (): VibrationData[] => {
  const data: VibrationData[] = [];
  const now = new Date();
  for (let i = 100; i >= 0; i--) {
    data.push({
      timestamp: new Date(now.getTime() - i * 60000),
      sensorLocation: "Main Shaft / Rotor",
      amplitude: 2.1 + Math.sin(i / 8) * 1.2 + Math.random() * 0.3,
      frequency: 310 + Math.random() * 15,
      measurementType: "velocity",
    });
  }
  return data;
};

// â”€â”€â”€ Design Iterations (start-sequence tuning) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateDesignIterations = (): DesignIteration[] => {
  const data: DesignIteration[] = [];
  for (let i = 1; i <= 20; i++) {
    data.push({
      iterationNumber: i,
      timestamp: new Date(Date.now() - (20 - i) * 86400000),
      optimizationScore: 62 + (i / 20) * 30,
      compressorEfficiency: 84 + (i / 20) * 4,
      pressureRatio: 3.6 + (i / 20) * 0.3,
      thermalStressMargin: 28 + (i / 20) * 18,
      fuelStepperBias: 0 - (i / 20) * 8,
      startDuration: 52 - (i / 20) * 10,
      designParameters: {
        stepperScheduleOffset: -(i * 0.4),
        jpt1LimitGround: 900,
        lightUpNggThreshold: LIGHT_UP_NGG,
        lightUpJptThreshold: LIGHT_UP_JPT,
      },
    });
  }
  return data;
};

// â”€â”€â”€ AI / PHM Recommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const generateAIRecommendations = (): AIRecommendation[] => [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1800000),
    recommendationType: "alert",
    priority: "warning",
    title: "Compressor Fouling Detected â€” P2/P1 Declining",
    description: "Hybrid Physics-Empirical Model (PINN residual) shows P2/P1 dropping 3.1% below baseline. Stepper fuel demand increased 8.5% to maintain Ngg. Compressor wash recommended within 20 start cycles.",
    affectedComponent: "Compressor Rotor & Stator Blades",
    confidenceScore: 0.91,
    status: "pending",
    detectedCondition: "compressor-fouling",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 7200000),
    recommendationType: "maintenance",
    priority: "info",
    title: "Creep Life Consumption at 18% TBO",
    description: "LSTM-based RUL model projects HPT blade creep life at 18% of TBO. Larson-Miller parameter trending upward. Schedule HPT inspection at next 50-hour interval.",
    affectedComponent: "HPT Blades / Combustor Liner",
    confidenceScore: 0.88,
    status: "acknowledged",
    detectedCondition: "creep-fatigue",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 10800000),
    recommendationType: "optimization",
    priority: "info",
    title: "Start Duration Optimization Available",
    description: "Data-driven residual analytics suggests stepper schedule early-ramp bias of -6 steps reduces average start duration by 4.2s while maintaining JPT1 < 780Â°C during acceleration.",
    affectedComponent: "Stepper Actuator / Start Sequence",
    confidenceScore: 0.83,
    status: "pending",
    detectedCondition: "start-optimization",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 14400000),
    recommendationType: "alert",
    priority: "critical",
    title: "Hot-Start Risk Index Elevated â€” Last 3 Starts",
    description: "Kalman state estimator shows JPT1 gradient exceeding nominal acceleration curve by 12Â°C/s during last 3 start attempts. PINN baseline deviation at 13Â°C. Pre-check fuel nozzle atomization.",
    affectedComponent: "Combustor Liner / HPT Hot Section",
    confidenceScore: 0.94,
    status: "pending",
    detectedCondition: "hot-start-risk",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 21600000),
    recommendationType: "maintenance",
    priority: "info",
    title: "RUL Forecast: 392 Hours / 210 Cycles",
    description: "GRU-based RUL prediction (ISO 23247 compliant) estimates 392 operating hours or 210 start cycles remaining before scheduled TBO. Plan maintenance window accordingly.",
    affectedComponent: "All Systems â€” TBO Schedule",
    confidenceScore: 0.96,
    status: "acknowledged",
    detectedCondition: "rul-forecast",
  },
];
