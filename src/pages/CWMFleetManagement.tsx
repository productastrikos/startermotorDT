import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales, ChartTimeframeControl, TIMEFRAME_OPTIONS, getTimeframeOption, buildTimeframeLabels, resampleSeries } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const FLEET = [
  { id:'V-001', type:'Compactor', zone:'Z1', driver:'Kamal P.', status:'active',       route:'R1 – Fort-Pettah',      fuel:78, mileage:42,  lastSeen:'09:41' },
  { id:'V-002', type:'Compactor', zone:'Z2', driver:'Sanka R.', status:'active',       route:'R4 – Grandpass',        fuel:62, mileage:37,  lastSeen:'09:38' },
  { id:'V-003', type:'Mini-Truck',zone:'Z3', driver:'Nimal F.', status:'active',       route:'R7 – Borella',          fuel:84, mileage:21,  lastSeen:'09:40' },
  { id:'V-004', type:'Compactor', zone:'Z4', driver:'Ruwan K.', status:'idle',         route:'Depot – standby',       fuel:91, mileage:0,   lastSeen:'08:55' },
  { id:'V-005', type:'Hook-lift', zone:'Z5', driver:'Amila S.', status:'active',       route:'R12 – Kirulapone',      fuel:55, mileage:58,  lastSeen:'09:39' },
  { id:'V-006', type:'Compactor', zone:'Z2', driver:'Chandu M.',status:'maintenance',  route:'Workshop – Brake fix',  fuel:30, mileage:0,   lastSeen:'07:00' },
  { id:'V-007', type:'Mini-Truck',zone:'Z1', driver:'Priya N.', status:'active',       route:'R2 – Kotahena',         fuel:72, mileage:31,  lastSeen:'09:42' },
  { id:'V-008', type:'Compactor', zone:'Z3', driver:'Suresh T.', status:'active',      route:'R8 – Narahenpita',      fuel:68, mileage:44,  lastSeen:'09:37' },
  { id:'V-009', type:'Compactor', zone:'Z4', driver:'Bandu W.', status:'idle',         route:'Depot – standby',       fuel:88, mileage:0,   lastSeen:'09:10' },
  { id:'V-010', type:'Roll-off',  zone:'Z5', driver:'Gayan D.', status:'active',       route:'R15 – Rajagiriya',      fuel:45, mileage:63,  lastSeen:'09:35' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--cwm-success)',
  idle: 'var(--cwm-warning)',
  maintenance: 'var(--cwm-danger)',
};
const STATUS_BG: Record<string, string> = {
  active: 'var(--cwm-success-bg)',
  idle: 'var(--cwm-warning-bg)',
  maintenance: 'var(--cwm-danger-bg)',
};

const FUEL_DATA = [88,85,83,80,79,77,76,74,72,71,69,68,66,65,63,61,60,58,56,55,53,51,50,49];

function KPITile({ label, value, unit = '', color = 'var(--cwm-accent)' }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-1 leading-none" style={{ color }}>{value}{unit}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function FleetManagementPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'idle' | 'maintenance'>('all');
  const [tf, setTf] = useState(TIMEFRAME_OPTIONS.ops[0].value);
  const activeOpt = getTimeframeOption(TIMEFRAME_OPTIONS.ops, tf);
  const fuelResampled = resampleSeries(FUEL_DATA, activeOpt.points);
  const t = getChartTokens();

  const fuelChartData = {
    labels: buildTimeframeLabels(activeOpt.value, activeOpt.points),
    datasets: [{
      label: 'Fleet Avg Fuel (%)', data: fuelResampled,
      borderColor: t.accent, backgroundColor: t.accentBg,
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
    }],
  };
  const fuelOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: chartTooltip() },
    scales: { ...chartScales(), y: { ...chartScales().y, min: 0, max: 100 } },
  };

  const displayed = statusFilter === 'all' ? FLEET : FLEET.filter(v => v.status === statusFilter);
  const active = FLEET.filter(v => v.status === 'active').length;
  const idle   = FLEET.filter(v => v.status === 'idle').length;
  const maint  = FLEET.filter(v => v.status === 'maintenance').length;
  const avgFuel = Math.round(FLEET.reduce((s, v) => s + v.fuel, 0) / FLEET.length);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Fleet Management</div>
          <div className="page-subtitle">Real-time vehicle status · {FLEET.length} vehicles tracked</div>
        </div>
        <button className="cwm-btn px-4 py-2 text-sm">+ Dispatch Vehicle</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Active"      value={active} color="var(--cwm-success)" />
        <KPITile label="Idle"        value={idle}   color="var(--cwm-warning)" />
        <KPITile label="Maintenance" value={maint}  color="var(--cwm-danger)"  />
        <KPITile label="Avg Fuel"    value={avgFuel} unit="%" color="var(--cwm-accent)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl p-3" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cwm-text-muted)' }}>Fleet Avg Fuel Level</span>
            <ChartTimeframeControl options={TIMEFRAME_OPTIONS.ops} value={tf} onChange={setTf} />
          </div>
          <div style={{ height: 140 }}><Line data={fuelChartData} options={fuelOptions} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--cwm-text-muted)' }}>Fleet Breakdown</div>
          {[{ label: 'Active', count: active, total: FLEET.length, color: 'var(--cwm-success)' }, { label: 'Idle', count: idle, total: FLEET.length, color: 'var(--cwm-warning)' }, { label: 'Maintenance', count: maint, total: FLEET.length, color: 'var(--cwm-danger)' }].map(item => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--cwm-text-muted)' }}>
                <span>{item.label}</span><span className="font-semibold" style={{ color: item.color }}>{item.count}/{item.total}</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${(item.count / item.total) * 100}%`, background: item.color }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--cwm-border)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--cwm-text)' }}>Vehicle Register</span>
          <div className="flex gap-2">
            {(['all', 'active', 'idle', 'maintenance'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="text-[10px] font-semibold px-3 py-1 rounded-full capitalize"
                style={{ background: statusFilter === f ? 'var(--cwm-accent-bg)' : 'transparent', color: statusFilter === f ? 'var(--cwm-accent)' : 'var(--cwm-text-muted)', border: `1px solid ${statusFilter === f ? 'var(--cwm-accent-border)' : 'var(--cwm-border)'}` }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cwm-border)' }}>
                {['Vehicle', 'Type', 'Zone', 'Driver', 'Route', 'Fuel', 'Mileage', 'Status'].map(h => (
                  <th key={h} className="py-2 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((v, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--cwm-border)' }}>
                  <td className="py-2.5 px-4 text-xs font-bold" style={{ color: 'var(--cwm-accent)' }}>{v.id}</td>
                  <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{v.type}</td>
                  <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{v.zone}</td>
                  <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text)' }}>{v.driver}</td>
                  <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)', maxWidth: 160 }}>{v.route}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="progress-track w-12"><div className="progress-fill" style={{ width: `${v.fuel}%`, background: v.fuel > 60 ? 'var(--cwm-success)' : v.fuel > 30 ? 'var(--cwm-warning)' : 'var(--cwm-danger)' }} /></div>
                      <span className="text-[10px]" style={{ color: 'var(--cwm-text-muted)' }}>{v.fuel}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{v.mileage} km</td>
                  <td className="py-2.5 px-4">
                    <span className="status-chip" style={{ background: STATUS_BG[v.status], color: STATUS_COLORS[v.status], borderColor: STATUS_COLORS[v.status] + '55' }}>
                      {v.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
