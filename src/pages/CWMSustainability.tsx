import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CO2_AVOIDED    = [142,148,152,159,163,168,172,178,183,188,192,196];
const RECYCLING_RATE = [26.2, 27.1, 27.8, 28.4, 29.1, 29.8, 30.2, 30.9, 31.4, 31.8, 32.1, 32.4];

const ESG_GOALS = [
  { goal:'Recycling Rate ≥ 40%',         current:31.4, target:40,  unit:'%',   color:'var(--cwm-accent)'  },
  { goal:'Landfill Diversion ≥ 65%',     current:60.7, target:65,  unit:'%',   color:'var(--cwm-success)' },
  { goal:'Carbon Score ≤ 2.0 t/100t',    current:2.34, target:2.0, unit:'',    color:'var(--cwm-danger)',  inverse:true },
  { goal:'WTE Capacity Utilisation ≥90%',current:88.6, target:90,  unit:'%',   color:'var(--cwm-warning)' },
  { goal:'Compost Output ≥ 200 t/day',   current:138,  target:200, unit:' t',  color:'var(--cwm-warning)' },
];

function KPITile({ label, value, unit = '', color = 'var(--cwm-accent)', sub = '' }: { label: string; value: string | number; unit?: string; color?: string; sub?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-0.5 leading-none" style={{ color }}>{value}{unit}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--cwm-text-faint)' }}>{sub}</div>}
    </div>
  );
}

export default function SustainabilityPage() {
  const t = getChartTokens();

  const co2Data = {
    labels: MONTHS,
    datasets: [{ label: 'CO₂ Avoided (t)', data: CO2_AVOIDED, borderColor: t.success, backgroundColor: t.successBg, fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }],
  };
  const recyclingData = {
    labels: MONTHS,
    datasets: [{ label: 'Recycling Rate (%)', data: RECYCLING_RATE, borderColor: t.accent, backgroundColor: t.accentBg, fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }],
  };
  const wasteFlowData = {
    labels: ['WTE', 'Recycled', 'Composted', 'Landfill', 'Hazardous'],
    datasets: [{ data: [14, 31, 8, 45, 2], backgroundColor: [t.violet, t.success, t.successLight, t.warning, t.danger], borderWidth: 0 }],
  };
  const lineOpts = (min?: number, max?: number) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: chartTooltip() },
    scales: { ...chartScales(), ...(min !== undefined ? { y: { ...chartScales().y, min, max } } : {}) },
  });
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '60%',
    plugins: { legend: { display: true, position: 'right' as const, labels: { color: t.legendColor, font: { size: 9 }, boxWidth: 9, padding: 6 } }, tooltip: chartTooltip() },
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Sustainability & ESG</div>
          <div className="page-subtitle">Environmental performance · Carbon · Recycling · Waste diversion goals</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--cwm-success-bg)', color: 'var(--cwm-success)', border: '1px solid var(--cwm-success-border)' }}>
          Carbon Score: 2.34 t / 100t
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Recycling Rate"    value="31.4" unit="%" color="var(--cwm-success)" sub="+1.2pp YTD" />
        <KPITile label="CO₂ Avoided"       value="196"  unit=" t" color="var(--cwm-success)" sub="This month" />
        <KPITile label="Landfill Diversion" value="60.7" unit="%" color="var(--cwm-accent)" sub="Target: 65%" />
        <KPITile label="Compost Output"    value="138"  unit=" t" color="var(--cwm-warning)" sub="Target: 200 t/day" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>CO₂ Avoided (t/month)</div>
          <div style={{ height: 140 }}><Line data={co2Data} options={lineOpts(100, 220)} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Recycling Rate Trend</div>
          <div style={{ height: 140 }}><Line data={recyclingData} options={lineOpts(20, 40)} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Waste Flow Split</div>
          <div style={{ height: 140 }}><Doughnut data={wasteFlowData} options={doughnutOpts} /></div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="text-xs font-bold mb-4" style={{ color: 'var(--cwm-text)' }}>ESG Goal Progress</div>
        <div className="space-y-4">
          {ESG_GOALS.map((g, i) => {
            const pct = g.inverse ? Math.min(100, (g.target / g.current) * 100) : Math.min(100, (g.current / g.target) * 100);
            const achieved = g.inverse ? g.current <= g.target : g.current >= g.target;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--cwm-text)' }}>{g.goal}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: 'var(--cwm-text-faint)' }}>Target: {g.inverse ? '≤' : '≥'} {g.target}{g.unit}</span>
                    <span className="text-xs font-bold" style={{ color: achieved ? 'var(--cwm-success)' : g.color }}>{g.current}{g.unit}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: achieved ? 'var(--cwm-success-bg)' : 'var(--cwm-danger-bg)', color: achieved ? 'var(--cwm-success)' : 'var(--cwm-danger)' }}>
                      {achieved ? 'ON TRACK' : 'BEHIND'}
                    </span>
                  </div>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: achieved ? 'var(--cwm-success)' : g.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
