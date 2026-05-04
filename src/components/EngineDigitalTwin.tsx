// import { useState, useEffect } from 'react';
// import { Activity, AlertCircle } from 'lucide-react';

// interface ComponentStatus {
//   id: string;
//   name: string;
//   status: 'normal' | 'warning' | 'critical';
//   temperature: number;
//   efficiency: number;
// }

// interface EngineDigitalTwinProps {
//   components: ComponentStatus[];
//   showTemperature?: boolean;
//   showEfficiency?: boolean;
//   title?: string;
// }

// export function EngineDigitalTwin({
//   components,
//   showTemperature = true,
//   showEfficiency = true,
//   title = "Engine Digital Twin"
// }: EngineDigitalTwinProps) {
//   const [selectedComponent, setSelectedComponent] = useState<ComponentStatus | null>(null);
//   const [animationPhase, setAnimationPhase] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setAnimationPhase(prev => (prev + 1) % 360);
//     }, 50);
//     return () => clearInterval(interval);
//   }, []);

//   const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
//     switch (status) {
//       case 'critical': return '#ef4444';
//       case 'warning': return '#f59e0b';
//       default: return '#10b981';
//     }
//   };

//   const getComponentPosition = (id: string) => {
//     const positions: Record<string, { x: number; y: number; angle: number }> = {
//       intake: { x: 50, y: 200, angle: 0 },
//       compressor: { x: 150, y: 200, angle: animationPhase },
//       combustor: { x: 300, y: 200, angle: 0 },
//       turbine: { x: 450, y: 200, angle: -animationPhase },
//       nozzle: { x: 600, y: 200, angle: 0 },
//       shaft: { x: 300, y: 200, angle: animationPhase / 2 },
//     };
//     return positions[id] || { x: 0, y: 0, angle: 0 };
//   };

//   return (
//     <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold text-white">{title}</h3>
//         <div className="flex items-center space-x-2 text-sm text-gray-400">
//           <Activity className="w-4 h-4 animate-pulse text-green-500" />
//           <span>Live Monitoring</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <div className="lg:col-span-2">
//           <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
//             <svg
//               viewBox="0 0 700 400"
//               className="w-full h-full"
//               style={{ minHeight: '300px' }}
//             >
//               <defs>
//                 <linearGradient id="engineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
//                   <stop offset="0%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
//                   <stop offset="50%" style={{ stopColor: '#334155', stopOpacity: 1 }} />
//                   <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
//                 </linearGradient>

//                 <filter id="glow">
//                   <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
//                   <feMerge>
//                     <feMergeNode in="coloredBlur"/>
//                     <feMergeNode in="SourceGraphic"/>
//                   </feMerge>
//                 </filter>

//                 <radialGradient id="flameGradient">
//                   <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
//                   <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
//                   <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.3 }} />
//                 </radialGradient>
//               </defs>

//               <path
//                 d="M 40 180 L 100 150 L 200 160 L 250 200 L 200 240 L 100 250 Z"
//                 fill="url(#engineGradient)"
//                 stroke="#475569"
//                 strokeWidth="2"
//                 opacity="0.8"
//               />
//               <text x="70" y="205" fill="#94a3b8" fontSize="12" fontWeight="bold">Intake</text>

//               <g transform={`translate(150, 200)`}>
//                 <circle
//                   cx="0"
//                   cy="0"
//                   r="50"
//                   fill="url(#engineGradient)"
//                   stroke={getStatusColor(components.find(c => c.id === 'compressor')?.status || 'normal')}
//                   strokeWidth="3"
//                   filter="url(#glow)"
//                 />
//                 {[0, 60, 120, 180, 240, 300].map((angle) => {
//                   const rad = ((angle + animationPhase) * Math.PI) / 180;
//                   const x1 = Math.cos(rad) * 20;
//                   const y1 = Math.sin(rad) * 20;
//                   const x2 = Math.cos(rad) * 45;
//                   const y2 = Math.sin(rad) * 45;
//                   return (
//                     <line
//                       key={angle}
//                       x1={x1}
//                       y1={y1}
//                       x2={x2}
//                       y2={y2}
//                       stroke="#64748b"
//                       strokeWidth="3"
//                       strokeLinecap="round"
//                     />
//                   );
//                 })}
//                 <text x="-35" y="75" fill="#94a3b8" fontSize="12" fontWeight="bold">Compressor</text>
//               </g>

//               <rect
//                 x="250"
//                 y="160"
//                 width="100"
//                 height="80"
//                 fill="url(#engineGradient)"
//                 stroke={getStatusColor(components.find(c => c.id === 'combustor')?.status || 'normal')}
//                 strokeWidth="3"
//                 rx="5"
//                 filter="url(#glow)"
//               />
//               <circle
//                 cx="300"
//                 cy="200"
//                 r={15 + Math.sin(animationPhase * 0.1) * 5}
//                 fill="url(#flameGradient)"
//                 opacity={0.6 + Math.sin(animationPhase * 0.1) * 0.2}
//               />
//               {[...Array(6)].map((_, i) => {
//                 const offsetX = Math.sin((animationPhase + i * 60) * 0.05) * 10;
//                 const offsetY = Math.sin((animationPhase + i * 30) * 0.08) * 8;
//                 return (
//                   <circle
//                     key={i}
//                     cx={300 + offsetX}
//                     cy={200 + offsetY}
//                     r={3 + Math.sin((animationPhase + i * 45) * 0.1) * 2}
//                     fill="#fbbf24"
//                     opacity={0.5 + Math.sin((animationPhase + i * 30) * 0.1) * 0.3}
//                   />
//                 );
//               })}
//               <text x="265" y="260" fill="#94a3b8" fontSize="12" fontWeight="bold">Combustor</text>

//               <g transform={`translate(450, 200)`}>
//                 <circle
//                   cx="0"
//                   cy="0"
//                   r="50"
//                   fill="url(#engineGradient)"
//                   stroke={getStatusColor(components.find(c => c.id === 'turbine')?.status || 'normal')}
//                   strokeWidth="3"
//                   filter="url(#glow)"
//                 />
//                 {[0, 90, 180, 270].map((angle) => {
//                   const rad = ((-animationPhase + angle) * Math.PI) / 180;
//                   const x1 = Math.cos(rad) * 15;
//                   const y1 = Math.sin(rad) * 15;
//                   const x2 = Math.cos(rad) * 48;
//                   const y2 = Math.sin(rad) * 48;
//                   const xMid = Math.cos(rad) * 35;
//                   const yMid = Math.sin(rad) * 35;
//                   const perpRad = rad + Math.PI / 2;
//                   const xCurve = xMid + Math.cos(perpRad) * 10;
//                   const yCurve = yMid + Math.sin(perpRad) * 10;

//                   return (
//                     <path
//                       key={angle}
//                       d={`M ${x1} ${y1} Q ${xCurve} ${yCurve} ${x2} ${y2}`}
//                       fill="none"
//                       stroke="#64748b"
//                       strokeWidth="4"
//                       strokeLinecap="round"
//                     />
//                   );
//                 })}
//                 <text x="-25" y="75" fill="#94a3b8" fontSize="12" fontWeight="bold">Turbine</text>
//               </g>

//               <path
//                 d="M 500 180 L 600 150 L 660 160 L 680 200 L 660 240 L 600 250 Z"
//                 fill="url(#engineGradient)"
//                 stroke="#475569"
//                 strokeWidth="2"
//                 opacity="0.8"
//               />
//               <text x="580" y="205" fill="#94a3b8" fontSize="12" fontWeight="bold">Nozzle</text>

//               <line
//                 x1="150"
//                 y1="200"
//                 x2="450"
//                 y2="200"
//                 stroke="#64748b"
//                 strokeWidth="6"
//                 strokeDasharray={`${animationPhase % 20} 10`}
//                 opacity="0.3"
//               />

//               {[100, 200, 300, 400, 500, 600].map((x, i) => {
//                 const flowY = 200 + Math.sin((animationPhase + i * 30) * 0.1) * 15;
//                 return (
//                   <circle
//                     key={i}
//                     cx={x + (animationPhase % 50)}
//                     cy={flowY}
//                     r="2"
//                     fill="#3b82f6"
//                     opacity="0.6"
//                   />
//                 );
//               })}

//               {components.map((comp) => {
//                 const pos = getComponentPosition(comp.id);
//                 if (comp.status === 'critical' || comp.status === 'warning') {
//                   return (
//                     <g key={`alert-${comp.id}`}>
//                       <circle
//                         cx={pos.x}
//                         cy={pos.y - 70}
//                         r="12"
//                         fill={getStatusColor(comp.status)}
//                         opacity="0.2"
//                         className="animate-ping"
//                       />
//                       <circle
//                         cx={pos.x}
//                         cy={pos.y - 70}
//                         r="8"
//                         fill={getStatusColor(comp.status)}
//                       />
//                       <text
//                         x={pos.x}
//                         y={pos.y - 67}
//                         fill="white"
//                         fontSize="12"
//                         textAnchor="middle"
//                         fontWeight="bold"
//                       >
//                         !
//                       </text>
//                     </g>
//                   );
//                 }
//                 return null;
//               })}

//               {components.map((comp) => {
//                 const pos = getComponentPosition(comp.id);
//                 return (
//                   <rect
//                     key={`hitbox-${comp.id}`}
//                     x={pos.x - 40}
//                     y={pos.y - 40}
//                     width="80"
//                     height="80"
//                     fill="transparent"
//                     className="cursor-pointer"
//                     onMouseEnter={() => setSelectedComponent(comp)}
//                     onMouseLeave={() => setSelectedComponent(null)}
//                   />
//                 );
//               })}
//             </svg>
//           </div>
//         </div>

//         <div className="space-y-3">
//           <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
//             <h4 className="text-sm font-semibold text-white mb-3">Component Status</h4>
//             <div className="space-y-2">
//               {components.map((comp) => (
//                 <div
//                   key={comp.id}
//                   className={`p-2 rounded border transition-all cursor-pointer ${
//                     selectedComponent?.id === comp.id
//                       ? 'bg-gray-800 border-gray-600'
//                       : 'bg-gray-900/50 border-gray-800'
//                   }`}
//                   onMouseEnter={() => setSelectedComponent(comp)}
//                   onMouseLeave={() => setSelectedComponent(null)}
//                 >
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs text-gray-300 font-medium">{comp.name}</span>
//                     <div
//                       className="w-2 h-2 rounded-full"
//                       style={{ backgroundColor: getStatusColor(comp.status) }}
//                     />
//                   </div>
//                   {selectedComponent?.id === comp.id && (
//                     <div className="mt-2 space-y-1">
//                       {showTemperature && (
//                         <div className="flex justify-between text-xs">
//                           <span className="text-gray-500">Temperature:</span>
//                           <span className="text-white font-semibold">{comp.temperature}°C</span>
//                         </div>
//                       )}
//                       {showEfficiency && (
//                         <div className="flex justify-between text-xs">
//                           <span className="text-gray-500">Efficiency:</span>
//                           <span className="text-white font-semibold">{comp.efficiency}%</span>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {selectedComponent && (
//             <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
//               <div className="flex items-start space-x-2">
//                 {selectedComponent.status !== 'normal' ? (
//                   <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                 ) : (
//                   <Activity className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
//                 )}
//                 <div>
//                   <h4 className="text-sm font-semibold text-white mb-1">{selectedComponent.name}</h4>
//                   <p className="text-xs text-gray-400">
//                     {selectedComponent.status === 'critical'
//                       ? 'Critical condition - immediate attention required'
//                       : selectedComponent.status === 'warning'
//                       ? 'Warning - monitor closely'
//                       : 'Operating within normal parameters'}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // import { useState, useEffect } from 'react';
// // import { Activity, AlertCircle } from 'lucide-react';
// // import { Canvas } from '@react-three/fiber';
// // import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

// // interface ComponentStatus {
// //   id: string;
// //   name: string;
// //   status: 'normal' | 'warning' | 'critical';
// //   temperature: number;
// //   efficiency: number;
// // }

// // interface EngineDigitalTwinProps {
// //   components: ComponentStatus[];
// //   showTemperature?: boolean;
// //   showEfficiency?: boolean;
// //   title?: string;
// //   modelUrl?: string; // URL to the 3D model (GLB/GLTF)
// // }

// // function EngineModel({ modelUrl }: { modelUrl: string }) {
// //   const { scene } = useGLTF(modelUrl);
// //   return <primitive object={scene} scale={0.5} />;
// // }

// // export function EngineDigitalTwin({
// //   components,
// //   showTemperature = true,
// //   showEfficiency = true,
// //   title = "Engine Digital Twin",
// //   modelUrl = "/Engine.gltf" // default path to your 3D model
// // }: EngineDigitalTwinProps) {
// //   const [selectedComponent, setSelectedComponent] = useState<ComponentStatus | null>(null);

// //   const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
// //     switch (status) {
// //       case 'critical': return '#ef4444';
// //       case 'warning': return '#f59e0b';
// //       default: return '#10b981';
// //     }
// //   };

// //   return (
// //     <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
// //       <div className="flex items-center justify-between mb-4">
// //         <h3 className="text-lg font-semibold text-white">{title}</h3>
// //         <div className="flex items-center space-x-2 text-sm text-gray-400">
// //           <Activity className="w-4 h-4 animate-pulse text-green-500" />
// //           <span>Live Monitoring</span>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
// //         {/* 3D Engine Viewer */}
// //         <div className="lg:col-span-2 bg-gray-950 rounded-lg p-4 border border-gray-800 h-[400px]">
// //           <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
// //             <ambientLight intensity={0.5} />
// //             <directionalLight position={[5, 5, 5]} intensity={1} />
// //             <Stage environment="city" intensity={0.7}>
// //               <EngineModel modelUrl={modelUrl} />
// //             </Stage>
// //             <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
// //           </Canvas>
// //         </div>

// //         {/* Component Status Panel */}
// //         <div className="space-y-3">
// //           <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
// //             <h4 className="text-sm font-semibold text-white mb-3">Component Status</h4>
// //             <div className="space-y-2">
// //               {components.map((comp) => (
// //                 <div
// //                   key={comp.id}
// //                   className={`p-2 rounded border transition-all cursor-pointer ${
// //                     selectedComponent?.id === comp.id
// //                       ? 'bg-gray-800 border-gray-600'
// //                       : 'bg-gray-900/50 border-gray-800'
// //                   }`}
// //                   onMouseEnter={() => setSelectedComponent(comp)}
// //                   onMouseLeave={() => setSelectedComponent(null)}
// //                 >
// //                   <div className="flex items-center justify-between">
// //                     <span className="text-xs text-gray-300 font-medium">{comp.name}</span>
// //                     <div
// //                       className="w-2 h-2 rounded-full"
// //                       style={{ backgroundColor: getStatusColor(comp.status) }}
// //                     />
// //                   </div>
// //                   {selectedComponent?.id === comp.id && (
// //                     <div className="mt-2 space-y-1">
// //                       {showTemperature && (
// //                         <div className="flex justify-between text-xs">
// //                           <span className="text-gray-500">Temperature:</span>
// //                           <span className="text-white font-semibold">{comp.temperature}°C</span>
// //                         </div>
// //                       )}
// //                       {showEfficiency && (
// //                         <div className="flex justify-between text-xs">
// //                           <span className="text-gray-500">Efficiency:</span>
// //                           <span className="text-white font-semibold">{comp.efficiency}%</span>
// //                         </div>
// //                       )}
// //                     </div>
// //                   )}
// //                 </div>
// //               ))}
// //             </div>
// //           </div>

// //           {selectedComponent && (
// //             <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
// //               <div className="flex items-start space-x-2">
// //                 {selectedComponent.status !== 'normal' ? (
// //                   <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
// //                 ) : (
// //                   <Activity className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
// //                 )}
// //                 <div>
// //                   <h4 className="text-sm font-semibold text-white mb-1">{selectedComponent.name}</h4>
// //                   <p className="text-xs text-gray-400">
// //                     {selectedComponent.status === 'critical'
// //                       ? 'Critical condition - immediate attention required'
// //                       : selectedComponent.status === 'warning'
// //                       ? 'Warning - monitor closely'
// //                       : 'Operating within normal parameters'}
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

import { useState, Suspense } from "react";

import { Activity, AlertCircle } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";

interface ComponentStatus {
  id: string;
  name: string;
  status: "normal" | "warning" | "critical";
  temperature: number;
  efficiency: number;
  position?: [number, number, number]; // optional for 3D placement
}

interface EngineDigitalTwinProps {
  components?: ComponentStatus[];
  showTemperature?: boolean;
  showEfficiency?: boolean;
  title?: string;
  modelUrl?: string; // URL to the 3D model (GLB/GLTF)
}

// Engine model with hoverable invisible boxes
function EngineModel({ modelUrl, components }: { modelUrl: string; components: ComponentStatus[] }) {
  const { scene } = useGLTF(modelUrl);
  const [hovered, setHovered] = useState<ComponentStatus | null>(null);

  return (
    <>
      <primitive object={scene} scale={0.5} />

      {components.map((comp) => (
        <mesh key={comp.id} position={comp.position ?? [0, 0, 0]} onPointerOver={() => setHovered(comp)} onPointerOut={() => setHovered(null)}>
          {/* Invisible box for hover */}
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
          {/* <meshBasicMaterial color="orange" opacity={0.5} transparent /> */}
        </mesh>
      ))}

      {hovered && (
        <Html
          position={hovered.position ?? [0, 0, 0]}
          center
          style={{
            background: "rgba(0,0,0,0.7)",
            padding: "4px 8px",
            borderRadius: "4px",
            color: "white",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {/* {`${hovered.name} | Temp: ${hovered.temperature}°C | Eff: ${hovered.efficiency}% | Status: ${hovered.status}`} */}
          <div>{hovered.name}</div>
          <div>Temp: {hovered.temperature}°C</div>
          <div>Eff: {hovered.efficiency}%</div>
          <div>Status: {hovered.status}</div>
        </Html>
      )}
    </>
  );
}

export function EngineDigitalTwin({
  components = [],
  showTemperature = true,
  showEfficiency = true,
  title = "GTSU-110 Digital Twin",
  modelUrl = "/turbine.glb",
}: EngineDigitalTwinProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentStatus | null>(null);

  const getStatusColor = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "critical":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 animate-pulse text-green-500" />
          {/* <span>Live Monitoring</span> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D Engine Viewer */}
        {/* <div className="lg:col-span-2 bg-white rounded-lg p-4 border border-gray-800 h-[400px]"> */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-800 h-[400px]">
          {/* <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Stage environment={null} intensity={0.7}>
              <EngineModel modelUrl={modelUrl} components={components} />
            </Stage>
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas> */}
          <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Suspense fallback={null}>
              <Stage environment={null} intensity={0.7}>
                <EngineModel modelUrl={modelUrl} components={components} />
              </Stage>
            </Suspense>
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
        </div>

        {/* Component Status Panel */}
        <div className="space-y-3">
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-semibold text-white mb-3">Component Status</h4>
            <div className="space-y-2">
              {components.map((comp, index) => (
                <div
                  key={`${comp.id}-${index}`}
                  className={`p-2 rounded border transition-all cursor-pointer ${
                    selectedComponent?.id === comp.id ? "bg-gray-800 border-gray-600" : "bg-gray-900/50 border-gray-800"
                  }`}
                  onMouseEnter={() => setSelectedComponent(comp)}
                  onMouseLeave={() => setSelectedComponent(null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">{comp.name}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(comp.status) }} />
                  </div>
                  {selectedComponent?.id === comp.id && (
                    <div className="mt-2 space-y-1">
                      {showTemperature && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Temperature:</span>
                          <span className="text-white font-semibold">{comp.temperature}°C</span>
                        </div>
                      )}
                      {showEfficiency && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Efficiency:</span>
                          <span className="text-white font-semibold">{comp.efficiency}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedComponent && (
            <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
              <div className="flex items-start space-x-2">
                {selectedComponent.status !== "normal" ? (
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Activity className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{selectedComponent.name}</h4>
                  <p className="text-xs text-gray-400">
                    {selectedComponent.status === "critical"
                      ? "Critical condition - immediate attention required"
                      : selectedComponent.status === "warning"
                      ? "Warning - monitor closely"
                      : "Operating within normal parameters"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
