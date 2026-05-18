import React, { useEffect } from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { SCENARIO_LABELS, SCENARIO_DESCRIPTIONS, SCENARIO_RISK } from '../lib/telemetrySimulator';
import type { ExtendedScenario, SeverityLevel } from '../lib/telemetrySimulator';
import { Play, Pause, RotateCcw, SkipForward, AlertTriangle, Siren } from 'lucide-react';

// ─── Mini telemetry strip ─────────────────────────────────────────────────────

function TelemetryStrip() {
  const { telemetry, vibration, dataQuality, thermalLifeConsumed } = useGTSUStore();
  const items = [
    { label: 'JPT1', value: `${telemetry.jpt1.toFixed(0)}°C`, warn: telemetry.jpt1 > 870 },
    { label: 'Ngg', value: `${telemetry.nggPct.toFixed(1)}%`, warn: telemetry.nggPct > 100 },
    { label: 'P2/P1', value: telemetry.p2p1.toFixed(2), warn: telemetry.p2p1 < 3.5 },
    { label: 'Fuel', value: `${telemetry.fuelMassFlow.toFixed(1)} kg/hr`, warn: false },
    { label: 'Vibration', value: `${vibration.toFixed(2)} mm/s`, warn: vibration > 7.5 },
    { label: 'Thermal Life', value: `${(thermalLifeConsumed * 100).toFixed(1)}%`, warn: thermalLifeConsumed > 0.6 },
    { label: 'Data Quality', value: `${(dataQuality * 100).toFixed(0)}%`, warn: dataQuality < 0.8 },
    { label: 'Phase', value: telemetry.startPhase.replace('-', ' '), warn: false },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
      {items.map(item => (
        <div key={item.label} className="bg-gray-900 border border-gray-800 rounded px-3 py-2">
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className={`text-sm font-mono font-semibold mt-0.5 ${item.warn ? 'text-amber-400' : 'text-white'}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Progress timeline ────────────────────────────────────────────────────────

function SimTimeline() {
  const { extSim } = useGTSUStore();
  const total = extSim.trace.length;
  const pct   = total > 0 ? (extSim.elapsedSec / (total - 1)) * 100 : 0;

  // Phase markers
  const phases = [
    { label: 'Crank', t: 0 },
    { label: 'Light-up', t: Math.floor(total * 0.12) },
    { label: 'Accel', t: Math.floor(total * 0.28) },
    { label: 'Self-sust', t: Math.floor(total * 0.55) },
    { label: 'Shutdown', t: Math.floor(total * 0.88) },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>T+0s</span>
        <span>Elapsed: <span className="text-white font-mono">{extSim.elapsedSec}s</span></span>
        <span>T+{total - 1}s</span>
      </div>
      <div className="relative h-2 bg-gray-800 rounded overflow-hidden mb-3">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 rounded"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="relative h-4">
        {phases.map(p => {
          const leftPct = (p.t / Math.max(total - 1, 1)) * 100;
          return (
            <div key={p.label} className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${leftPct}%` }}>
              <div className="w-0.5 h-2 bg-gray-600" />
              <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">{p.label}</span>
            </div>
          );
        })}
        {/* Current position indicator */}
        <div
          className="absolute top-0 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full transition-all duration-300"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Scenario selector ────────────────────────────────────────────────────────

const SCENARIOS = Object.keys(SCENARIO_LABELS) as ExtendedScenario[];

function ScenarioSelector() {
  const { extSim, setExtScenario, setExtSeverity, setExtSpeed } = useGTSUStore();
  const SEVERITIES: SeverityLevel[] = ['low', 'medium', 'high'];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Scenario Configuration</h3>

      {/* Scenarios */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Failure Scenario</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCENARIOS.map(sc => {
            const risk = SCENARIO_RISK[sc];
            const riskColor = risk === 'critical' ? 'border-red-900/50 text-red-200'
              : risk === 'high' ? 'border-orange-900/50 text-orange-200'
              : risk === 'medium' ? 'border-amber-900/50 text-amber-200'
              : 'border-slate-700/50 text-slate-400';
            const active = extSim.scenario === sc;
            return (
              <button key={sc} onClick={() => setExtScenario(sc)}
                className={`text-left rounded-lg border p-3 transition-all ${active
                  ? 'bg-blue-900/30 border-blue-600 text-white'
                  : `bg-gray-800/40 hover:bg-gray-800 border-gray-700/60 text-gray-300`}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold">{SCENARIO_LABELS[sc]}</span>
                  <span className={`text-xs ${active ? 'text-blue-300' : riskColor}`}>{risk}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{SCENARIO_DESCRIPTIONS[sc]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity + Speed */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Severity</p>
          <div className="flex gap-2">
            {SEVERITIES.map(sev => (
              <button key={sev} onClick={() => setExtSeverity(sev)}
                className={`flex-1 text-xs py-2 rounded border capitalize transition-colors ${extSim.severity === sev
                  ? 'bg-slate-800/60 border-slate-600 text-slate-200'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'}`}>
                {sev}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Replay Speed</p>
          <div className="flex gap-2">
            {([1, 2, 5] as const).map(spd => (
              <button key={spd} onClick={() => setExtSpeed(spd)}
                className={`flex-1 text-xs py-2 rounded border transition-colors ${extSim.speedMultiplier === spd
                  ? 'bg-slate-800/60 border-slate-600 text-slate-200'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'}`}>
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fault injection panel ───────────────────────────────────────────────────

const INJECTABLE = [
  { type: 'HOT_START',  label: 'Hot Start',    sev: 'critical' },
  { type: 'HUNG_START', label: 'Hung Start',   sev: 'warning' },
  { type: 'SECU_FAULT', label: 'SECU Fault',   sev: 'critical' },
  { type: 'VIBRATION',  label: 'Vibration',    sev: 'warning' },
];

function FaultInjectionPanel() {
  const { injectFault, clearFaults, activeFaults } = useGTSUStore();
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Siren size={14} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Fault Injection</h3>
        <span className="ml-auto text-xs text-gray-500">{activeFaults.length} active</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {INJECTABLE.map(f => (
          <button key={f.type} onClick={() => injectFault(f.type)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${f.sev === 'critical'
              ? 'bg-red-900/20 hover:bg-red-900/40 border-red-800/50 text-red-300'
              : 'bg-amber-900/20 hover:bg-amber-900/40 border-amber-800/50 text-amber-300'}`}>
            Inject {f.label}
          </button>
        ))}
      </div>
      <button onClick={clearFaults} className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-700/50 px-3 py-1.5 rounded transition-colors">
        Clear All Faults
      </button>
    </div>
  );
}

// ─── Active fault list ────────────────────────────────────────────────────────

function ActiveFaultList() {
  const { activeFaults } = useGTSUStore();
  if (activeFaults.length === 0) return null;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Active Faults</h3>
      </div>
      <div className="space-y-2">
        {activeFaults.map(f => (
          <div key={f.id} className={`text-xs flex items-center gap-3 px-3 py-2 rounded ${f.severity === 'critical' ? 'bg-red-900/20 border border-red-800/40' : 'bg-amber-900/20 border border-amber-800/40'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${f.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
            <span className="text-white font-medium">{f.title}</span>
            <span className="text-gray-400">{f.affectedComponent}</span>
            <span className={`ml-auto font-bold ${f.operationalCall === 'no-go' ? 'text-red-400' : f.operationalCall === 'watch' ? 'text-amber-400' : 'text-green-400'}`}>
              {f.operationalCall.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ScenarioSimulatorPage() {
  const {
    extSim, startExtSim, stopExtSim, resetExtSim, tickExtSim, activeFaults,
  } = useGTSUStore();

  // Auto-tick
  useEffect(() => {
    if (!extSim.isRunning) return;
    const ms = 1000 / extSim.speedMultiplier;
    const id = setInterval(tickExtSim, ms);
    return () => clearInterval(id);
  }, [extSim.isRunning, extSim.speedMultiplier, tickExtSim]);

  const opCall = activeFaults.length === 0 ? 'GO'
    : activeFaults.some(f => f.operationalCall === 'no-go') ? 'NO-GO'
    : activeFaults.some(f => f.operationalCall === 'watch') ? 'WATCH' : 'GO';
  const callColor = opCall === 'GO' ? 'text-slate-200 bg-slate-800/60 border-slate-600/50'
    : opCall === 'WATCH' ? 'text-amber-200 bg-amber-950/40 border-amber-800/50'
    : 'text-rose-200 bg-red-950/40 border-red-800/50';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Scenario Simulator</h1>
          <p className="text-sm text-gray-400 mt-0.5">10 fault scenarios · 3 severity levels · Physics-driven telemetry replay</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-4 py-1.5 rounded border ${callColor}`}>{opCall}</span>
          <div className="flex items-center gap-2">
            {extSim.isRunning ? (
              <button onClick={stopExtSim}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded transition-colors">
                <Pause size={14} />Pause
              </button>
            ) : (
              <button onClick={() => startExtSim(extSim.scenario, extSim.severity)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors">
                <Play size={14} />Play
              </button>
            )}
            <button onClick={tickExtSim} disabled={extSim.isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm rounded transition-colors">
              <SkipForward size={14} />Step
            </button>
            <button onClick={resetExtSim}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors">
              <RotateCcw size={14} />Reset
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <SimTimeline />

      {/* Live telemetry strip */}
      <TelemetryStrip />

      {/* Main 3 col grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ScenarioSelector />
        </div>
        <div className="space-y-5">
          <FaultInjectionPanel />
          <ActiveFaultList />
        </div>
      </div>

      {/* Scenario description */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Scenario</p>
        <p className="text-sm font-semibold text-white">{SCENARIO_LABELS[extSim.scenario]}</p>
        <p className="text-xs text-gray-400 mt-1">{SCENARIO_DESCRIPTIONS[extSim.scenario]}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>Severity: <span className="text-white">{extSim.severity}</span></span>
          <span>Speed: <span className="text-white">{extSim.speedMultiplier}×</span></span>
          <span>Frames: <span className="text-white">{extSim.trace.length}</span></span>
          <span>Elapsed: <span className="text-white">{extSim.elapsedSec}s</span></span>
        </div>
      </div>
    </div>
  );
}
