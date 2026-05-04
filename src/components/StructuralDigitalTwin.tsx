import { useState, useEffect } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

interface ComponentStress {
  id: string;
  name: string;
  stressLevel: number;
  fatigueLevel: number;
  status: 'normal' | 'warning' | 'critical';
}

interface StructuralDigitalTwinProps {
  components: ComponentStress[];
  title?: string;
}

export function StructuralDigitalTwin({
  components,
  title = "Structural Analysis Digital Twin"
}: StructuralDigitalTwinProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentStress | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getStressColor = (level: number) => {
    if (level > 85) return '#ef4444';
    if (level > 75) return '#f59e0b';
    if (level > 60) return '#fbbf24';
    return '#10b981';
  };

  const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 animate-pulse text-blue-500" />
          <span>FEA Analysis Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
            <svg
              viewBox="0 0 700 450"
              className="w-full h-full"
              style={{ minHeight: '350px' }}
            >
              <defs>
                <linearGradient id="stressGradientLow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="stressGradientMedium" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="stressGradientHigh" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.6 }} />
                </linearGradient>

                <filter id="stressGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                <pattern id="meshPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#374151" strokeWidth="0.5"/>
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#374151" strokeWidth="0.5"/>
                </pattern>
              </defs>

              <rect width="700" height="450" fill="url(#meshPattern)" opacity="0.3"/>

              <g id="compressorBlade">
                <path
                  d="M 100 180 Q 120 150 140 180 L 145 280 Q 120 290 95 280 Z"
                  fill={`url(#stressGradient${
                    components.find(c => c.id === 'compressorBlade')?.stressLevel! > 75 ? 'High' :
                    components.find(c => c.id === 'compressorBlade')?.stressLevel! > 60 ? 'Medium' : 'Low'
                  })`}
                  stroke={getStressColor(components.find(c => c.id === 'compressorBlade')?.stressLevel || 0)}
                  strokeWidth="2"
                  filter="url(#stressGlow)"
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setSelectedComponent(components.find(c => c.id === 'compressorBlade') || null)}
                  onMouseLeave={() => setSelectedComponent(null)}
                />
                <text x="105" y="320" fill="#94a3b8" fontSize="11" fontWeight="bold">Compressor</text>
                <text x="115" y="335" fill="#94a3b8" fontSize="11" fontWeight="bold">Blade</text>

                {components.find(c => c.id === 'compressorBlade')?.status !== 'normal' && (
                  <>
                    <circle
                      cx="120"
                      cy="160"
                      r={8 + (pulsePhase / 10)}
                      fill={getStatusColor(components.find(c => c.id === 'compressorBlade')?.status!)}
                      opacity={0.3 - (pulsePhase / 300)}
                    />
                    <circle cx="120" cy="160" r="6" fill={getStatusColor(components.find(c => c.id === 'compressorBlade')?.status!)}/>
                  </>
                )}
              </g>

              <g id="turbineBlade">
                <path
                  d="M 250 160 Q 270 130 290 160 L 295 300 Q 270 310 245 300 Z"
                  fill={`url(#stressGradient${
                    components.find(c => c.id === 'turbineBlade')?.stressLevel! > 75 ? 'High' :
                    components.find(c => c.id === 'turbineBlade')?.stressLevel! > 60 ? 'Medium' : 'Low'
                  })`}
                  stroke={getStressColor(components.find(c => c.id === 'turbineBlade')?.stressLevel || 0)}
                  strokeWidth="2"
                  filter="url(#stressGlow)"
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setSelectedComponent(components.find(c => c.id === 'turbineBlade') || null)}
                  onMouseLeave={() => setSelectedComponent(null)}
                />
                <text x="255" y="330" fill="#94a3b8" fontSize="11" fontWeight="bold">Turbine</text>
                <text x="265" y="345" fill="#94a3b8" fontSize="11" fontWeight="bold">Blade</text>

                {components.find(c => c.id === 'turbineBlade')?.status !== 'normal' && (
                  <>
                    <circle
                      cx="270"
                      cy="140"
                      r={8 + (pulsePhase / 10)}
                      fill={getStatusColor(components.find(c => c.id === 'turbineBlade')?.status!)}
                      opacity={0.3 - (pulsePhase / 300)}
                    />
                    <circle cx="270" cy="140" r="6" fill={getStatusColor(components.find(c => c.id === 'turbineBlade')?.status!)}/>
                  </>
                )}
              </g>

              <g id="combustionChamber">
                <rect
                  x="380"
                  y="170"
                  width="140"
                  height="130"
                  rx="10"
                  fill={`url(#stressGradient${
                    components.find(c => c.id === 'combustionChamber')?.stressLevel! > 75 ? 'High' :
                    components.find(c => c.id === 'combustionChamber')?.stressLevel! > 60 ? 'Medium' : 'Low'
                  })`}
                  stroke={getStressColor(components.find(c => c.id === 'combustionChamber')?.stressLevel || 0)}
                  strokeWidth="3"
                  filter="url(#stressGlow)"
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setSelectedComponent(components.find(c => c.id === 'combustionChamber') || null)}
                  onMouseLeave={() => setSelectedComponent(null)}
                />
                <text x="410" y="325" fill="#94a3b8" fontSize="11" fontWeight="bold">Combustion</text>
                <text x="425" y="340" fill="#94a3b8" fontSize="11" fontWeight="bold">Chamber</text>

                {components.find(c => c.id === 'combustionChamber')?.status !== 'normal' && (
                  <>
                    <circle
                      cx="450"
                      cy="160"
                      r={8 + (pulsePhase / 10)}
                      fill={getStatusColor(components.find(c => c.id === 'combustionChamber')?.status!)}
                      opacity={0.3 - (pulsePhase / 300)}
                    />
                    <circle cx="450" cy="160" r="6" fill={getStatusColor(components.find(c => c.id === 'combustionChamber')?.status!)}/>
                  </>
                )}
              </g>

              <g id="shaft">
                <rect
                  x="150"
                  y="225"
                  width="330"
                  height="15"
                  rx="7"
                  fill={`url(#stressGradient${
                    components.find(c => c.id === 'shaft')?.stressLevel! > 75 ? 'High' :
                    components.find(c => c.id === 'shaft')?.stressLevel! > 60 ? 'Medium' : 'Low'
                  })`}
                  stroke={getStressColor(components.find(c => c.id === 'shaft')?.stressLevel || 0)}
                  strokeWidth="2"
                  filter="url(#stressGlow)"
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setSelectedComponent(components.find(c => c.id === 'shaft') || null)}
                  onMouseLeave={() => setSelectedComponent(null)}
                />
                <text x="295" y="260" fill="#94a3b8" fontSize="11" fontWeight="bold">Shaft</text>

                {components.find(c => c.id === 'shaft')?.status !== 'normal' && (
                  <>
                    <circle
                      cx="315"
                      cy="210"
                      r={8 + (pulsePhase / 10)}
                      fill={getStatusColor(components.find(c => c.id === 'shaft')?.status!)}
                      opacity={0.3 - (pulsePhase / 300)}
                    />
                    <circle cx="315" cy="210" r="6" fill={getStatusColor(components.find(c => c.id === 'shaft')?.status!)}/>
                  </>
                )}
              </g>

              <g id="nozzle">
                <path
                  d="M 550 200 L 620 180 L 630 235 L 620 280 L 550 260 Z"
                  fill={`url(#stressGradient${
                    components.find(c => c.id === 'nozzle')?.stressLevel! > 75 ? 'High' :
                    components.find(c => c.id === 'nozzle')?.stressLevel! > 60 ? 'Medium' : 'Low'
                  })`}
                  stroke={getStressColor(components.find(c => c.id === 'nozzle')?.stressLevel || 0)}
                  strokeWidth="2"
                  filter="url(#stressGlow)"
                  className="cursor-pointer transition-all hover:opacity-80"
                  onMouseEnter={() => setSelectedComponent(components.find(c => c.id === 'nozzle') || null)}
                  onMouseLeave={() => setSelectedComponent(null)}
                />
                <text x="570" y="310" fill="#94a3b8" fontSize="11" fontWeight="bold">Nozzle</text>

                {components.find(c => c.id === 'nozzle')?.status !== 'normal' && (
                  <>
                    <circle
                      cx="585"
                      cy="190"
                      r={8 + (pulsePhase / 10)}
                      fill={getStatusColor(components.find(c => c.id === 'nozzle')?.status!)}
                      opacity={0.3 - (pulsePhase / 300)}
                    />
                    <circle cx="585" cy="190" r="6" fill={getStatusColor(components.find(c => c.id === 'nozzle')?.status!)}/>
                  </>
                )}
              </g>

              <g id="stressLegend" transform="translate(30, 370)">
                <text x="0" y="0" fill="#94a3b8" fontSize="10" fontWeight="bold">Stress Level:</text>
                <rect x="0" y="5" width="30" height="15" fill="#10b981" rx="2"/>
                <text x="35" y="16" fill="#94a3b8" fontSize="9">Low</text>
                <rect x="80" y="5" width="30" height="15" fill="#fbbf24" rx="2"/>
                <text x="115" y="16" fill="#94a3b8" fontSize="9">Medium</text>
                <rect x="170" y="5" width="30" height="15" fill="#f59e0b" rx="2"/>
                <text x="205" y="16" fill="#94a3b8" fontSize="9">High</text>
                <rect x="250" y="5" width="30" height="15" fill="#ef4444" rx="2"/>
                <text x="285" y="16" fill="#94a3b8" fontSize="9">Critical</text>
              </g>
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-semibold text-white mb-3">Stress Analysis</h4>
            <div className="space-y-2">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  className={`p-2 rounded border transition-all cursor-pointer ${
                    selectedComponent?.id === comp.id
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}
                  onMouseEnter={() => setSelectedComponent(comp)}
                  onMouseLeave={() => setSelectedComponent(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300 font-medium">{comp.name}</span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(comp.status) }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Stress:</span>
                        <span className="text-white font-semibold">{comp.stressLevel}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${comp.stressLevel}%`,
                            backgroundColor: getStressColor(comp.stressLevel)
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Fatigue:</span>
                        <span className="text-white font-semibold">{comp.fatigueLevel}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${comp.fatigueLevel}%`,
                            backgroundColor: getStressColor(comp.fatigueLevel)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedComponent && (
            <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
              <div className="flex items-start space-x-2">
                {selectedComponent.status !== 'normal' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Activity className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{selectedComponent.name}</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stress Level:</span>
                      <span className="text-white font-semibold">{selectedComponent.stressLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fatigue Level:</span>
                      <span className="text-white font-semibold">{selectedComponent.fatigueLevel}%</span>
                    </div>
                    <p className="text-gray-400 mt-2">
                      {selectedComponent.status === 'critical'
                        ? 'Critical stress detected - inspection required'
                        : selectedComponent.status === 'warning'
                        ? 'Elevated stress levels - monitor closely'
                        : 'Stress levels within acceptable range'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
