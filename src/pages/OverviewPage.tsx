import { useState, useMemo } from "react";
import {
  Activity,
  Gauge,
  Zap,
  Clock,
  Flame,
  Brain,
  Thermometer,
  Shield,
  Cpu,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { KPICard } from "../components/KPICard";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import { AIRecommendationPanel } from "../components/AIRecommendationPanel";
import { KPIDetailModal } from "../components/KPIDetailModal";
import { EngineDigitalTwin } from "../components/EngineDigitalTwin";
import {
  generatePerformanceData,
  generateAIRecommendations,
} from "../utils/mockData";
import { useGTSUStore } from "../store/useGTSUStore";
import { getThresholdStatus } from "../utils/thresholds";
import {
  getRULDetail,
  getEngineEfficiencyDetail,
  getSystemAvailabilityDetail,
  KPIDetail,
} from "../utils/kpiDetails";

const MAX_NGG_RPM = 22000;
const JPT_GROUND_LIMIT = 900;

export function OverviewPage() {
  // ── Live telemetry and health from Zustand store (updated every 5s by App.tsx) ──
  const { telemetry, health } = useGTSUStore();

  // Performance trend data — generated once on mount for charts
  const performanceData = useMemo(() => generatePerformanceData(), []);
  const [recommendations] = useState(generateAIRecommendations());
  const [selectedKPI, setSelectedKPI] = useState<KPIDetail | null>(null);

  const jpt1Trend = performanceData.map((d, i) => ({ x: i, y: d.jpt1 }));
  const nggTrend = performanceData.map((d, i) => ({ x: i, y: d.nggPct ?? 0 }));
  const p2p1Trend = performanceData.map((d, i) => ({ x: i, y: d.p2p1 }));
  const availabilityTrend = performanceData.slice(-20).map((d, i) => ({ x: i, y: d.systemAvailability ?? 94 }));

  const phmBars = [
    { label: "Fouling", value: health.compressorFoulingIndex },
    { label: "Creep Life", value: health.creepLifeConsumption },
    { label: "Therm. Fatigue", value: health.thermalFatigueAccumulation },
    { label: "Hot Start Risk", value: health.hotStartRisk },
    { label: "Hung Start", value: health.hungStartProbability },
  ];

  const jpt1Status = telemetry.jpt1 > JPT_GROUND_LIMIT ? "critical" : telemetry.jpt1 > 780 ? "warning" : "normal";
  const nggStatus = (telemetry.nggPct ?? 85) > 95 ? "critical" : (telemetry.nggPct ?? 85) > 88 ? "warning" : "normal";
  const p2p1Status = telemetry.p2p1 < 3.4 ? "critical" : telemetry.p2p1 < 3.6 ? "warning" : "normal";
  const ipsLabel = ["Normal", "Emergency Armed", "Degraded Open-Loop"][telemetry.ipsMode];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">GTSU-110 Digital Twin Dashboard</h2>
          <p className="text-gray-400 mt-1">HAL Gas Turbine Starter Unit · DRISHTI Challenge 5 · ISO 23247 · MIL-STD-1553B</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Last Updated</p>
          <p className="text-lg font-semibold text-green-500">{new Date().toLocaleTimeString()}</p>
          <p className="text-xs text-gray-500 mt-1">SECU: {telemetry.secuMainHealthy ? "MAIN OK" : "MAIN FAIL"} · IPS: {ipsLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="JPT1 Temperature" value={Math.round(telemetry.jpt1)} unit="°C" status={jpt1Status} trend="up" trendValue={"Limit: " + JPT_GROUND_LIMIT + "°C"} icon={<Thermometer className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getEngineEfficiencyDetail(telemetry.jpt1), title: "JPT1 — Jet Pipe Temperature", description: "Current: " + telemetry.jpt1 + "°C | Ground limit: 900°C | Flight limit: 1020°C | Light-up detection: 135°C", unit: "°C", target: 900, status: jpt1Status })} />
        <KPICard title="Ngg Speed" value={Math.round(telemetry.nggPct ?? (telemetry.ngg / MAX_NGG_RPM) * 100)} unit="% Ngg" status={nggStatus} trend="up" trendValue={telemetry.ngg.toLocaleString() + " RPM"} icon={<Gauge className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getEngineEfficiencyDetail(telemetry.nggPct ?? 85), title: "Ngg — Gas Generator Speed", description: "Current: " + telemetry.ngg.toLocaleString() + " RPM (" + (telemetry.nggPct ?? 85).toFixed(1) + "%) | Max: 22,000 RPM | Light-up: 12,625 RPM", unit: "% Ngg", target: 95, status: nggStatus })} />
        <KPICard title="P2/P1 Pressure Ratio" value={telemetry.p2p1} unit=":1" status={p2p1Status} trend={telemetry.p2p1 < health.baselineP2p1 ? "down" : "up"} trendValue={"Baseline: " + health.baselineP2p1} icon={<Zap className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getEngineEfficiencyDetail(telemetry.p2p1), title: "P2/P1 — Compressor Pressure Ratio", description: "Current: " + telemetry.p2p1 + " | Baseline: " + health.baselineP2p1 + " | Residual: " + health.residualP2p1.toFixed(3), unit: ":1", target: 3.86, status: p2p1Status })} />
        <KPICard title="Fuel Mass Flow" value={telemetry.fuelMassFlow} unit="kg/h" status="normal" trend="neutral" trendValue={"Stepper: " + telemetry.stepperPosition + " steps"} icon={<Flame className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getEngineEfficiencyDetail(telemetry.fuelMassFlow), title: "Fuel Mass Flow", description: "Current: " + telemetry.fuelMassFlow + " kg/h | Stepper position: " + telemetry.stepperPosition + " steps | 3-phase stepper motor control", unit: "kg/h", target: 6.4, status: "normal" })} />
        <KPICard title="System Availability" value={Math.round(performanceData[performanceData.length - 1].systemAvailability ?? 94)} unit="%" status={getThresholdStatus(performanceData[performanceData.length - 1].systemAvailability ?? 94, "systemAvailability")} trend="up" trendValue="+1.2% this month" icon={<Activity className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getSystemAvailabilityDetail(performanceData[performanceData.length - 1].systemAvailability ?? 94), status: getThresholdStatus(performanceData[performanceData.length - 1].systemAvailability ?? 94, "systemAvailability") })} />
        <KPICard title="RUL" value={health.rul} unit="hrs" status={getThresholdStatus(health.rul, "remainingUsefulLife")} trend="down" trendValue={health.rulCycles + " cycles"} icon={<Clock className="w-5 h-5" />} onClick={() => setSelectedKPI({ ...getRULDetail(health.rul), status: getThresholdStatus(health.rul, "remainingUsefulLife") })} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: "Start Duration", value: telemetry.startDuration + "s", sub: "Nominal <50s", ok: telemetry.startDuration < 50 },
          { label: "OAT", value: telemetry.oat + "°C", sub: "Outside Air Temp", ok: true },
          { label: "SECU Main", value: telemetry.secuMainHealthy ? "HEALTHY" : "FAULT", sub: "ARM + SPARTAN 6", ok: telemetry.secuMainHealthy },
          { label: "IPS Mode", value: ipsLabel, sub: "Open-loop protection", ok: telemetry.ipsMode === 0 },
          { label: "BIT Status", value: telemetry.bitPass ? "PASS" : "FAIL", sub: "Built-In Test", ok: telemetry.bitPass },
          { label: "MIL-1553B Bus", value: telemetry.milBusHealth + "%", sub: "Data bus health", ok: telemetry.milBusHealth > 95 },
          { label: "ARINC 429", value: telemetry.arinc429Health + "%", sub: "Avionics bus", ok: telemetry.arinc429Health > 95 },
          { label: "Starter Ready", value: Math.round(health.starterReadiness) + "%", sub: "PHM readiness", ok: health.starterReadiness > 70 },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={"text-sm font-bold " + (item.ok ? "text-green-400" : "text-red-400")}>{item.value}</p>
            <p className="text-xs text-gray-600 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">GTSU-110 Engine Digital Twin</h3>
              <p className="text-xs text-gray-500 mt-0.5">Click hotspots to inspect sub-systems · ISO 23247 Level 4</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              <span className="text-green-400">Nominal</span>
              <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block ml-2"></span>
              <span className="text-yellow-400">Warning</span>
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-2"></span>
              <span className="text-red-400">Critical</span>
            </div>
          </div>
          <div className="h-96">
            <EngineDigitalTwin />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">PHM Health State</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Starter Readiness", value: health.starterReadiness, limit: 70, unit: "%", inverted: false, icon: <Shield className="w-4 h-4" /> },
              { label: "Compressor Fouling", value: health.compressorFoulingIndex, limit: 30, unit: "%", inverted: true, icon: <Activity className="w-4 h-4" /> },
              { label: "Creep Life Consumed", value: health.creepLifeConsumption, limit: 20, unit: "%", inverted: true, icon: <Flame className="w-4 h-4" /> },
              { label: "Thermal Fatigue", value: health.thermalFatigueAccumulation, limit: 25, unit: "%", inverted: true, icon: <Thermometer className="w-4 h-4" /> },
              { label: "Hot Start Risk", value: health.hotStartRisk, limit: 15, unit: "%", inverted: true, icon: <AlertTriangle className="w-4 h-4" /> },
              { label: "Hung Start Prob.", value: health.hungStartProbability, limit: 10, unit: "%", inverted: true, icon: <Zap className="w-4 h-4" /> },
              { label: "V-Sensor Confidence", value: Math.round(health.virtualSensorConfidence * 100), limit: 90, unit: "%", inverted: false, icon: <Cpu className="w-4 h-4" /> },
            ].map((item) => {
              const bad = item.inverted ? item.value > item.limit : item.value < item.limit;
              const warn = item.inverted ? item.value > item.limit * 0.7 : item.value < item.limit * 1.15;
              const color = bad ? "bg-red-500" : warn ? "bg-yellow-500" : "bg-green-500";
              const textColor = bad ? "text-red-400" : warn ? "text-yellow-400" : "text-green-400";
              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className={"flex items-center gap-1.5 " + textColor}>{item.icon}<span className="text-xs font-medium text-gray-300">{item.label}</span></div>
                    <span className={"text-sm font-bold " + textColor}>{item.value.toFixed(1)}{item.unit}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={"h-full " + color + " rounded-full transition-all"} style={{ width: Math.min(100, item.value) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">PINN Baseline Residuals</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">ΔJPτ1</p>
                <p className={"text-lg font-bold " + (Math.abs(health.residualJpt1) > 20 ? "text-red-400" : Math.abs(health.residualJpt1) > 10 ? "text-yellow-400" : "text-green-400")}>+{health.residualJpt1.toFixed(1)}°C</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">ΔP2/P1</p>
                <p className={"text-lg font-bold " + (Math.abs(health.residualP2p1) > 0.2 ? "text-red-400" : Math.abs(health.residualP2p1) > 0.1 ? "text-yellow-400" : "text-green-400")}>{health.residualP2p1.toFixed(3)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">JPT1 Trend (50 hrs)</h4>
            <span className="text-xs text-gray-500">°C</span>
          </div>
          <LineChart data={jpt1Trend} color="#f97316" xLabel="Hours" yLabel="°C" height={140} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Ngg % Trend (50 hrs)</h4>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <LineChart data={nggTrend} color="#3b82f6" xLabel="Hours" yLabel="%" height={140} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">P2/P1 Trend (50 hrs)</h4>
            <span className="text-xs text-gray-500">ratio</span>
          </div>
          <LineChart data={p2p1Trend} color="#10b981" xLabel="Hours" yLabel="P2/P1" height={140} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">System Availability (20 hrs)</h4>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <LineChart data={availabilityTrend} color="#a855f7" xLabel="Hours" yLabel="%" height={140} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Degradation Indicators</h3>
          </div>
          <BarChart data={phmBars.map((b) => ({ label: b.label, value: b.value }))} xLabel="Indicator" yLabel="%" height={200} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-500">RUL</p>
              <p className="text-sm font-bold text-green-400">{health.rul}h</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-500">Cycles Left</p>
              <p className="text-sm font-bold text-green-400">{health.rulCycles}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-2">
              <p className="text-xs text-gray-500">V-Sensor</p>
              <p className="text-sm font-bold text-blue-400">{(health.virtualSensorConfidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
        <div className="xl:col-span-2">
          <AIRecommendationPanel recommendations={recommendations} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">GTSU-110 Specification Quick Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "JPT1 Ground Limit", value: "900 °C" },
            { label: "JPT1 Flight Limit", value: "1020 °C" },
            { label: "Light-Up JPT1", value: "> 135 °C" },
            { label: "Light-Up Ngg", value: "> 12,625 RPM" },
            { label: "Max Ngg", value: "22,000 RPM" },
            { label: "Power Supply", value: "115/200V AC 400Hz" },
            { label: "DC Power", value: "16–31.5V DC" },
            { label: "Power Consumption", value: "75–200W" },
            { label: "In-Flight Start", value: "Up to 6 km alt." },
            { label: "SECU Controller", value: "ARM + SPARTAN 6" },
            { label: "Data Bus", value: "MIL-STD-1553B" },
            { label: "Avionics Bus", value: "ARINC 429" },
          ].map((spec) => (
            <div key={spec.label} className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <p className="text-sm font-semibold text-green-400">{spec.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedKPI && <KPIDetailModal kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />}
    </div>
  );
}
