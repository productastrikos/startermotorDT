import React, { useState } from 'react';
import { useGTSUStore } from '../store/useGTSUStore';
import { Wrench, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronUp, User, Package } from 'lucide-react';
import type { MaintenanceAction } from '../types/engine';

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'urgent' ? 'bg-red-950/50 border-red-800/50 text-red-200'
    : priority === 'high' ? 'bg-orange-950/50 border-orange-800/50 text-orange-200'
    : priority === 'medium' ? 'bg-amber-950/50 border-amber-800/50 text-amber-200'
    : 'bg-slate-800/50 border-slate-700/50 text-slate-300';
  return <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${cls}`}>{priority}</span>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'open' ? 'text-gray-400 border-gray-700'
    : status === 'acknowledged' ? 'text-amber-200 border-amber-800/50'
    : status === 'in-progress' ? 'text-blue-200 border-blue-800/50'
    : 'text-slate-300 border-slate-700/50';
  return <span className={`text-xs font-medium uppercase px-2 py-0.5 rounded border ${cls}`}>{status.replace('-', ' ')}</span>;
}

// ─── Maintenance Card ─────────────────────────────────────────────────────────

function MaintenanceCard({ action }: { action: MaintenanceAction }) {
  const [expanded, setExpanded] = useState(false);
  const { updateMaintenanceStatus } = useGTSUStore();

  const nextStatuses: MaintenanceAction['status'][] = (() => {
    if (action.status === 'open') return ['acknowledged', 'in-progress'];
    if (action.status === 'acknowledged') return ['in-progress'];
    if (action.status === 'in-progress') return ['closed'];
    return [];
  })();

  const borderColor = action.priority === 'urgent' ? 'border-l-red-500'
    : action.priority === 'high' ? 'border-l-orange-500'
    : action.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500';

  return (
    <div className={`bg-gray-900 border border-gray-800 border-l-4 ${borderColor} rounded-lg overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Wrench size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PriorityBadge priority={action.priority} />
              <StatusBadge status={action.status} />
            </div>
            <h3 className="text-sm font-semibold text-white mt-1">{action.action}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{action.component} — {action.reason}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">{action.estimatedDowntime}</p>
            </div>
            <button onClick={() => setExpanded(v => !v)} className="text-gray-500 hover:text-gray-300">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 ml-7">
            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={12} />
                <span>Downtime: <span className="text-white">{action.estimatedDowntime}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <User size={12} />
                <span>Trade: <span className="text-white">{action.tradeRequired}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Package size={12} />
                <span>Created: <span className="text-white">{action.createdAt.toLocaleDateString()}</span></span>
              </div>
            </div>

            {/* Evidence */}
            {action.evidence.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Triggering Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {action.evidence.map((e, i) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Inspection checklist */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Inspection Checklist</p>
              <div className="space-y-1.5">
                {action.inspectionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-4 h-4 border border-gray-700 rounded mt-0.5 shrink-0 flex items-center justify-center">
                      {action.status === 'closed' && <CheckCircle size={10} className="text-green-400" />}
                    </div>
                    <span className={`${action.status === 'closed' ? 'line-through text-gray-600' : 'text-gray-300'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status workflow */}
            {nextStatuses.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {nextStatuses.map(ns => (
                  <button key={ns} onClick={() => updateMaintenanceStatus(action.id, ns)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded transition-colors">
                    → {ns.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'] as const;

export default function MaintenancePage() {
  const { maintenanceActions, activeFaults } = useGTSUStore();
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');

  const sorted = [...maintenanceActions].sort((a, b) =>
    PRIORITY_ORDER.indexOf(a.priority as typeof PRIORITY_ORDER[number]) -
    PRIORITY_ORDER.indexOf(b.priority as typeof PRIORITY_ORDER[number])
  );
  const filtered = sorted.filter(a => filter === 'all' || a.status === filter || (filter === 'open' && (a.status === 'open' || a.status === 'acknowledged')));

  const urgent = maintenanceActions.filter(a => a.priority === 'urgent' && a.status !== 'closed').length;
  const open   = maintenanceActions.filter(a => a.status === 'open' || a.status === 'acknowledged').length;
  const inProg = maintenanceActions.filter(a => a.status === 'in-progress').length;
  const closed = maintenanceActions.filter(a => a.status === 'closed').length;

  const totalDowntime = maintenanceActions
    .filter(a => a.status !== 'closed')
    .reduce((acc, a) => {
      const match = a.estimatedDowntime.match(/(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Maintenance Actions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generated from fault detection · Inspection checklists · Status workflow</p>
        </div>
        {urgent > 0 && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-red-300">{urgent} Urgent Action{urgent > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: maintenanceActions.length, color: 'text-white' },
          { label: 'Urgent', value: urgent, color: 'text-rose-300' },
          { label: 'Open / Acked', value: open, color: 'text-amber-200' },
          { label: 'In Progress', value: inProg, color: 'text-blue-300' },
          { label: 'Est. Downtime', value: `${totalDowntime}h`, color: 'text-gray-300' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* No actions state */}
      {maintenanceActions.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium">No maintenance actions</p>
          <p className="text-gray-500 text-sm mt-1">
            {activeFaults.length === 0
              ? 'Run a fault scenario on the Scenario Simulator to generate maintenance actions.'
              : `${activeFaults.length} fault(s) detected but no maintenance actions generated yet.`}
          </p>
        </div>
      )}

      {maintenanceActions.length > 0 && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg w-fit">
            {(['all', 'open', 'in-progress', 'closed'] as const).map(tab => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${filter === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Action cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm">No actions in this category.</p>
            ) : (
              filtered.map(a => <MaintenanceCard key={a.id} action={a} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
