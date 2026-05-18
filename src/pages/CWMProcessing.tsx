import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const FACILITIES = [
  { name:'Kerawalapitiya MRF',   type:'MRF',       capacity:400, current:312, sorted:94.2, status:'operational' },
  { name:'Borella Transfer Stn', type:'Transfer',   capacity:600, current:541, sorted:0,   status:'operational' },
  { name:'Dematagoda Compost',   type:'Composting', capacity:180, current:138, sorted:100, status:'operational' },
  { name:'Kolonnawa MRF',        type:'MRF',        capacity:250, current:198, sorted:92.8, status:'operational' },
  { name:'Athurugiriya Compost', type:'Composting',  capacity:120, current:84,  sorted:100, status:'maintenance' },
];

function KPITile({ label, value, unit = '', color = 'var(--cwm-accent)' }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-1 leading-none" style={{ color }}>{value}{unit}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function ProcessingPage() {
  const t = getChartTokens();
  const chartData = {
    labels: FACILITIES.map(f => f.name.replace(' MRF','').replace(' Transfer Stn','').replace(' Compost','')),
    datasets: [
      { label: 'Capacity', data: FACILITIES.map(f => f.capacity), backgroundColor: t.panel, borderRadius: 4, borderSkipped: false },
      { label: 'Current',  data: FACILITIES.map(f => f.current),  backgroundColor: FACILITIES.map(f => f.current / f.capacity > 0.9 ? t.warningBar : t.successBar), borderRadius: 4, borderSkipped: false },
    ],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { color: t.legendColor, font: { size: 9 }, boxWidth: 9, padding: 6 } }, tooltip: chartTooltip() },
    scales: chartScales(),
  };

  const totalCapacity = FACILITIES.reduce((s, f) => s + f.capacity, 0);
  const totalCurrent  = FACILITIES.reduce((s, f) => s + f.current, 0);
  const utilPct = (totalCurrent / totalCapacity * 100).toFixed(1);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Processing Facilities</div>
          <div className="page-subtitle">MRF · Transfer Stations · Composting · Live status</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Facilities"         value={FACILITIES.length}           color="var(--cwm-accent)"  />
        <KPITile label="Total Throughput"   value={totalCurrent.toLocaleString()} unit=" t/day" color="var(--cwm-success)" />
        <KPITile label="Capacity Util."     value={utilPct} unit="%" color={parseFloat(utilPct) > 90 ? 'var(--cwm-warning)' : 'var(--cwm-success)'} />
        <KPITile label="MRF Sort Rate"      value="93.6" unit="%" color="var(--cwm-success)" />
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Facility Capacity vs Current Throughput (t/day)</div>
        <div style={{ height: 200 }}><Bar data={chartData} options={chartOptions} /></div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cwm-border)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--cwm-text)' }}>Facility Status</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cwm-border)' }}>
                {['Facility', 'Type', 'Capacity', 'Current', 'Utilisation', 'Sort Rate', 'Status'].map(h => (
                  <th key={h} className="py-2 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACILITIES.map((f, i) => {
                const util = (f.current / f.capacity * 100);
                const utilColor = util > 90 ? 'var(--cwm-warning)' : 'var(--cwm-success)';
                return (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--cwm-border)' }}>
                    <td className="py-2.5 px-4 text-xs font-medium" style={{ color: 'var(--cwm-text)' }}>{f.name}</td>
                    <td className="py-2.5 px-4"><span className="status-chip">{f.type}</span></td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{f.capacity} t</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{f.current} t</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="progress-track w-14"><div className="progress-fill" style={{ width: `${util}%`, background: utilColor }} /></div>
                        <span className="text-[10px] font-semibold" style={{ color: utilColor }}>{util.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--cwm-text-muted)' }}>{f.sorted > 0 ? `${f.sorted}%` : '–'}</td>
                    <td className="py-2.5 px-4">
                      <span className="status-chip" style={{ background: f.status === 'operational' ? 'var(--cwm-success-bg)' : 'var(--cwm-warning-bg)', color: f.status === 'operational' ? 'var(--cwm-success)' : 'var(--cwm-warning)' }}>
                        {f.status.toUpperCase()}
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
