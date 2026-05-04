import { useState } from "react";
import { Zap, AlertTriangle, CheckCircle, Clock, Flame, Activity, ChevronRight } from "lucide-react";
import { LineChart } from "../components/LineChart";
import { generateStartCycle } from "../utils/mockData";
import type { StartScenario } from "../types/engine";

const scenarios: { id: StartScenario; label: string; color: string; risk: string; description: string }[] = [
  { id: "normal", label: "Normal Start", color: "text-green-400", risk: "Low", description: "Nominal start — JPT1 and Ngg within all limits. Stepper schedule nominal." },
  { id: "hot-start", label: "Hot Start", color: "text-red-400", risk: "Critical", description: "Excess fuel/air — JPT1 exceeds 900°C ground limit. Abort triggered by SECU." },
  { id: "hung-start", label: "Hung Start", color: "text-orange-400", risk: "High", description: "Engine ignites but Ngg stalls below 12,625 RPM self-sustaining threshold." },
  { id: "fouling", label: "Compressor Fouling", color: "text-yellow-400", risk: "Medium", description: "P2/P1 degraded from blade fouling — engine compensates with higher stepper demand." },
  { id: "sensor-drift", label: "Sensor Drift", color: "text-blue-400", risk: "Medium", description: "JPT1 sensor drift detected at t>30s — virtual sensor redundancy activated." },
];

const phaseColors: Record<string, string> = {
  idle: "bg-gray-700",
  cranking: "bg-blue-600",
  "light-up": "bg-orange-500",
  acceleration: "bg-yellow-500",
  "self-sustaining": "bg-green-500",
  abort: "bg-red-600",
};

const phaseLabels: Record<string, string> = {
  idle: "Idle",
  cranking: "Cranking",
  "light-up": "Light-Up",
  acceleration: "Acceleration",
  "self-sustaining": "Self-Sustaining",
  abort: "ABORT",
};

export function StartSequencePage() {
  const [activeScenario, setActiveScenario] = useState<StartScenario>("normal");
  const samples = generateStartCycle(activeScenario);
  const lastSample = samples[samples.length - 1];

  const jpt1Data = samples.map((s) => ({ x: s.t, y: s.jpt1 }));
  const nggData = samples.map((s) => ({ x: s.t, y: s.ngg / 22000 * 100 }));
  const p2p1Data = samples.map((s) => ({ x: s.t, y: s.p2p1 }));
  const fuelData = samples.map((s) => ({ x: s.t, y: s.fuelFlow }));
  const stepperData = samples.map((s) => ({ x: s.t, y: s.stepperPos }));

  const events = samples.filter((s) => s.event).map((s) => ({ t: s.t, event: s.event!, phase: s.phase }));

  const activeInfo = scenarios.find((s) => s.id === activeScenario)!;

  const riskColor = activeInfo.risk === "Critical" ? "text-red-400" : activeInfo.risk === "High" ? "text-orange-400" : activeInfo.risk === "Medium" ? "text-yellow-400" : "text-green-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Start Sequence Analysis</h2>
          <p className="text-gray-400 mt-1">GTSU-110 start cycle simulation · 5 fault scenarios · SECU/IPS logic validation</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-right">
          <p className="text-xs text-gray-500">Current Scenario</p>
          <p className={"text-sm font-bold " + activeInfo.color}>{activeInfo.label}</p>
          <p className={"text-xs " + riskColor}>Risk: {activeInfo.risk}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className={"rounded-xl border p-4 text-left transition-all " + (activeScenario === s.id ? "border-green-500 bg-green-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-600")}
          >
            <div className="flex items-center gap-2 mb-1">
              {s.risk === "Critical" ? <AlertTriangle className={"w-4 h-4 " + s.color} /> : s.risk === "Low" ? <CheckCircle className={"w-4 h-4 " + s.color} /> : <Zap className={"w-4 h-4 " + s.color} />}
              <span className={"text-sm font-semibold " + s.color}>{s.label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{s.description.substring(0, 60)}...</p>
            <div className={"mt-2 text-xs font-medium " + (s.risk === "Critical" ? "text-red-400" : s.risk === "High" ? "text-orange-400" : s.risk === "Medium" ? "text-yellow-400" : "text-green-400")}>
              Risk: {s.risk}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-1">{activeInfo.label} — Scenario Description</h3>
        <p className="text-gray-400 text-sm">{activeInfo.description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Peak JPT1", value: Math.round(Math.max(...samples.map((s) => s.jpt1))) + " °C", warn: Math.max(...samples.map((s) => s.jpt1)) > 900 },
          { label: "Max Ngg", value: Math.round(Math.max(...samples.map((s) => s.ngg))).toLocaleString() + " RPM", warn: false },
          { label: "End Phase", value: phaseLabels[lastSample.phase] ?? lastSample.phase, warn: lastSample.phase === "abort" },
          { label: "Max Fuel Flow", value: Math.max(...samples.map((s) => s.fuelFlow)).toFixed(1) + " kg/h", warn: Math.max(...samples.map((s) => s.fuelFlow)) > 8 },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={"text-xl font-bold " + (item.warn ? "text-red-400" : "text-green-400")}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-semibold text-white">JPT1 — Jet Pipe Temperature (°C)</h4>
            <span className="ml-auto text-xs text-red-400">Limit: 900°C</span>
          </div>
          <LineChart data={jpt1Data} color="#f97316" xLabel="Time (s)" yLabel="°C" height={160} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-white">Ngg — Gas Generator Speed (% max)</h4>
            <span className="ml-auto text-xs text-yellow-400">Light-up: 57.4%</span>
          </div>
          <LineChart data={nggData} color="#3b82f6" xLabel="Time (s)" yLabel="% Ngg" height={160} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-semibold text-white">P2/P1 — Compressor Pressure Ratio</h4>
          </div>
          <LineChart data={p2p1Data} color="#10b981" xLabel="Time (s)" yLabel="P2/P1" height={160} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">Stepper Position (steps)</h4>
          </div>
          <LineChart data={stepperData} color="#a855f7" xLabel="Time (s)" yLabel="Steps" height={160} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-semibold text-white">Fuel Mass Flow (kg/h)</h4>
            <span className="ml-auto text-xs text-gray-500">3-phase stepper</span>
          </div>
          <LineChart data={fuelData} color="#eab308" xLabel="Time (s)" yLabel="kg/h" height={160} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-pink-400" />
            <h4 className="text-sm font-semibold text-white">Stepper vs Fuel Correlation</h4>
            <span className="ml-auto text-xs text-gray-500">Actuation trace</span>
          </div>
          <LineChart data={samples.map((s) => ({ x: s.stepperPos, y: s.fuelFlow }))} color="#ec4899" xLabel="Stepper (steps)" yLabel="kg/h" height={160} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Start Sequence Event Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
          <div className="space-y-4">
            {events.map((ev, i) => (
              <div key={i} className="flex items-start gap-4 pl-10 relative">
                <div className={"absolute left-2 w-4 h-4 rounded-full border-2 border-gray-900 " + phaseColors[ev.phase]}></div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-500 w-12">t={ev.t}s</span>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + phaseColors[ev.phase] + " text-white"}>{phaseLabels[ev.phase]}</span>
                  <span className="text-sm text-gray-200">{ev.event}</span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Phase-by-Phase Timeline</h3>
        <div className="flex gap-1 h-10 rounded-lg overflow-hidden">
          {samples.map((s, i) => (
            <div key={i} className={"flex-1 " + phaseColors[s.phase]} title={"t=" + s.t + "s: " + phaseLabels[s.phase]} />
          ))}
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {Object.entries(phaseColors).map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className={"w-3 h-3 rounded-sm " + color}></div>
              <span className="text-xs text-gray-400">{phaseLabels[phase]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
