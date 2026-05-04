import { useState } from "react";
import { Brain, Activity, Flame, Thermometer, Zap, Shield, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import { AIRecommendationPanel } from "../components/AIRecommendationPanel";
import { generatePHMTrend, generateAIRecommendations, generateHealthState } from "../utils/mockData";

export function PHMPage() {
  const health = generateHealthState();
  const trend = generatePHMTrend();
  const [recommendations] = useState(generateAIRecommendations());

  const rulTrend = trend.map((h, i) => ({ x: i, y: h.rul }));
  const foulingTrend = trend.map((h, i) => ({ x: i, y: h.compressorFoulingIndex }));
  const creepTrend = trend.map((h, i) => ({ x: i, y: h.creepLifeConsumption }));
  const hotStartTrend = trend.map((h, i) => ({ x: i, y: h.hotStartRisk }));
  const readinessTrend = trend.map((h, i) => ({ x: i, y: h.starterReadiness }));
  const jpt1ResidualTrend = trend.map((h, i) => ({ x: i, y: h.residualJpt1 }));

  const degradationBars = [
    { label: "Fouling Index", value: health.compressorFoulingIndex },
    { label: "Creep Life %", value: health.creepLifeConsumption },
    { label: "Thermal Fatigue", value: health.thermalFatigueAccumulation },
    { label: "Hot Start Risk", value: health.hotStartRisk },
    { label: "Hung Start Prob.", value: health.hungStartProbability },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PHM Dashboard</h2>
          <p className="text-gray-400 mt-1">Prognostics & Health Management · GTSU-110 · GRU/LSTM-based RUL · PINN Baseline · ISO 23247</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-right">
          <p className="text-xs text-gray-500">Starter Readiness</p>
          <p className={"text-2xl font-bold " + (health.starterReadiness > 80 ? "text-green-400" : health.starterReadiness > 60 ? "text-yellow-400" : "text-red-400")}>{Math.round(health.starterReadiness)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: "RUL (Hours)", value: health.rul + " h", icon: <Clock className="w-4 h-4" />, ok: health.rul > 200 },
          { label: "RUL (Cycles)", value: health.rulCycles + " cyc", icon: <Activity className="w-4 h-4" />, ok: health.rulCycles > 100 },
          { label: "Fouling Index", value: health.compressorFoulingIndex.toFixed(1) + "%", icon: <Activity className="w-4 h-4" />, ok: health.compressorFoulingIndex < 30 },
          { label: "Creep Life Used", value: health.creepLifeConsumption.toFixed(1) + "%", icon: <Flame className="w-4 h-4" />, ok: health.creepLifeConsumption < 20 },
          { label: "Thermal Fatigue", value: health.thermalFatigueAccumulation.toFixed(1) + "%", icon: <Thermometer className="w-4 h-4" />, ok: health.thermalFatigueAccumulation < 25 },
          { label: "JPT1 Residual", value: "+" + health.residualJpt1.toFixed(1) + "°C", icon: <AlertTriangle className="w-4 h-4" />, ok: health.residualJpt1 < 20 },
          { label: "V-Sensor Conf.", value: (health.virtualSensorConfidence * 100).toFixed(0) + "%", icon: <Shield className="w-4 h-4" />, ok: health.virtualSensorConfidence > 0.9 },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className={"flex items-center gap-1.5 mb-1 " + (item.ok ? "text-green-400" : "text-yellow-400")}>{item.icon}<p className="text-xs text-gray-500">{item.label}</p></div>
            <p className={"text-lg font-bold " + (item.ok ? "text-green-400" : "text-yellow-400")}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">RUL Forecast (GRU/LSTM)</h3>
          </div>
          <LineChart data={rulTrend} color="#10b981" xLabel="Days" yLabel="Hours" height={180} />
          <p className="text-xs text-gray-500 mt-2">ISO 23247 compliant prognostics · 95% confidence bounds</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Compressor Fouling Index</h3>
          </div>
          <LineChart data={foulingTrend} color="#f59e0b" xLabel="Days" yLabel="%" height={180} />
          <p className="text-xs text-gray-500 mt-2">Sub-5μm particle adhesion tracking · P2/P1 residual baseline</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">Creep Life Consumption</h3>
          </div>
          <LineChart data={creepTrend} color="#ef4444" xLabel="Days" yLabel="%" height={180} />
          <p className="text-xs text-gray-500 mt-2">Larson-Miller creep parameter · HPT blade tracking</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-semibold">Hot Start Risk Index</h3>
          </div>
          <LineChart data={hotStartTrend} color="#f97316" xLabel="Days" yLabel="%" height={180} />
          <p className="text-xs text-gray-500 mt-2">Kalman state estimator · JPT1 gradient tracking</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Starter Readiness Trend</h3>
          </div>
          <LineChart data={readinessTrend} color="#3b82f6" xLabel="Days" yLabel="%" height={180} />
          <p className="text-xs text-gray-500 mt-2">Composite PHM score · SECU + sensor + mechanical</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">JPT1 Residual (PINN)</h3>
          </div>
          <LineChart data={jpt1ResidualTrend} color="#a855f7" xLabel="Days" yLabel="ΔT°C" height={180} />
          <p className="text-xs text-gray-500 mt-2">Physics-Informed Neural Network baseline deviation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Current Degradation State</h3>
          </div>
          <BarChart data={degradationBars.map((b) => ({ label: b.label, value: b.value }))} xLabel="" yLabel="%" height={220} />
          <div className="mt-3 text-xs text-gray-500">
            <p>• Fouling: Schedule wash at &gt;30% (every 20 cycles)</p>
            <p>• Creep: Schedule HPT inspection at 20% TBO</p>
            <p>• Hot Start: Pre-check atomisation nozzle &gt;15%</p>
          </div>
        </div>

        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold">PHM Architecture</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Sensor Layer",
                color: "border-blue-500",
                items: ["JPT1 thermocouples (redundant)", "Ngg magnetic pickup", "P2/P1 pressure probes", "ARINC 429 / MIL-1553B buses"],
              },
              {
                title: "Physics Model (PINN)",
                color: "border-green-500",
                items: ["Thermodynamic cycle model", "Blade aerodynamics baseline", "Larson-Miller creep predictor", "JPT1/P2P1 residual monitoring"],
              },
              {
                title: "Data-Driven Layer",
                color: "border-purple-500",
                items: ["LSTM time-series prediction", "GRU-based RUL forecast", "Kalman filter state estimation", "Anomaly detection classifier"],
              },
              {
                title: "Decision Layer",
                color: "border-yellow-500",
                items: ["SECU abort logic (JPT1 > 900°C)", "IPS open-loop takeover", "Virtual sensor activation", "Maintenance action scheduler"],
              },
            ].map((layer) => (
              <div key={layer.title} className={"bg-gray-800 border rounded-lg p-3 " + layer.color}>
                <h4 className="text-sm font-semibold text-white mb-2">{layer.title}</h4>
                <ul className="space-y-1">
                  {layer.items.map((item) => (
                    <li key={item} className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AIRecommendationPanel recommendations={recommendations} />
    </div>
  );
}
