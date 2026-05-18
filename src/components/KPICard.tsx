import { ReactNode } from "react";
import { ThresholdStatus } from "../types/engine";

/* ─── RAG colour maps (CSS-variable aware) ─────────────── */
const RAG: Record<string, {
  iconClr: string;
  dot: string;
  badge: { bg: string; color: string; border: string };
  label: string;
}> = {
  normal: {
    iconClr: 'var(--cwm-success)',
    dot:     'var(--cwm-success)',
    badge:   { bg: 'var(--cwm-success-bg)', color: 'var(--cwm-success)', border: 'var(--cwm-success-border)' },
    label:   'NORMAL',
  },
  warning: {
    iconClr: 'var(--cwm-warning)',
    dot:     'var(--cwm-warning)',
    badge:   { bg: 'var(--cwm-warning-bg)', color: 'var(--cwm-warning)', border: 'var(--cwm-warning-border)' },
    label:   'WARNING',
  },
  critical: {
    iconClr: 'var(--cwm-danger)',
    dot:     'var(--cwm-danger)',
    badge:   { bg: 'var(--cwm-danger-bg)', color: 'var(--cwm-danger)', border: 'var(--cwm-danger-border)' },
    label:   'CRITICAL',
  },
};

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: ThresholdStatus;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function KPICard({ title, value, unit, status, trend, trendValue, icon, onClick }: KPICardProps) {
  const r = RAG[status] ?? RAG.normal;
  const hasTrend = trend && trend !== "neutral" && trendValue;
  const isUp = trend === "up";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className="kpi-card"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Icon row + trend badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ color: r.iconClr, background: `color-mix(in srgb, ${r.iconClr} 12%, transparent)` }}
        >
          {icon ?? <span style={{ fontSize: 18 }}>▣</span>}
        </div>

        {hasTrend && (
          <span
            className="text-[10px] font-semibold px-2 py-1.5 rounded-lg flex flex-col items-center leading-tight"
            style={{ color: isUp ? 'var(--cwm-success)' : 'var(--cwm-danger)', minWidth: '2.8rem', textAlign: 'center' }}
          >
            <span>{isUp ? '▲' : '▼'}</span>
            <span className="text-[9px] font-normal mt-0.5" style={{ color: 'var(--cwm-text-faint)' }}>{trendValue}</span>
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-1 leading-none text-center">
        <span
          className="text-[2.1rem] font-bold leading-none tracking-tight"
          style={{ color: 'var(--cwm-text)' }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-medium ml-1" style={{ color: 'var(--cwm-text-faint)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        className="text-[11px] font-medium mb-4 leading-snug text-center"
        style={{ color: 'var(--cwm-text-muted)' }}
      >
        {title}
      </p>

      {/* RAG badge */}
      <div className="flex items-center justify-center">
        <span
          className="text-[9px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide flex items-center gap-1.5"
          style={r.badge}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
            style={{ background: r.dot }}
          />
          {r.label}
        </span>
      </div>
    </div>
  );
}
