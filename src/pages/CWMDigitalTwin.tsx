import React, { useState } from 'react';

// SVG-based city digital twin map for Colombo SWM network
const ZONES = [
  { id:'Z1', label:'Zone 1\nNorthern Port', cx:260, cy:120, color:'#10b981', bins:42, vehicles:7,  fill:58 },
  { id:'Z2', label:'Zone 2\nInner North',   cx:310, cy:200, color:'#f59e0b', bins:38, vehicles:5,  fill:63 },
  { id:'Z3', label:'Zone 3\nCentral',        cx:260, cy:280, color:'#10b981', bins:35, vehicles:6,  fill:51 },
  { id:'Z4', label:'Zone 4\nW. Coastal',     cx:160, cy:260, color:'#10b981', bins:40, vehicles:6,  fill:56 },
  { id:'Z5', label:'Zone 5\nSouthern',       cx:220, cy:360, color:'#f59e0b', bins:45, vehicles:8,  fill:70 },
];
const FACILITIES = [
  { type:'WTE', label:'WTE Plant',     x:380, y:300, icon:'⚡', color:'#8b5cf6' },
  { type:'MRF', label:'Kerawalapitiya MRF', x:400, y:180, icon:'♻️', color:'#06b6d4' },
  { type:'LDF', label:'Karadiyana Landfill', x:180, y:420, icon:'🏔', color:'#6b7280' },
];
const VEHICLES = [
  { id:'V-001', x:255, y:105, zone:'Z1', active:true  },
  { id:'V-002', x:320, y:195, zone:'Z2', active:true  },
  { id:'V-003', x:258, y:275, zone:'Z3', active:true  },
  { id:'V-004', x:155, y:255, zone:'Z4', active:false },
  { id:'V-005', x:215, y:355, zone:'Z5', active:true  },
];

function CityMap({ selectedZone, onSelectZone }: { selectedZone: string | null; onSelectZone: (z: string | null) => void }) {
  return (
    <svg viewBox="0 0 520 480" className="w-full h-full" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Background */}
      <rect width="520" height="480" fill="var(--cwm-surface)" rx="8" />
      {/* Ocean/water */}
      <ellipse cx="100" cy="240" rx="80" ry="180" fill="var(--cwm-accent)" opacity="0.08" />
      {/* Route lines */}
      <polyline points="260,120 310,200 260,280 160,260 220,360" fill="none" stroke="var(--cwm-border)" strokeWidth="1.5" strokeDasharray="5,4" />

      {/* Zone circles */}
      {ZONES.map(z => (
        <g key={z.id} onClick={() => onSelectZone(selectedZone === z.id ? null : z.id)} style={{ cursor: 'pointer' }}>
          <circle cx={z.cx} cy={z.cy} r={selectedZone === z.id ? 38 : 32}
            fill={z.color + '22'} stroke={z.color} strokeWidth={selectedZone === z.id ? 2.5 : 1.5}
            style={{ transition: 'all 0.2s' }} />
          <text x={z.cx} y={z.cy - 4} textAnchor="middle" fill={z.color} fontSize="11" fontWeight="bold">{z.id}</text>
          <text x={z.cx} y={z.cy + 10} textAnchor="middle" fill="var(--cwm-text-faint)" fontSize="8">{z.fill}%</text>
          {/* Fill level arc */}
          <circle cx={z.cx} cy={z.cy} r={selectedZone === z.id ? 38 : 32}
            fill="none" stroke={z.color} strokeWidth="3"
            strokeDasharray={`${((selectedZone === z.id ? 38 : 32) * 2 * Math.PI * z.fill / 100).toFixed(1)} 999`}
            strokeLinecap="round"
            transform={`rotate(-90 ${z.cx} ${z.cy})`} opacity="0.5" />
        </g>
      ))}

      {/* Facilities */}
      {FACILITIES.map(f => (
        <g key={f.type}>
          <rect x={f.x - 18} y={f.y - 12} width="36" height="24" rx="4" fill={f.color + '22'} stroke={f.color} strokeWidth="1.2" />
          <text x={f.x} y={f.y + 5} textAnchor="middle" fontSize="12">{f.icon}</text>
        </g>
      ))}

      {/* Vehicles */}
      {VEHICLES.map(v => (
        <g key={v.id}>
          <circle cx={v.x} cy={v.y} r={5} fill={v.active ? '#10b981' : '#6b7280'} stroke="var(--cwm-bg)" strokeWidth="1.5">
            {v.active && <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />}
          </circle>
        </g>
      ))}

      {/* Legend */}
      <g transform="translate(12, 430)">
        <circle cx="8" cy="6" r="4" fill="#10b981" />
        <text x="16" y="10" fill="var(--cwm-text-faint)" fontSize="9">Active vehicle</text>
        <circle cx="88" cy="6" r="4" fill="#6b7280" />
        <text x="96" y="10" fill="var(--cwm-text-faint)" fontSize="9">Idle</text>
        <circle cx="130" cy="6" r="8" fill="none" stroke="#10b981" strokeWidth="1.2" />
        <text x="142" y="10" fill="var(--cwm-text-faint)" fontSize="9">Zone (normal)</text>
        <circle cx="230" cy="6" r="8" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
        <text x="242" y="10" fill="var(--cwm-text-faint)" fontSize="9">Zone (attention)</text>
      </g>
    </svg>
  );
}

export default function DigitalTwinPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const zone = selectedZone ? ZONES.find(z => z.id === selectedZone) : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header-block">
        <div>
          <div className="page-title">Digital Twin</div>
          <div className="page-subtitle">Live GTSU digital twin · Network view</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--cwm-success-bg)', color: 'var(--cwm-success)', border: '1px solid var(--cwm-success-border)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cwm-success)' }} />Real-time
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)', minHeight: 420 }}>
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--cwm-border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--cwm-text)' }}>Live Network Map</span>
            <span className="text-[10px] ml-2" style={{ color: 'var(--cwm-text-faint)' }}>Click a zone to inspect</span>
          </div>
          <div className="p-2" style={{ height: 400 }}>
            <CityMap selectedZone={selectedZone} onSelectZone={setSelectedZone} />
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {zone ? (
            <div className="rounded-xl p-4" style={{ background: 'var(--cwm-panel)', border: `1px solid ${zone.color}55` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold" style={{ color: zone.color }}>{zone.id} Details</span>
                <button className="text-[10px]" style={{ color: 'var(--cwm-text-faint)' }} onClick={() => setSelectedZone(null)}>✕ Close</button>
              </div>
              {[['Zone',       zone.id], ['Fill Level', `${zone.fill}%`], ['Bins',       String(zone.bins)], ['Vehicles',   String(zone.vehicles)]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs py-2 border-b last:border-0" style={{ borderColor: 'var(--cwm-border)' }}>
                  <span style={{ color: 'var(--cwm-text-muted)' }}>{k}</span>
                  <span className="font-semibold" style={{ color: 'var(--cwm-text)' }}>{v}</span>
                </div>
              ))}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--cwm-text-muted)' }}>
                  <span>Avg fill level</span><span style={{ color: zone.color }}>{zone.fill}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${zone.fill}%`, background: zone.color }} /></div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
              <div className="text-3xl mb-2">🗺️</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--cwm-text)' }}>Select a Zone</div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--cwm-text-faint)' }}>Click any zone circle on the map to inspect it</div>
            </div>
          )}

          {/* Zone overview cards */}
          {ZONES.map(z => (
            <button key={z.id} onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{ background: selectedZone === z.id ? z.color + '18' : 'var(--cwm-panel)', border: `1px solid ${selectedZone === z.id ? z.color : 'var(--cwm-border)'}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: z.color }}>{z.id}</span>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: z.color + '22', color: z.color }}>{z.fill}% full</span>
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'var(--cwm-text-faint)' }}>{z.bins} bins · {z.vehicles} vehicles</div>
              <div className="progress-track mt-2"><div className="progress-fill" style={{ width: `${z.fill}%`, background: z.color }} /></div>
            </button>
          ))}

          {/* Facilities list */}
          <div className="rounded-xl p-3" style={{ background: 'var(--cwm-panel)', border: '1px solid var(--cwm-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--cwm-text-muted)' }}>Facilities</div>
            {FACILITIES.map(f => (
              <div key={f.type} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--cwm-border)' }}>
                <span className="text-base">{f.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--cwm-text)' }}>{f.label}</div>
                  <div className="text-[9px]" style={{ color: 'var(--cwm-text-faint)' }}>{f.type}</div>
                </div>
                <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cwm-success)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
