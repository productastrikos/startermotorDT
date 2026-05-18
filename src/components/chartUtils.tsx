import React from 'react';

export function getCSSVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getChartTokens() {
  return {
    tooltipBg:     getCSSVar('--cwm-chart-tooltip-bg'),
    tooltipBorder: getCSSVar('--cwm-chart-tooltip-border'),
    tooltipTitle:  getCSSVar('--cwm-text'),
    tooltipBody:   getCSSVar('--cwm-text-muted'),
    gridColor:     getCSSVar('--cwm-chart-grid'),
    tickColor:     getCSSVar('--cwm-text-faint'),
    tickMuted:     getCSSVar('--cwm-text-muted'),
    legendColor:   getCSSVar('--cwm-text-muted'),
    success:       getCSSVar('--cwm-success'),
    warning:       getCSSVar('--cwm-warning'),
    danger:        getCSSVar('--cwm-danger'),
    info:          getCSSVar('--cwm-info'),
    accent:        getCSSVar('--cwm-accent'),
    accentBg:      getCSSVar('--cwm-accent-bg'),
    violet:        getCSSVar('--cwm-violet'),
    violetBg:      getCSSVar('--cwm-violet-bg'),
    successBar:    getCSSVar('--cwm-success-bar'),
    warningBar:    getCSSVar('--cwm-warning-bar'),
    dangerBar:     getCSSVar('--cwm-danger-bar'),
  };
}

export function chartTooltip(extra: object = {}) {
  const t = getChartTokens();
  return {
    backgroundColor: t.tooltipBg,
    borderColor:     t.tooltipBorder,
    borderWidth:     1,
    titleColor:      t.tooltipTitle,
    bodyColor:       t.tooltipBody,
    padding:         8,
    ...extra,
  };
}

export function chartScales(overrides: { x?: object; y?: object } = {}) {
  const t = getChartTokens();
  return {
    x: { grid: { color: t.gridColor }, ticks: { color: t.tickColor, font: { size: 9 } }, ...(overrides.x || {}) },
    y: { grid: { color: t.gridColor }, ticks: { color: t.tickColor, font: { size: 9 } }, ...(overrides.y || {}) },
  };
}

function buildPalettes() {
  const t = getChartTokens();
  // Categorical palette uses the DS-specified fixed series colours only.
  // RAG colours (success/warning/danger) and the AI violet are NEVER used here.
  const s1 = getCSSVar('--cwm-chart-series-1');
  const s2 = getCSSVar('--cwm-chart-series-2');
  const s3 = getCSSVar('--cwm-chart-series-3');
  const s4 = getCSSVar('--cwm-chart-series-4');
  const s5 = getCSSVar('--cwm-chart-series-5');
  const s6 = getCSSVar('--cwm-chart-series-6');
  const s7 = getCSSVar('--cwm-chart-series-7');
  const s8 = getCSSVar('--cwm-chart-series-8');
  return {
    categorical: [s1, s2, s3, s4, s5, s6, s7, s8],
    area: {
      blue:   { border: s1, fill: `${s1}1f` },
      sky:    { border: s2, fill: `${s2}1f` },
      teal:   { border: s3, fill: `${s3}1f` },
      violet: { border: t.violet, fill: t.violetBg },
      slate:  { border: s8, fill: getCSSVar('--cwm-surface-soft') },
    },
  };
}

export const CHART_PALETTES = new Proxy({} as ReturnType<typeof buildPalettes>, {
  get(_: object, key: string) { return (buildPalettes() as Record<string, unknown>)[key]; },
});

const LABEL_BUILDERS: Record<string, (n: number) => string[]> = {
  '12H': (n) => Array.from({ length: n }, (_, i) => `${String(Math.round((i / Math.max(n - 1, 1)) * 12)).padStart(2, '0')}:00`),
  '24H': (n) => Array.from({ length: n }, (_, i) => `${String(Math.round((i / Math.max(n - 1, 1)) * 23)).padStart(2, '0')}:00`),
  '7D':  (n) => Array.from({ length: n }, (_, i) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7]),
  '30D': (n) => Array.from({ length: n }, (_, i) => `D${i + 1}`),
};

export interface TimeframeOption {
  value: string;
  label: string;
  points: number;
  dataWindow: number | null;
}

export const TIMEFRAME_OPTIONS: Record<string, TimeframeOption[]> = {
  realtime:    [ { value: '12H', label: '12H', points: 12, dataWindow: 12 }, { value: '24H', label: '24H', points: 24, dataWindow: null } ],
  ops:         [ { value: '24H', label: '24H', points: 24, dataWindow: null }, { value: '7D',  label: '7D',  points: 7,  dataWindow: null } ],
  trend:       [ { value: '7D',  label: '7D',  points: 7,  dataWindow: 7  }, { value: '30D', label: '30D', points: 30, dataWindow: null } ],
  strategic:   [ { value: '30D', label: '30D', points: 30, dataWindow: null } ],
  intradayOps: [ { value: '12H', label: '12H', points: 12, dataWindow: 12 }, { value: '24H', label: '24H', points: 24, dataWindow: null } ],
  dailyOps:    [ { value: '24H', label: '24H', points: 24, dataWindow: null }, { value: '7D',  label: '7D',  points: 7,  dataWindow: null } ],
  weekly:      [ { value: '7D',  label: '7D',  points: 7,  dataWindow: 7  }, { value: '30D', label: '30D', points: 30, dataWindow: null } ],
  monthly:     [ { value: '7D',  label: '7D',  points: 7,  dataWindow: 7  }, { value: '30D', label: '30D', points: 30, dataWindow: null } ],
};

interface ChartTimeframeControlProps {
  options: TimeframeOption[];
  value: string;
  onChange: (v: string) => void;
}

export function ChartTimeframeControl({ options, value, onChange }: ChartTimeframeControlProps) {
  if (!options || options.length < 2) return null;
  return (
    <div className="cwm-timeframe-control inline-flex items-center" role="tablist" aria-label="Time range">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`cwm-timeframe-btn ${value === opt.value ? 'is-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function getTimeframeOption(options: TimeframeOption[], value: string): TimeframeOption {
  return options.find((o) => o.value === value) || options[0];
}

export function buildTimeframeLabels(timeframe: string, points: number): string[] {
  return (LABEL_BUILDERS[timeframe] || LABEL_BUILDERS['24H'])(points);
}

export function resampleSeries(base: number[], points: number): number[] {
  if (!Array.isArray(base) || base.length === 0) return [];
  if (base.length === points) return base;
  if (points === 1) return [base[base.length - 1]];
  return Array.from({ length: points }, (_, i) => {
    const pos = (i / (points - 1)) * (base.length - 1);
    const lo  = Math.floor(pos);
    const hi  = Math.min(base.length - 1, Math.ceil(pos));
    const mix = pos - lo;
    return parseFloat((base[lo] + (base[hi] - base[lo]) * mix).toFixed(2));
  });
}
