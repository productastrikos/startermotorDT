import React from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { Cpu, Activity, Thermometer, Gauge } from 'lucide-react';

// ─── Parameter Row ────────────────────────────────────────────────────────────

interface ParamRow {
  label: string;
  actual: number;
  expected: number;
  unit: string;
  sigma: number;
  residual: number;
}

function ModelRow({ row }: { row: ParamRow }) {
  const z = Math.abs(row.residual / Math.max(row.sigma, 0.01));
  const statusColor = z > 2 ? 'text-rose-300' : z > 1.5 ? 'text-amber-200' : 'text-slate-400';
  const barWidth = Math.min(100, (z / 3) * 100);
  const barColor = z > 2 ? '#c04040' : z > 1.5 ? '#c08010' : '#4a7a60';

  return (
    <tr className="border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-300">{row.label}</td>
      <td className="py-3 px-4 text-right font-mono text-sm text-white">{row.actual.toFixed(2)} <span className="text-gray-500 text-xs">{row.unit}</span></td>
      <td className="py-3 px-4 text-right font-mono text-sm text-gray-400">{row.expected.toFixed(2)} <span className="text-gray-500 text-xs">{row.unit}</span></td>
      <td className="py-3 px-4 text-right font-mono text-sm">
        <span className={statusColor}>{row.residual > 0 ? '+' : ''}{row.residual.toFixed(2)}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500" style={{ width: `${barWidth}%`, background: barColor }} />
          </div>
          <span className={`text-xs font-mono w-12 text-right ${statusColor}`}>{z.toFixed(1)}σ</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Model Assumption Card ────────────────────────────────────────────────────

function AssumptionCard({ icon, title, value, desc }: { icon: React.ReactNode; title: string; value: string; desc: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-blue-400">{icon}<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span></div>
      <p className="text-lg font-mono font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PhysicsModelPage() {
  const { physicsBaseline, residuals, telemetry, health } = useGTSUStore();

  const rows: ParamRow[] = [
    {
      label: 'JPT1 — Jet Pipe Temperature',
      actual: telemetry.jpt1,
      expected: physicsBaseline.expectedJpt1,
      unit: '°C',
      sigma: residuals.find(r => r.channel.toLowerCase().includes('jpt'))?.sigma ?? 8,
      residual: residuals.find(r => r.channel.toLowerCase().includes('jpt'))?.residual ?? (telemetry.jpt1 - physicsBaseline.expectedJpt1),
    },
    {
      label: 'Ngg — Gas Generator Speed',
      actual: telemetry.nggPct,
      expected: physicsBaseline.expectedNggPct,
      unit: '%',
      sigma: residuals.find(r => r.channel.toLowerCase().includes('ngg'))?.sigma ?? 1.5,
      residual: residuals.find(r => r.channel.toLowerCase().includes('ngg'))?.residual ?? (telemetry.nggPct - physicsBaseline.expectedNggPct),
    },
    {
      label: 'P2/P1 — Compressor Pressure Ratio',
      actual: telemetry.p2p1,
      expected: physicsBaseline.expectedP2p1,
      unit: '',
      sigma: residuals.find(r => r.channel.toLowerCase().includes('p2'))?.sigma ?? 0.05,
      residual: residuals.find(r => r.channel.toLowerCase().includes('p2'))?.residual ?? (telemetry.p2p1 - physicsBaseline.expectedP2p1),
    },
    {
      label: 'Fuel Mass Flow',
      actual: telemetry.fuelMassFlow,
      expected: physicsBaseline.expectedFuelFlow ?? telemetry.fuelMassFlow,
      unit: 'kg/hr',
      sigma: residuals.find(r => r.channel.toLowerCase().includes('fuel'))?.sigma ?? 0.3,
      residual: residuals.find(r => r.channel.toLowerCase().includes('fuel'))?.residual ?? 0,
    },
  ];

  const virtualSensors = [
    { name: 'Compressor Efficiency', value: physicsBaseline.compEfficiency ?? (health.compressorHealth / 100), unit: '%', conf: 0.87 },
    { name: 'Thermal Gradient', value: physicsBaseline.thermalGradient ?? 42.3, unit: '°C/s', conf: 0.82 },
    { name: 'Combustion Efficiency', value: physicsBaseline.combustionEfficiency ?? (health.combustorHealth / 100), unit: '%', conf: 0.79 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Physics Model</h1>
        <p className="text-sm text-gray-400 mt-0.5">ISA-corrected baseline · Virtual sensor estimation · Residual bands</p>
      </div>

      {/* Model Assumptions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AssumptionCard icon={<Thermometer size={14} />} title="Baseline OAT" value="ISA +15°C" desc="Standard atmosphere reference" />
        <AssumptionCard icon={<Gauge size={14} />} title="Max Ngg" value="22,000 RPM" desc="Gas generator design speed" />
        <AssumptionCard icon={<Activity size={14} />} title="Design P2/P1" value="3.86" desc="Nominal compressor pressure ratio" />
        <AssumptionCard icon={<Cpu size={14} />} title="Light-Up Ngg" value="12,625 RPM" desc="Self-sustaining threshold" />
      </div>

      {/* Actual vs Expected Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Parameter Comparison — Actual vs. Model Expected</h2>
          <p className="text-xs text-gray-500 mt-0.5">Residual normalised to physics model noise floor (σ). |residual| &gt; 2σ indicates anomaly.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/40 text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-2 px-4 text-left">Parameter</th>
                <th className="py-2 px-4 text-right">Actual</th>
                <th className="py-2 px-4 text-right">Expected</th>
                <th className="py-2 px-4 text-right">Residual</th>
                <th className="py-2 px-4 text-left">σ-Band</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => <ModelRow key={r.label} row={r} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Physics Model Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model equations card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Model Equations</h3>
          <div className="space-y-3 text-xs text-gray-400 font-mono">
            <div className="bg-gray-800/50 rounded p-3 space-y-1.5">
              <p className="text-gray-300 font-sans font-medium text-xs">JPT1 Model (phase-dependent)</p>
              <p>JPT1_exp = f(phase, Ngg%)</p>
              <p className="text-gray-500">+ ΔT_OAT × 0.4 per °C above ISA</p>
              <p className="text-gray-500">light-up: 35 + 5.8 × Ngg%</p>
              <p className="text-gray-500">accel:    200 + 7.2 × Ngg%</p>
              <p className="text-gray-500">self-sust: 300 + 6.5 × Ngg%</p>
            </div>
            <div className="bg-gray-800/50 rounded p-3 space-y-1.5">
              <p className="text-gray-300 font-sans font-medium text-xs">Compressor Map (quadratic)</p>
              <p>P2/P1 = a·Ngg² + b·Ngg + c</p>
              <p className="text-gray-500">a = 0.002, b = 0.038, c = 1.2</p>
              <p className="text-gray-500">design point: Ngg=77%, P2/P1=3.86</p>
            </div>
            <div className="bg-gray-800/50 rounded p-3 space-y-1.5">
              <p className="text-gray-300 font-sans font-medium text-xs">Residual Normalization</p>
              <p>z = (actual − expected) / σ_noise</p>
              <p className="text-gray-500">σ_JPT1 = 8°C, σ_Ngg = 1.5%</p>
              <p className="text-gray-500">σ_P2P1 = 0.05, σ_fuel = 0.3 kg/hr</p>
            </div>
          </div>
        </div>

        {/* Virtual Sensors */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Virtual Sensor Estimates</h3>
          <p className="text-xs text-gray-500 mb-4">Parameters inferred from physics model — not directly measured</p>
          <div className="space-y-4">
            {virtualSensors.map(vs => (
              <div key={vs.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{vs.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono font-bold">
                      {(vs.value * (vs.unit === '%' ? 100 : 1)).toFixed(1)} {vs.unit}
                    </span>
                    <span className="text-gray-500">conf. {(vs.conf * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${vs.unit === '%' ? vs.value * 100 : Math.min(100, vs.value / 100 * 100)}%`,
                  background: vs.value > 0.8 ? '#4a8a6a' : vs.value > 0.6 ? '#c08010' : '#c04040',
                    }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <div className="h-1 bg-gray-700 rounded" style={{ width: `${vs.conf * 100}%`, background: '#3b82f660' }} />
                  <span className="text-xs text-gray-600 ml-1">confidence band</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All residuals */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Full Residual Channel Listing</h3>
        {residuals.length === 0 ? (
          <p className="text-sm text-gray-600">Run a simulation to generate residual data.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {residuals.map(r => {
              const z = Math.abs(r.normalizedResidual);
              const col = z > 2 ? 'text-rose-300' : z > 1.5 ? 'text-amber-300' : 'text-slate-400';
              return (
                <div key={r.channel} className="flex justify-between text-xs py-1.5 border-b border-gray-800/40">
                  <span className="text-gray-400">{r.channel}</span>
                  <div className="flex gap-4 font-mono">
                    <span className="text-gray-300">Δ{r.residual > 0 ? '+' : ''}{r.residual.toFixed(2)}</span>
                    <span className={col}>{r.normalizedResidual.toFixed(2)}σ</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
