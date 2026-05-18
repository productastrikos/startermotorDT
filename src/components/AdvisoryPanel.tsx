import React from 'react';
import { Advisory } from '../services/socket';

const PRIORITY_META: Record<string, { border: string; bg: string; badge: string; dot: string; label: string; icon: string }> = {
  critical:   { border:'border-red-500/40',    bg:'bg-red-500/5',    badge:'bg-red-500/20 text-red-400',      dot:'bg-red-500',    label:'CRITICAL',   icon:'🔴' },
  high:       { border:'border-orange-500/40', bg:'bg-orange-500/5', badge:'bg-orange-500/20 text-orange-400', dot:'bg-orange-500', label:'HIGH',       icon:'🟠' },
  medium:     { border:'border-yellow-500/35', bg:'bg-yellow-500/5', badge:'bg-yellow-500/20 text-yellow-400', dot:'bg-yellow-500', label:'MEDIUM',     icon:'🟡' },
  info:       { border:'border-blue-500/30',   bg:'bg-blue-500/4',   badge:'bg-blue-500/15 text-blue-400',     dot:'bg-blue-400',   label:'INFO',       icon:'🔵' },
  low:        { border:'border-blue-500/30',   bg:'bg-blue-500/4',   badge:'bg-blue-500/15 text-blue-400',     dot:'bg-blue-400',   label:'LOW',        icon:'🔵' },
  optimization:{ border:'border-purple-500/50', bg:'bg-purple-500/6', badge:'bg-purple-500/20 text-purple-300', dot:'bg-purple-400', label:'OPTIMISE',   icon:'🔮' },
  prediction: { border:'border-purple-500/50', bg:'bg-purple-500/6', badge:'bg-purple-500/20 text-purple-300', dot:'bg-purple-400', label:'PREDICTIVE', icon:'🔮' },
};

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface AdvisoryPanelProps {
  advisories?: Advisory[];
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
}

export default function AdvisoryPanel({ advisories = [], onClose, onAcknowledge }: AdvisoryPanelProps) {
  const active = advisories.filter(a => !a.acknowledged);

  return (
    <div className="h-full flex flex-col cwm-advisory-panel" style={{ minWidth: '320px' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--cwm-advisory-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cwm-text)' }}>AI Engine Advisory</h3>
            <p className="text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{active.length} active recommendations</p>
          </div>
        </div>
        <button onClick={onClose} className="icon-btn" aria-label="Close">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {advisories.length === 0 && (
          <div className="text-center text-sm py-8" style={{ color: 'var(--cwm-text-muted)' }}>
            No advisories available
          </div>
        )}
        {advisories.map(adv => {
          const meta = PRIORITY_META[adv.type] || PRIORITY_META.info;
          return (
            <div key={adv.id} className={`${meta.bg} border ${meta.border} rounded-xl p-3`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{meta.icon}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--cwm-text-faint)' }}>{timeSince(adv.createdAt)}</span>
              </div>

              <p className="text-[11.5px] font-semibold leading-snug mb-1.5" style={{ color: 'var(--cwm-text)' }}>
                {adv.title}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--cwm-text-muted)' }}>
                {adv.message}
              </p>

              {!adv.acknowledged && onAcknowledge && (
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => onAcknowledge(adv.id)}
                    className="text-[10px] font-semibold px-3 py-1 rounded-lg"
                    style={{ background: 'var(--cwm-advisory-bg)', color: 'var(--cwm-advisory)', border: '1px solid var(--cwm-advisory-border)' }}
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
