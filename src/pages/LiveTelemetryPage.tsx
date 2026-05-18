import React, { useEffect, useRef } from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { Activity, Radio, AlertTriangle, CheckCircle, Cpu } from 'lucide-react';

// ─── Tiny canvas line chart ───────────────────────────────────────────────────

interface MiniChartProps {
  data: number[];
  baseline?: number[];
  color: string;
  baselineColor?: string;
  label: string;
  unit: string;
  height?: number;
  warnThreshold?: number;
  criticalThreshold?: number;
}

function MiniChart({ data, baseline, color, baselineColor = '#70809060', label, unit, height = 100, warnThreshold, criticalThreshold }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#ffffff0e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const allVals = [...data, ...(baseline ?? [])].filter(v => isFinite(v));
    if (allVals.length < 2) return;
    const min = Math.min(...allVals) * 0.97;
    const max = Math.max(...allVals) * 1.03;
    const range = max - min || 1;

    const toX = (i: number, len: number) => (i / Math.max(len - 1, 1)) * W;
    const toY = (v: number) => H - ((v - min) / range) * H;

    // Warn/critical threshold lines
    if (warnThreshold !== undefined && warnThreshold > min && warnThreshold < max) {
      ctx.strokeStyle = '#b0850a80';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const ty = toY(warnThreshold);
      ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (criticalThreshold !== undefined && criticalThreshold > min && criticalThreshold < max) {
      ctx.strokeStyle = '#b0404060';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const cy = toY(criticalThreshold);
      ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Baseline
    if (baseline && baseline.length >= 2) {
      ctx.strokeStyle = baselineColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      baseline.forEach((v, i) => {
        const x = toX(i, baseline.length);
        const y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Actual fill
    if (data.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, color + '44');
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(toX(0, data.length), H);
      data.forEach((v, i) => ctx.lineTo(toX(i, data.length), toY(v)));
      ctx.lineTo(toX(data.length - 1, data.length), H);
      ctx.closePath();
      ctx.fill();

      // Line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = toX(i, data.length);
        const y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [data, baseline, color, baselineColor, warnThreshold, criticalThreshold]);

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const trend  = data.length >= 2 ? (latest > prev ? '↑' : latest < prev ? '↓' : '→') : '—';
  const isWarn = warnThreshold !== undefined && latest >= warnThreshold;
  const isCrit = criticalThreshold !== undefined && latest >= criticalThreshold;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-lg font-mono font-bold ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-white'}`}>
          {isFinite(latest) ? latest.toFixed(1) : '—'} <span className="text-xs text-gray-500 font-normal">{unit}</span>
          <span className="ml-1 text-sm text-gray-500">{trend}</span>
        </span>
      </div>
      <canvas ref={canvasRef} width={360} height={height} className="w-full rounded" style={{ height }} />
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="inline-block w-4 h-0.5" style={{ background: color }} />Actual
        </span>
        {baseline && baseline.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="inline-block w-4" style={{ borderTop: `1.5px dashed ${baselineColor}` }} />Expected
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Residual Bar ────────────────────────────────────────────────────────────

function ResidualBar({ label, value, sigma }: { label: string; value: number; sigma: number }) {
  const clamped = Math.max(-3, Math.min(3, value / Math.max(sigma, 0.01)));
  const pct = ((clamped + 3) / 6) * 100;
  const color = Math.abs(clamped) > 2 ? '#c04040' : Math.abs(clamped) > 1.5 ? '#c08010' : '#4a8a60';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-mono" style={{ color }}>{value > 0 ? '+' : ''}{value.toFixed(2)} ({clamped.toFixed(1)}σ)</span>
      </div>
      <div className="relative h-2 bg-gray-800 rounded overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-600" />
        <div
          className="absolute top-0 h-full rounded transition-all duration-300"
          style={{
            width: `${Math.abs(clamped / 3) * 50}%`,
            left: clamped >= 0 ? '50%' : `${50 - Math.abs(clamped / 3) * 50}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LiveTelemetryPage() {
  const {
    telemetry, physicsBaseline, residuals, extSim,
    telemetryHistory, dataQuality, vibration,
    startExtSim, tickExtSim, stopExtSim,
  } = useGTSUStore();

  // Auto-tick when running
  useEffect(() => {
    if (!extSim.isRunning) return;
    const ms = 1000 / extSim.speedMultiplier;
    const id = setInterval(tickExtSim, ms);
    return () => clearInterval(id);
  }, [extSim.isRunning, extSim.speedMultiplier, tickExtSim]);

  const hist = telemetryHistory;
  const jpt1Data    = hist.map(h => h.jpt1);
  const nggData     = hist.map(h => h.nggPct);
  const p2p1Data    = hist.map(h => h.p2p1);
  const fuelData    = hist.map(h => h.fuelFlow);
  const vibData     = hist.map(h => h.vibration);

  // Expected baseline arrays (use current scalar if history sparse)
  const jpt1Exp  = hist.map(() => physicsBaseline.expectedJpt1);
  const nggExp   = hist.map(() => physicsBaseline.expectedNggPct);
  const p2p1Exp  = hist.map(() => physicsBaseline.expectedP2p1);

  const dqColor = dataQuality > 0.9 ? 'text-green-400' : dataQuality > 0.7 ? 'text-amber-400' : 'text-red-400';
  const phaseColors: Record<string, string> = {
    'cranking': 'bg-slate-700/40 text-slate-300',
    'light-up': 'bg-stone-700/40 text-amber-200',
    'acceleration': 'bg-slate-700/40 text-slate-300',
    'self-sustaining': 'bg-slate-700/40 text-slate-200',
    'shutdown': 'bg-gray-800/60 text-gray-400',
  };
  const phaseClass = phaseColors[telemetry.startPhase] ?? 'bg-gray-700 text-gray-300';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Live Telemetry</h1>
          <p className="text-sm text-gray-400 mt-0.5">Actual vs. physics-based expected values · Residual analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${phaseClass}`}>
            {telemetry.startPhase.replace('-', ' ').toUpperCase()}
          </span>
          <span className={`text-xs font-medium ${dqColor}`}>
            DQ {(dataQuality * 100).toFixed(0)}%
          </span>
          {extSim.isRunning ? (
            <button
              onClick={stopExtSim}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
            >Stop</button>
          ) : (
            <button
              onClick={() => startExtSim(extSim.scenario, extSim.severity)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Activity size={14} />Live Replay
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: 'JPT1', value: telemetry.jpt1, exp: physicsBaseline.expectedJpt1, unit: '°C', warn: 870, crit: 900 },
          { label: 'Ngg', value: telemetry.nggPct, exp: physicsBaseline.expectedNggPct, unit: '%', warn: 100, crit: 103 },
          { label: 'P2/P1', value: telemetry.p2p1, exp: physicsBaseline.expectedP2p1, unit: '', warn: undefined, crit: undefined },
          { label: 'Fuel Flow', value: telemetry.fuelMassFlow, exp: undefined, unit: 'kg/hr' },
          { label: 'Vibration', value: vibration, exp: undefined, unit: 'mm/s', warn: 7.5, crit: 11 },
          { label: 'Start T', value: telemetry.startDuration ?? 0, exp: undefined, unit: 's' },
        ].map(kpi => {
          const delta = kpi.exp !== undefined ? kpi.value - kpi.exp : undefined;
          const isWarn = kpi.warn !== undefined && kpi.value >= kpi.warn;
          const isCrit = kpi.crit !== undefined && kpi.value >= kpi.crit;
          return (
            <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-mono font-bold mt-1 ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-white'}`}>
                {kpi.value.toFixed(1)}<span className="text-xs text-gray-500 ml-1 font-normal">{kpi.unit}</span>
              </p>
              {delta !== undefined && (
                <p className={`text-xs mt-0.5 font-mono ${Math.abs(delta) > 5 ? 'text-amber-400' : 'text-gray-500'}`}>
                  Δ{delta > 0 ? '+' : ''}{delta.toFixed(1)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniChart label="JPT1 — Jet Pipe Temperature" unit="°C" data={jpt1Data} baseline={jpt1Exp}
          color="#b85450" height={110} warnThreshold={870} criticalThreshold={900} />
        <MiniChart label="Ngg — Gas Generator Speed" unit="%" data={nggData} baseline={nggExp}
          color="#4a7eb5" height={110} />
        <MiniChart label="P2/P1 — Compressor Pressure Ratio" unit="" data={p2p1Data} baseline={p2p1Exp}
          color="#6a6aaa" height={110} />
        <MiniChart label="Fuel Mass Flow" unit="kg/hr" data={fuelData}
          color="#4a8a6a" height={110} />
        <MiniChart label="Vibration" unit="mm/s" data={vibData}
          color="#9c7840" height={110} warnThreshold={7.5} criticalThreshold={11} />
      </div>

      {/* Residual Analytics */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Model Residual Analysis</h3>
          <span className="ml-auto text-xs text-gray-500">±σ band normalised to physics model noise floor</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {residuals.map(r => (
            <ResidualBar key={r.channel} label={r.channel} value={r.residual} sigma={r.sigma} />
          ))}
          {residuals.length === 0 && (
            <p className="text-sm text-gray-600 col-span-2">Start a simulation to generate residuals.</p>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'SECU Main', ok: telemetry.secuMainHealthy, icon: <Cpu size={14} /> },
          { label: 'BIT Pass', ok: telemetry.bitPass, icon: <CheckCircle size={14} /> },
          { label: 'MIL-1553', ok: telemetry.milBusHealthy, icon: <Radio size={14} /> },
          { label: 'Data Quality', ok: dataQuality > 0.8, icon: <Activity size={14} /> },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${s.ok ? 'border-green-800/50 bg-green-900/10' : 'border-red-800/50 bg-red-900/10'}`}>
            <span className={s.ok ? 'text-green-400' : 'text-red-400'}>{s.icon}</span>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-sm font-medium ${s.ok ? 'text-green-300' : 'text-red-300'}`}>{s.ok ? 'NOMINAL' : 'FAULT'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
