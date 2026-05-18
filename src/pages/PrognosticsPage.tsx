import React from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Clock, Wrench } from 'lucide-react';
import type { ComponentRUL } from '../lib/rulEstimator';

// ─── RUL Bar Card ─────────────────────────────────────────────────────────────

function RULCard({ comp }: { comp: ComponentRUL }) {
  const TrendIcon = comp.trend === 'degrading' ? TrendingDown
    : comp.trend === 'improving' ? TrendingUp : Minus;
  const trendColor = comp.trend === 'degrading' ? 'text-rose-300' : comp.trend === 'improving' ? 'text-slate-300' : 'text-gray-500';
  const healthColor = comp.healthScore > 75 ? '#4a8a60' : comp.healthScore > 50 ? '#c08010' : '#c04040';
  const rulPct = Math.min(100, (comp.rulHours / 2000) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{comp.componentName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{comp.lastFaultType ?? 'No recent faults'}</p>
        </div>
        <TrendIcon size={16} className={trendColor} />
      </div>

      {/* Health score */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Health Score</span>
          <span className="font-mono font-bold" style={{ color: healthColor }}>{comp.healthScore.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded overflow-hidden">
          <div className="h-full rounded transition-all duration-700" style={{ width: `${comp.healthScore}%`, background: healthColor }} />
        </div>
      </div>

      {/* RUL */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Remaining Useful Life</span>
          <span className="text-white font-mono">{comp.rulHours.toFixed(0)} hr / {comp.rulCycles} cycles</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
          <div className="h-full rounded transition-all duration-700" style={{ width: `${rulPct}%`, background: '#3b82f6' }} />
        </div>
      </div>

      {/* Failure probabilities */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { label: '10 cycles', value: comp.failureProbNext10 },
          { label: '25 cycles', value: comp.failureProbNext25 },
          { label: '50 cycles', value: comp.failureProbNext50 },
        ].map(fp => {
          const color = fp.value > 0.4 ? 'text-rose-300' : fp.value > 0.15 ? 'text-amber-200' : 'text-slate-400';
          return (
            <div key={fp.label} className="bg-gray-800 rounded p-2">
              <p className={`text-sm font-bold font-mono ${color}`}>{(fp.value * 100).toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-0.5">{fp.label}</p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/60">
        <div className="flex items-center gap-1">
          <Wrench size={11} />
          <span>Next maint. cycle {comp.nextMaintenanceCycle}</span>
        </div>
        <span>Conf. {(comp.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ─── Overall RUL Banner ──────────────────────────────────────────────────────

function OverallBanner() {
  const { rulData } = useGTSUStore();
  const r = rulData;
  const color = r.overallHealth > 75 ? 'border-green-700/40 bg-green-900/10'
    : r.overallHealth > 50 ? 'border-amber-700/40 bg-amber-900/10'
    : 'border-red-700/40 bg-red-900/10';

  return (
    <div className={`border rounded-lg p-5 ${color}`}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-gray-400">Overall Health</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{r.overallHealth.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">System RUL</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{r.overallRulHours.toFixed(0)} hr</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Critical Component</p>
          <p className="text-sm font-semibold text-amber-200 mt-1">{r.criticalComponent ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Next Scheduled</p>
          <p className="text-sm font-semibold text-white mt-1">Cycle {r.nextMaintenanceCycle}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Active Components</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{r.components.length}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Failure Probability Table ───────────────────────────────────────────────

function FailureProbTable() {
  const { rulData } = useGTSUStore();
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">Failure Probability Forecast</h2>
        <p className="text-xs text-gray-500 mt-0.5">Logistic approximation of Weibull CDF — per component</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800/40 text-gray-500 uppercase tracking-wider">
              <th className="py-2 px-4 text-left">Component</th>
              <th className="py-2 px-4 text-right">Health</th>
              <th className="py-2 px-4 text-right">RUL (hr)</th>
              <th className="py-2 px-4 text-right">P(fail 10c)</th>
              <th className="py-2 px-4 text-right">P(fail 25c)</th>
              <th className="py-2 px-4 text-right">P(fail 50c)</th>
              <th className="py-2 px-4 text-left">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rulData.components.map(c => {
              const col10 = c.failureProbNext10 > 0.4 ? 'text-rose-300' : c.failureProbNext10 > 0.15 ? 'text-amber-200' : 'text-slate-400';
              const col25 = c.failureProbNext25 > 0.4 ? 'text-rose-300' : c.failureProbNext25 > 0.15 ? 'text-amber-200' : 'text-slate-400';
              const col50 = c.failureProbNext50 > 0.4 ? 'text-rose-300' : c.failureProbNext50 > 0.15 ? 'text-amber-200' : 'text-slate-400';
              const healthColor = c.healthScore > 75 ? 'text-slate-300' : c.healthScore > 50 ? 'text-amber-200' : 'text-rose-300';
              const TIcon = c.trend === 'degrading' ? TrendingDown : c.trend === 'improving' ? TrendingUp : Minus;
              const tColor = c.trend === 'degrading' ? 'text-rose-300' : c.trend === 'improving' ? 'text-slate-300' : 'text-gray-500';
              return (
                <tr key={c.componentId} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="py-3 px-4 text-gray-300 font-medium">{c.componentName}</td>
                  <td className={`py-3 px-4 text-right font-mono ${healthColor}`}>{c.healthScore.toFixed(0)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-300">{c.rulHours.toFixed(0)}</td>
                  <td className={`py-3 px-4 text-right font-mono ${col10}`}>{(c.failureProbNext10 * 100).toFixed(1)}%</td>
                  <td className={`py-3 px-4 text-right font-mono ${col25}`}>{(c.failureProbNext25 * 100).toFixed(1)}%</td>
                  <td className={`py-3 px-4 text-right font-mono ${col50}`}>{(c.failureProbNext50 * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4"><TIcon size={13} className={tColor} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PrognosticsPage() {
  const { rulData, activeFaults } = useGTSUStore();

  const urgentComponents = rulData.components.filter(c => c.failureProbNext10 > 0.3);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Prognostics & Health Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">RUL estimation · Failure probability forecast · Component degradation</p>
      </div>

      {/* Urgent attention */}
      {urgentComponents.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-900/10 border border-amber-700/40 rounded-lg p-4">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Attention Required</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {urgentComponents.map(c => c.componentName).join(', ')} — failure probability &gt;30% within 10 cycles.
            </p>
          </div>
        </div>
      )}

      {/* Overall banner */}
      <OverallBanner />

      {/* Component health grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Component RUL Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rulData.components.map(c => <RULCard key={c.componentId} comp={c} />)}
        </div>
      </div>

      {/* Failure probability table */}
      <FailureProbTable />

      {/* Active fault impact */}
      {activeFaults.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">Active Fault Impact on RUL</h3>
          </div>
          <div className="space-y-2">
            {activeFaults.map(f => (
              <div key={f.id} className="flex items-start gap-3 text-xs">
                <span className={`font-bold px-1.5 py-0.5 rounded ${f.severity === 'critical' ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/40 text-amber-300'}`}>
                  {f.severity.toUpperCase()}
                </span>
                <div>
                  <span className="text-white font-medium">{f.title}</span>
                  <span className="text-gray-400 ml-2">{f.affectedComponent}</span>
                  <p className="text-gray-500 mt-0.5">{f.operationalImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
