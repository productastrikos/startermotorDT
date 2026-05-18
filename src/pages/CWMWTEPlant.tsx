import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
import { getChartTokens, chartTooltip, chartScales } from '../components/chartUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const HOURS = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
const INTAKE   = [0,0,0,0,0,0,18,64,120,148,156,142,130,126,140,152,148,138,92,48,22,8,0,0];
const OUTPUT   = [0,0,0,0,0,0,12,48,96,118,124,114,104,100,112,122,118,110,74,38,18,6,0,0];
const TEMP     = [820,818,822,819,821,824,835,848,856,861,858,854,850,847,855,860,858,852,840,832,826,822,820,819];

function KPITile({ label, value, unit = '', sub = '', color = 'var(--cwm-accent)' }: { label: string; value: string | number; unit?: string; sub?: string; color?: string }) {
  return (
    <div className="kpi-card">
      <div className="text-[1.8rem] font-bold mb-0.5 leading-none" style={{ color }}>{value}<span className="text-sm font-normal ml-0.5" style={{ color: 'var(--cwm-text-muted)' }}>{unit}</span></div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
      {sub && <div className="text-[10px]" style={{ color: 'var(--cwm-text-faint)' }}>{sub}</div>}
    </div>
  );
}

export default function WTEPlantPage() {
  const t = getChartTokens();

  const intakeData = {
    labels: HOURS,
    datasets: [
      { label: 'Intake (t/h)', data: INTAKE, borderColor: t.accent, backgroundColor: t.accentBg, fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Output (t/h)', data: OUTPUT, borderColor: t.success, backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ],
  };
  const tempData = {
    labels: HOURS,
    datasets: [{ label: 'Temp (°C)', data: TEMP, borderColor: t.danger, backgroundColor: t.dangerBg, fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }],
  };
  const lineOpts = (minY?: number, maxY?: number) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { color: t.legendColor, font: { size: 8 }, boxWidth: 9, padding: 6 } }, tooltip: chartTooltip() },
    scales: { ...chartScales(), ...(minY !== undefined ? { y: { ...chartScales().y, min: minY, max: maxY } } : {}) },
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">WTE Plant</div>
          <div className="page-subtitle">Waste-to-Energy · Kerawalapitiya Facility · Live monitoring</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--cwm-success-bg)', color: 'var(--cwm-success)', border: '1px solid var(--cwm-success-border)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cwm-success)' }} />Plant Online
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPITile label="Daily Intake"       value="1,286" unit="t"    color="var(--cwm-accent)"  sub="Target: 1,400 t" />
        <KPITile label="Energy Output"      value="12.4"  unit="MWh"  color="var(--cwm-success)" sub="+3.2% vs yesterday" />
        <KPITile label="Combustion Temp"    value="858"   unit="°C"   color="var(--cwm-danger)"  sub="Normal range" />
        <KPITile label="Efficiency"         value="88.6"  unit="%"    color="var(--cwm-success)" />
        <KPITile label="Ash Output"         value="128"   unit="t"    color="var(--cwm-warning)"  />
        <KPITile label="Uptime"             value="99.2"  unit="%"    color="var(--cwm-success)" sub="30-day rolling" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Intake vs Energy Output (24H)</div>
          <div style={{ height: 160 }}><Line data={intakeData} options={lineOpts()} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--cwm-text-muted)' }}>Combustion Temperature (24H)</div>
          <div style={{ height: 160 }}><Line data={tempData} options={lineOpts(800, 900)} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { label: 'Line 1', status: 'OPERATIONAL', intake: 420, temp: 858, power: '4.2 MWh', color: 'var(--cwm-success)' },
          { label: 'Line 2', status: 'OPERATIONAL', intake: 442, temp: 862, power: '4.4 MWh', color: 'var(--cwm-success)' },
          { label: 'Line 3', status: 'STANDBY',     intake: 424, temp: 854, power: '3.8 MWh', color: 'var(--cwm-warning)' },
        ].map(line => (
          <div key={line.label} className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: 'var(--cwm-text)' }}>{line.label}</span>
              <span className="status-chip text-[9px]" style={{ background: line.status === 'OPERATIONAL' ? 'var(--cwm-success-bg)' : 'var(--cwm-warning-bg)', color: line.status === 'OPERATIONAL' ? 'var(--cwm-success)' : 'var(--cwm-warning)', borderColor: line.color + '55' }}>{line.status}</span>
            </div>
            {[['Intake', `${line.intake} t/h`], ['Temperature', `${line.temp} °C`], ['Power', line.power]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1.5 border-b last:border-0" style={{ borderColor: 'var(--cwm-border)' }}>
                <span style={{ color: 'var(--cwm-text-muted)' }}>{k}</span>
                <span className="font-semibold" style={{ color: 'var(--cwm-text)' }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
