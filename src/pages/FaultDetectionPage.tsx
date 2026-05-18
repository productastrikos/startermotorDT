import React, { useState } from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { AlertTriangle, CheckCircle, Eye, RotateCcw, Trash2, Siren, ChevronDown, ChevronUp } from 'lucide-react';
import type { FaultEvent } from '../lib/faultDetectionEngine';

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ sev }: { sev: string }) {
  const cls = sev === 'critical' ? 'bg-red-950/60 border-red-800/50 text-red-200'
    : sev === 'warning' ? 'bg-amber-950/60 border-amber-800/50 text-amber-200'
    : 'bg-slate-800/60 border-slate-700/50 text-slate-300';
  return <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${cls}`}>{sev}</span>;
}

// ─── Operational Call Badge ───────────────────────────────────────────────────

function OpCallBadge({ call }: { call: string }) {
  const cls = call === 'no-go' ? 'bg-red-950/60 border-red-800/50 text-red-200'
    : call === 'watch' ? 'bg-amber-950/60 border-amber-800/50 text-amber-200'
    : 'bg-slate-800/60 border-slate-700/50 text-slate-300';
  return <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${cls}`}>{call}</span>;
}

// ─── Fault Card ───────────────────────────────────────────────────────────────

function FaultCard({ fault }: { fault: FaultEvent }) {
  const [expanded, setExpanded] = useState(false);
  const { acknowledgeFault, resolveFault, focusFault, focusComponent } = useGTSUStore();
  const statusColor = fault.status === 'active' ? 'border-l-red-500'
    : fault.status === 'acknowledged' ? 'border-l-amber-500'
    : 'border-l-green-500';

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden border-l-4 ${statusColor}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className={fault.severity === 'critical' ? 'text-red-400 mt-0.5 shrink-0' : 'text-amber-400 mt-0.5 shrink-0'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-white">{fault.title}</h3>
              <SeverityBadge sev={fault.severity} />
              <OpCallBadge call={fault.operationalCall} />
            </div>
            <p className="text-xs text-gray-400">{fault.affectedComponent}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-500">{(fault.confidence * 100).toFixed(0)}% conf.</span>
            <button onClick={() => setExpanded(v => !v)} className="text-gray-500 hover:text-gray-300 ml-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            {/* Root cause */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Root Cause</p>
              <p className="text-xs text-gray-300">{fault.rootCause}</p>
            </div>

            {/* Evidence matrix */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Evidence Matrix</p>
              <div className="grid grid-cols-2 gap-1">
                {fault.evidence.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-gray-800 rounded px-2 py-1.5">
                    <CheckCircle size={11} className="text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300">{e}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-blue-300">{fault.recommendation}</p>
            </div>

            {/* Operational impact */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Operational Impact</p>
              <p className="text-xs text-gray-300">{fault.operationalImpact}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => { focusFault(fault.id); focusComponent(fault.linkedComponentId ?? null); }}
                className="flex items-center gap-1.5 text-xs bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/50 text-blue-300 px-3 py-1.5 rounded transition-colors">
                <Eye size={12} />Focus Component
              </button>
              {fault.status === 'active' && (
                <button onClick={() => acknowledgeFault(fault.id)}
                  className="flex items-center gap-1.5 text-xs bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/50 text-amber-300 px-3 py-1.5 rounded transition-colors">
                  <CheckCircle size={12} />Acknowledge
                </button>
              )}
              {fault.status !== 'resolved' && (
                <button onClick={() => resolveFault(fault.id)}
                  className="flex items-center gap-1.5 text-xs bg-green-900/30 hover:bg-green-900/50 border border-green-800/50 text-green-300 px-3 py-1.5 rounded transition-colors">
                  <RotateCcw size={12} />Resolve
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const INJECTABLE_FAULTS = [
  { type: 'HOT_START',  label: 'Hot Start' },
  { type: 'HUNG_START', label: 'Hung Start' },
  { type: 'SECU_FAULT', label: 'SECU Fault' },
  { type: 'VIBRATION',  label: 'Vibration' },
];

export default function FaultDetectionPage() {
  const { activeFaults, clearFaults, injectFault } = useGTSUStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  const filtered = activeFaults.filter(f => filter === 'all' || f.status === filter);

  const counts = {
    critical: activeFaults.filter(f => f.severity === 'critical').length,
    warning:  activeFaults.filter(f => f.severity === 'warning').length,
    info:     activeFaults.filter(f => f.severity === 'info').length,
  };

  const overallCall = activeFaults.length === 0 ? 'GO'
    : activeFaults.some(f => f.operationalCall === 'no-go') ? 'NO-GO'
    : activeFaults.some(f => f.operationalCall === 'watch') ? 'WATCH' : 'GO';
  const callColor = overallCall === 'GO' ? 'text-slate-200 bg-slate-800/60 border-slate-600/50'
    : overallCall === 'WATCH' ? 'text-amber-200 bg-amber-950/40 border-amber-800/50'
    : 'text-rose-200 bg-red-950/40 border-red-800/50';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Fault Detection & Isolation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Rule-based + model-based FDI engine · GTSU-110</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-4 py-1.5 rounded border ${callColor}`}>{overallCall}</span>
          <button onClick={clearFaults} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-300 border border-gray-700 hover:border-red-700/50 px-3 py-1.5 rounded transition-colors">
            <Trash2 size={12} />Clear All
          </button>
        </div>
      </div>

      {/* Fault summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Faults',  value: activeFaults.length,  color: 'text-white' },
          { label: 'Critical',      value: counts.critical,       color: 'text-rose-300' },
          { label: 'Warning',       value: counts.warning,        color: 'text-amber-200' },
          { label: 'Info',          value: counts.info,           color: 'text-slate-300' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Fault injection (for testing) */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Siren size={14} className="text-amber-400" />
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Fault Injection (Test)</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {INJECTABLE_FAULTS.map(f => (
            <button key={f.type} onClick={() => injectFault(f.type)}
              className="text-xs bg-gray-800 hover:bg-amber-900/30 border border-gray-700 hover:border-amber-700/50 text-gray-300 hover:text-amber-300 px-3 py-1.5 rounded transition-colors">
              Inject: {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg w-fit">
        {(['all', 'active', 'acknowledged', 'resolved'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${filter === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Fault cards */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium">No faults detected</p>
          <p className="text-gray-500 text-sm mt-1">
            {activeFaults.length === 0 ? 'Run a simulation scenario to generate fault data, or use Fault Injection above.' : `All ${activeFaults.length} fault(s) are in another status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => <FaultCard key={f.id} fault={f} />)}
        </div>
      )}
    </div>
  );
}
