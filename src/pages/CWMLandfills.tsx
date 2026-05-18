import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LANDFILL_INTAKE  = [820,780,810,760,740,695,680,670,658,645,632,620];
const LEACHATE_LEVEL   = [42,44,46,45,48,52,54,53,55,57,56,54];
const GAS_CAPTURE      = [62,65,68,72,74,78,82,85,88,90,92,94];

const SITES = [
  { name:'Karadiyana Landfill', zone:'Z5', capacity:85, remaining:15, gasCapture:'94%', leachate:'Normal', status:'operational', daily:520 },
  { name:'Meethotamulla (Old)', zone:'Z2', capacity:100, remaining:0, gasCapture:'76%', leachate:'Elevated', status:'closed', daily:0 },
  { name:'Salgadu Reserve',     zone:'Z3', capacity:42,  remaining:58, gasCapture:'N/A', leachate:'Normal', status:'standby', daily:0 },
];

function KPITile({ label, value, unit = '', color = 'var(--cwm-accent)' }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-1 leading-none" style={{ color }}>{value}{unit}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function LandfillsPage() {
  const t = getChartTokens();

  const intakeData = {
    labels: MONTHS,
    datasets: [{ label: 'Daily Intake (t)', data: LANDFILL_INTAKE, borderColor: t.warning, backgroundColor: t.warningBg, fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }],
  };
  const gasData = {
    labels: MONTHS,
    datasets: [{ label: 'Gas Capture (%)', data: GAS_CAPTURE, borderColor: t.success, backgroundColor: t.successBg, fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }],
  };
  const lineOpts = (min?: number, max?: number) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: chartTooltip() },
    scales: { ...chartScales(), ...(min !== undefined ? { y: { ...chartScales().y, min, max } } : {}) },
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Landfill Management</div>
          <div className="page-subtitle">Site capacity · Leachate · Gas capture · Trend monitoring</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Daily Landfill"   value="520"  unit=" t"  color="var(--cwm-warning)"  />
        <KPITile label="Diversion Rate"   value="60.7" unit="%"   color="var(--cwm-success)"  />
        <KPITile label="Gas Capture Rate" value="94"   unit="%"   color="var(--cwm-success)"  />
        <KPITile label="Karadiyana Fill"  value="85"   unit="%"   color="var(--cwm-warning)"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Monthly Landfill Intake (tonnes)</div>
          <div style={{ height: 150 }}><Line data={intakeData} options={lineOpts(500, 900)} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Landfill Gas Capture Rate (%)</div>
          <div style={{ height: 150 }}><Line data={gasData} options={lineOpts(50, 100)} /></div>
        </div>
      </div>

      <div className="space-y-3">
        {SITES.map((site, i) => {
          const statusColor = site.status === 'operational' ? 'var(--cwm-success)' : site.status === 'closed' ? 'var(--cwm-danger)' : 'var(--cwm-warning)';
          const statusBg    = site.status === 'operational' ? 'var(--cwm-success-bg)' : site.status === 'closed' ? 'var(--cwm-danger-bg)' : 'var(--cwm-warning-bg)';
          const fillColor   = site.capacity >= 90 ? 'var(--cwm-danger)' : site.capacity >= 70 ? 'var(--cwm-warning)' : 'var(--cwm-success)';
          return (
            <div key={i} className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--cwm-text)' }}>{site.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--cwm-text-faint)' }}>Zone {site.zone.replace('Z','')}</div>
                </div>
                <span className="status-chip" style={{ background: statusBg, color: statusColor }}>{site.status.toUpperCase()}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--cwm-text-muted)' }}>
                  <span>Capacity used</span><span className="font-semibold" style={{ color: fillColor }}>{site.capacity}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${site.capacity}%`, background: fillColor }} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[['Daily Intake', site.daily > 0 ? `${site.daily} t` : '–'], ['Gas Capture', site.gasCapture], ['Leachate', site.leachate]].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{k}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: (v as string).includes('Elevated') ? 'var(--cwm-warning)' : 'var(--cwm-text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
