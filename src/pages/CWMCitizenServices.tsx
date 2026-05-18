import React, { useState } from 'react';

const COMPLAINTS = [
  { id:'CMP-0041', type:'Missed Collection', ward:'Grandpass',     priority:'high',   status:'open',     submitted:'09:12',  name:'Amal Perera',   phone:'077-1234567' },
  { id:'CMP-0040', type:'Illegal Dumping',   ward:'Kirulapone',    priority:'medium', status:'assigned', submitted:'08:48',  name:'Nilmini S.',    phone:'071-9876543' },
  { id:'CMP-0039', type:'Bin Overflow',      ward:'Kotahena',      priority:'low',    status:'resolved', submitted:'07:30',  name:'Chamara R.',    phone:'076-4561234' },
  { id:'CMP-0038', type:'Missed Collection', ward:'Borella',       priority:'medium', status:'resolved', submitted:'Yesterday', name:'Priya K.',    phone:'070-3214567' },
  { id:'CMP-0037', type:'Bin Damage',        ward:'Kollupitiya',   priority:'low',    status:'open',     submitted:'Yesterday', name:'Suresh W.',   phone:'072-8765432' },
  { id:'CMP-0036', type:'Missed Collection', ward:'Dematagoda',    priority:'high',   status:'open',     submitted:'2d ago',  name:'Kamal T.',    phone:'075-6543210' },
];

const SCHEDULE = [
  { ward:'Fort',          day:'Mon/Thu', time:'06:00', vehicle:'V-001', status:'on-time' },
  { ward:'Pettah',        day:'Mon/Thu', time:'07:00', vehicle:'V-002', status:'on-time' },
  { ward:'Kotahena',      day:'Tue/Fri', time:'06:30', vehicle:'V-007', status:'on-time' },
  { ward:'Maradana',      day:'Tue/Fri', time:'07:30', vehicle:'V-003', status:'delayed' },
  { ward:'Grandpass',     day:'Wed/Sat', time:'06:00', vehicle:'V-002', status:'delayed' },
  { ward:'Borella',       day:'Mon/Thu', time:'08:00', vehicle:'V-008', status:'on-time' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--cwm-danger)', medium: 'var(--cwm-warning)', low: 'var(--cwm-text-faint)',
};
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  open:     { bg: 'var(--cwm-danger-bg)',  fg: 'var(--cwm-danger)'  },
  assigned: { bg: 'var(--cwm-warning-bg)', fg: 'var(--cwm-warning)' },
  resolved: { bg: 'var(--cwm-success-bg)', fg: 'var(--cwm-success)' },
};

function KPITile({ label, value, color = 'var(--cwm-accent)' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="kpi-card text-center">
      <div className="text-[1.8rem] font-bold mb-1 leading-none" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--cwm-text-muted)' }}>{label}</div>
    </div>
  );
}

export default function CitizenServicesPage() {
  const [tab, setTab] = useState<'complaints' | 'schedule'>('complaints');
  const open     = COMPLAINTS.filter(c => c.status === 'open').length;
  const assigned = COMPLAINTS.filter(c => c.status === 'assigned').length;
  const resolved = COMPLAINTS.filter(c => c.status === 'resolved').length;
  const avgTime  = '3.2h';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Citizen Services</div>
          <div className="page-subtitle">Complaints · Collection schedules · Citizen engagement</div>
        </div>
        <button className="cwm-btn px-4 py-2 text-sm">+ Log Complaint</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Open Complaints"  value={open}     color="var(--cwm-danger)"  />
        <KPITile label="In Progress"      value={assigned} color="var(--cwm-warning)" />
        <KPITile label="Resolved Today"   value={resolved} color="var(--cwm-success)" />
        <KPITile label="Avg Resolution"   value={avgTime}  color="var(--cwm-accent)"  />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--cwm-surface-soft)', border: '1px solid var(--cwm-border)' }}>
        {(['complaints', 'schedule'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
            style={{ background: tab === t ? 'var(--cwm-accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--cwm-text-muted)' }}>
            {t === 'complaints' ? 'Complaints' : 'Collection Schedule'}
          </button>
        ))}
      </div>

      {tab === 'complaints' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cwm-border)' }}>
                  {['ID', 'Type', 'Ward', 'Submitted By', 'Priority', 'Status', 'Time'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPLAINTS.map((c, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--cwm-border)' }}>
                    <td className="py-2.5 px-4 text-xs font-bold" style={{ color: 'var(--cwm-accent)' }}>{c.id}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text)' }}>{c.type}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{c.ward}</td>
                    <td className="py-2.5 px-4">
                      <div className="text-xs" style={{ color: 'var(--cwm-text)' }}>{c.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--cwm-text-faint)' }}>{c.phone}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[9px] font-bold uppercase" style={{ color: PRIORITY_COLORS[c.priority] }}>{c.priority}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="status-chip" style={{ background: STATUS_COLORS[c.status].bg, color: STATUS_COLORS[c.status].fg }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[10px]" style={{ color: 'var(--cwm-text-faint)' }}>{c.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cwm-border)' }}>
                  {['Ward', 'Days', 'Time', 'Vehicle', 'Status'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--cwm-text-faint)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((s, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--cwm-border)' }}>
                    <td className="py-2.5 px-4 text-xs font-medium" style={{ color: 'var(--cwm-text)' }}>{s.ward}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{s.day}</td>
                    <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--cwm-text-muted)' }}>{s.time}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold" style={{ color: 'var(--cwm-accent)' }}>{s.vehicle}</td>
                    <td className="py-2.5 px-4">
                      <span className="status-chip" style={{ background: s.status === 'on-time' ? 'var(--cwm-success-bg)' : 'var(--cwm-warning-bg)', color: s.status === 'on-time' ? 'var(--cwm-success)' : 'var(--cwm-warning)' }}>
                        {s.status === 'on-time' ? 'ON TIME' : 'DELAYED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
