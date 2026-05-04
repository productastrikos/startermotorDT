import { useState } from "react";
import { AlertTriangle, Shield, Activity, CheckCircle, Brain, X, FileText, Zap } from "lucide-react";
import { BarChart } from "../components/BarChart";
import { generateFMEAData } from "../utils/mockData";
import type { FMEAData } from "../types/engine";

const riskColor = (rpn: number) =>
  rpn >= 100 ? "text-red-400" : rpn >= 60 ? "text-yellow-400" : "text-green-400";

const riskBg = (rpn: number) =>
  rpn >= 100 ? "bg-red-500/10 border-red-500/30" : rpn >= 60 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";

const riskLabel = (rpn: number) =>
  rpn >= 100 ? "HIGH RISK" : rpn >= 60 ? "MEDIUM" : "LOW";

export function FMEAPage() {
  const fmeaData = generateFMEAData();
  const [selected, setSelected] = useState<FMEAData | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = fmeaData.filter((f) => {
    if (filter === "high") return f.rpn >= 100;
    if (filter === "medium") return f.rpn >= 60 && f.rpn < 100;
    if (filter === "low") return f.rpn < 60;
    return true;
  });

  const avgRpn = Math.round(fmeaData.reduce((a, b) => a + b.rpn, 0) / fmeaData.length);
  const maxRpn = Math.max(...fmeaData.map((f) => f.rpn));
  const criticalCount = fmeaData.filter((f) => f.rpn >= 100).length;

  const rpnBars = fmeaData.map((f) => ({ label: f.failureMode.substring(0, 18), value: f.rpn }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">FMEA Analysis</h2>
          <p className="text-gray-400 mt-1">GTSU-110 Failure Mode & Effects Analysis · SAE ARP4761 · 8 identified failure modes</p>
        </div>
        <div className="flex gap-2">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " +
                (filter === f
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-900 text-gray-500 border border-gray-800 hover:text-gray-300")}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-xs text-gray-500 mt-1">High Risk (RPN≥100)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Shield className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{maxRpn}</p>
          <p className="text-xs text-gray-500 mt-1">Max RPN</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{avgRpn}</p>
          <p className="text-xs text-gray-500 mt-1">Avg RPN</p>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{fmeaData.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Failure Modes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">RPN by Failure Mode</h3>
          <BarChart data={rpnBars} xLabel="Failure Mode" yLabel="RPN" height={220} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>High Risk ≥100</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>Medium 60–99</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Low &lt;60</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Risk Summary</h3>
          </div>
          <div className="space-y-3">
            {fmeaData.sort((a, b) => b.rpn - a.rpn).map((f) => (
              <button
                key={f.failureMode}
                onClick={() => setSelected(f)}
                className={"w-full flex items-center justify-between rounded-lg p-2.5 border text-left transition-all hover:opacity-90 " + riskBg(f.rpn)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-200 truncate">{f.failureMode}</p>
                  <p className="text-xs text-gray-500 truncate">{f.componentName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={"text-sm font-bold " + riskColor(f.rpn)}>{f.rpn}</p>
                  <p className={"text-xs " + riskColor(f.rpn)}>{riskLabel(f.rpn)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((f) => (
          <div
            key={f.failureMode}
            className={"bg-gray-900 border rounded-xl p-5 cursor-pointer hover:border-gray-600 transition-all " + riskBg(f.rpn)}
            onClick={() => setSelected(f)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className={"w-4 h-4 " + riskColor(f.rpn)} />
                  <h4 className="text-sm font-bold text-white">{f.failureMode}</h4>
                  <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + riskBg(f.rpn) + " " + riskColor(f.rpn)}>{riskLabel(f.rpn)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1"><span className="text-gray-400">Component:</span> {f.componentName}</p>
                <p className="text-xs text-gray-400 mb-2">{f.failureMechanism}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-gray-500">S: <span className="text-gray-300 font-semibold">{f.severity}</span></span>
                  <span className="text-gray-500">O: <span className="text-gray-300 font-semibold">{f.occurrence}</span></span>
                  <span className="text-gray-500">D: <span className="text-gray-300 font-semibold">{f.detection}</span></span>
                  {f.mtbf && <span className="text-gray-500">MTBF: <span className="text-gray-300 font-semibold">{f.mtbf}h</span></span>}
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <p className={"text-3xl font-bold " + riskColor(f.rpn)}>{f.rpn}</p>
                <p className="text-xs text-gray-500">RPN</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
              <span className="text-yellow-400 font-medium">Diagnostic: </span>{f.diagnosticSignature}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className={"bg-gray-900 border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto " + riskBg(selected.rpn)} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={"w-5 h-5 " + riskColor(selected.rpn)} />
                  <h3 className="text-lg font-bold text-white">{selected.failureMode}</h3>
                </div>
                <p className="text-sm text-gray-400">{selected.componentName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[{ label: "Severity", value: selected.severity }, { label: "Occurrence", value: selected.occurrence }, { label: "Detection", value: selected.detection }].map((v) => (
                <div key={v.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{v.label}</p>
                  <p className={"text-2xl font-bold " + riskColor(selected.rpn)}>{v.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-center mb-5">
              <p className="text-xs text-gray-500">RPN = S × O × D</p>
              <p className={"text-3xl font-bold " + riskColor(selected.rpn)}>{selected.rpn}</p>
              <p className={"text-sm font-medium " + riskColor(selected.rpn)}>{riskLabel(selected.rpn)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Failure Mechanism</h4>
                <p className="text-sm text-gray-300">{selected.failureMechanism}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-yellow-400 uppercase mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Diagnostic Signature</h4>
                <p className="text-sm text-gray-300">{selected.diagnosticSignature}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-green-400 uppercase mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Recommended Action</h4>
                <p className="text-sm text-gray-300">{selected.recommendedAction}</p>
              </div>
              {selected.mtbf && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Predicted MTBF</p>
                  <p className="text-sm font-bold text-blue-400">{selected.mtbf} hours</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
