import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const WARDS = [
  { ward:'Fort',           coverage:99.2, collected:286, total:288, missed:2,  critical:false },
  { ward:'Pettah',         coverage:97.8, collected:312, total:319, missed:7,  critical:false },
  { ward:'Kotahena',       coverage:98.5, collected:245, total:249, missed:4,  critical:false },
  { ward:'Maradana',       coverage:96.3, collected:284, total:295, missed:11, critical:false },
  { ward:'Grandpass',      coverage:88.4, collected:236, total:267, missed:31, critical:true  },
  { ward:'Dematagoda',     coverage:97.2, collected:198, total:204, missed:6,  critical:false },
  { ward:'Slave Island',   coverage:99.1, collected:178, total:180, missed:2,  critical:false },
  { ward:'Borella',        coverage:99.5, collected:204, total:205, missed:1,  critical:false },
  { ward:'Narahenpita',    coverage:98.8, collected:189, total:191, missed:2,  critical:false },
  { ward:'Kollupitiya',    coverage:98.2, collected:267, total:272, missed:5,  critical:false },
  { ward:'Bambalapitiya',  coverage:97.9, collected:224, total:229, missed:5,  critical:false },
  { ward:'Wellawatta',     coverage:98.6, collected:194, total:197, missed:3,  critical:false },
  { ward:'Havelock Town',  coverage:93.1, collected:218, total:234, missed:16, critical:false },
  { ward:'Kirulapone',     coverage:91.7, collected:239, total:261, missed:22, critical:true  },
  { ward:'Rajagiriya',     coverage:93.5, collected:241, total:258, missed:17, critical:false },
];

function KPITile({ label, value, unit = '', color = 'var(--cwm-accent)' }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-1 leading-none" style={{ color }}>{value}{unit}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function WasteCollectionPage() {
  const [filter, setFilter] = useState<'all' | 'critical'>('all');
  const displayed = filter === 'critical' ? WARDS.filter(w => w.critical) : WARDS;
  const t = getChartTokens();

  const chartData = {
    labels: WARDS.map(w => w.ward),
    datasets: [{
      label: 'Coverage %',
      data: WARDS.map(w => w.coverage),
      backgroundColor: WARDS.map(w => w.coverage >= 95 ? t.successBar : w.coverage >= 85 ? t.warningBar : t.dangerBar),
      borderRadius: 4, borderSkipped: false,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false }, tooltip: chartTooltip() },
    scales: { x: { ...chartScales().x, min: 75, max: 100 }, y: { ...chartScales().y, ticks: { color: t.tickColor, font: { size: 9 } } } },
  };

  const overallCoverage = (WARDS.reduce((s, w) => s + w.collected, 0) / WARDS.reduce((s, w) => s + w.total, 0) * 100).toFixed(1);
  const totalCollected  = WARDS.reduce((s, w) => s + w.collected, 0);
  const totalMissed     = WARDS.reduce((s, w) => s + w.missed, 0);
  const criticalWards   = WARDS.filter(w => w.critical).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Waste Collection</div>
          <div className="page-subtitle">Ward-by-ward collection performance · {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Overall Coverage"  value={overallCoverage} unit="%" color="var(--cwm-success)" />
        <KPITile label="Points Collected"  value={totalCollected.toLocaleString()} color="var(--cwm-accent)" />
        <KPITile label="Missed Points"     value={totalMissed} color="var(--cwm-warning)" />
        <KPITile label="Critical Wards"    value={criticalWards} color="var(--cwm-danger)" />
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="text-xs font-bold mb-3" style={{ color: 'var(--cwm-text)' }}>Ward Coverage (All Wards)</div>
        <div style={{ height: 300 }}><Bar data={chartData} options={chartOptions} /></div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--cwm-border)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--cwm-text)' }}>Ward Detail</span>
          <div className="flex items-center gap-2">
            {(['all', 'critical'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="text-[10px] font-semibold px-3 py-1 rounded-full capitalize"
                style={{ background: filter === f ? 'var(--cwm-accent-bg)' : 'transparent', color: filter === f ? 'var(--cwm-accent)' : 'var(--cwm-text-muted)', border: `1px solid ${filter === f ? 'var(--cwm-accent-border)' : 'var(--cwm-border)'}` }}>
                {f === 'all' ? 'All Wards' : 'Critical Only'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cwm-border)' }}>
                {['Ward', 'Coverage', 'Collected', 'Total', 'Missed', 'Status'].map(h => (
                  <th key={h} className="py-2 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((w, i) => {
                const covColor = w.coverage >= 95 ? 'var(--cwm-success)' : w.coverage >= 85 ? 'var(--cwm-warning)' : 'var(--cwm-danger)';
                return (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--cwm-border)' }}>
                    <td className="py-2.5 px-4 text-xs font-medium" style={{ color: 'var(--cwm-text)' }}>{w.ward}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="progress-track w-16"><div className="progress-fill" style={{ width: `${w.coverage}%`, background: covColor }} /></div>
                        <span className="text-xs font-bold" style={{ color: covColor }}>{w.coverage}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{w.collected}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{w.total}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold" style={{ color: w.missed > 20 ? 'var(--cwm-danger)' : w.missed > 10 ? 'var(--cwm-warning)' : 'var(--cwm-text-muted)' }}>{w.missed}</td>
                    <td className="py-2.5 px-4">
                      <span className="status-chip" style={{ background: w.critical ? 'var(--cwm-danger-bg)' : 'var(--cwm-success-bg)', color: w.critical ? 'var(--cwm-danger)' : 'var(--cwm-success)', borderColor: w.critical ? 'var(--cwm-danger-border)' : 'var(--cwm-success-border)' }}>
                        {w.critical ? 'CRITICAL' : 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
