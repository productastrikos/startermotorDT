import { useState } from "react";
import { Activity, Box, AlertTriangle, Shield, TrendingDown, Brain, Layers } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { Suspense } from "react";

interface FailureModeRegion {
  id: string;
  name: string;
  failureMode: string;
  rpn: number;
  severity: number;
  occurrence: number;
  detection: number;
  status: "low" | "medium" | "high" | "critical";
  position: [number, number, number];
}

interface FMEAKPIMetric {
  label: string;
  value: number;
  target: number;
  status: "normal" | "warning" | "critical";
}

interface FMEALayer {
  id: string;
  name: string;
  active: boolean;
  description: string;
}

interface FMEADigitalTwinProps {
  modelPath: string;
  title?: string;
  onFailureModeClick?: (region: FailureModeRegion) => void;
}

export function FMEADigitalTwin({ modelPath, title = "FMEA Digital Twin - Risk Analysis", onFailureModeClick }: FMEADigitalTwinProps) {
  const [activeLayers, setActiveLayers] = useState<string[]>(["rpn"]);
  const [selectedRegion, setSelectedRegion] = useState<FailureModeRegion | null>(null);
  const [showMitigation, setShowMitigation] = useState(false);

  const layers: FMEALayer[] = [
    { id: "rpn", name: "RPN Heatmap", active: activeLayers.includes("rpn"), description: "Risk Priority Number distribution" },
    { id: "severity", name: "Severity Map", active: activeLayers.includes("severity"), description: "Failure severity ratings" },
    { id: "occurrence", name: "Occurrence Map", active: activeLayers.includes("occurrence"), description: "Failure probability" },
    { id: "detection", name: "Detection Map", active: activeLayers.includes("detection"), description: "Detection capability" },
  ];

  const kpiMetrics: FMEAKPIMetric[] = [
    { label: "Highest RPN", value: 168, target: 100, status: "critical" },
    { label: "Avg RPN", value: 133, target: 80, status: "warning" },
    { label: "Critical Failures", value: 2, target: 0, status: "critical" },
    { label: "Avg Detection", value: 3.6, target: 2.0, status: "warning" },
  ];

  // const failureModeRegions: FailureModeRegion[] = [
  //   {
  //     id: "fm-fuel-nozzle",
  //     name: "Fuel Nozzle",
  //     failureMode: "Clogging/Flow Restriction",
  //     rpn: 168,
  //     severity: 6,
  //     occurrence: 7,
  //     detection: 4,
  //     status: "critical",
  //   },
  //   {
  //     id: "fm-combustion-liner",
  //     name: "Combustion Liner",
  //     failureMode: "TBC Spallation",
  //     rpn: 160,
  //     severity: 8,
  //     occurrence: 4,
  //     detection: 5,
  //     status: "critical",
  //   },
  //   {
  //     id: "fm-compressor-blade",
  //     name: "Compressor Blade",
  //     failureMode: "High Cycle Fatigue",
  //     rpn: 135,
  //     severity: 9,
  //     occurrence: 5,
  //     detection: 3,
  //     status: "high",
  //   },
  //   {
  //     id: "fm-turbine-blade",
  //     name: "Turbine Blade",
  //     failureMode: "Thermal Creep",
  //     rpn: 120,
  //     severity: 10,
  //     occurrence: 3,
  //     detection: 4,
  //     status: "high",
  //   },
  //   {
  //     id: "fm-bearing",
  //     name: "Bearing Assembly",
  //     failureMode: "Rolling Element Wear",
  //     rpn: 84,
  //     severity: 7,
  //     occurrence: 6,
  //     detection: 2,
  //     status: "medium",
  //   },
  // ];
  const failureModeRegions: FailureModeRegion[] = [
    {
      id: "fm-turbine-blade",
      name: "Fan Blade",
      failureMode: "Surface Defect",
      rpn: 120,
      severity: 10,
      occurrence: 3,
      detection: 4,
      status: "high",
      position: [-8, 5, 2],
    },

    {
      id: "fm-compressor-blade",
      name: "Compressor Blade",
      failureMode: "High Cycle Fatigue",
      rpn: 135,
      severity: 9,
      occurrence: 5,
      detection: 3,
      status: "high",
      position: [-6, 5, 0.8],
    },

    {
      id: "fm-bearing",
      name: "Combustor",
      failureMode: "Rolling Element Wear",
      rpn: 84,
      severity: 7,
      occurrence: 6,
      detection: 2,
      status: "medium",
      position: [-1, 5, 3],
    },
    {
      id: "fm-combustion-liner",
      name: "Turbine Blade",
      failureMode: "Thermal Creep ",
      rpn: 160,
      severity: 8,
      occurrence: 4,
      detection: 5,
      status: "critical",
      position: [4, 5, 0],
    },
    {
      id: "fm-fuel-nozzle",
      name: "Fuel Nozzle",
      failureMode: "Clogging",
      rpn: 147,
      severity: 7,
      occurrence: 7,
      detection: 3,
      status: "Warning",
      position: [8, 5, 0],
    },
  ];

  const toggleLayer = (layerId: string) => {
    setActiveLayers((prev) => (prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]));
  };

  const getRPNColor = (rpn: number): string => {
    if (rpn >= 150) return "#dc2626";
    if (rpn >= 100) return "#f59e0b";
    if (rpn >= 50) return "#fbbf24";
    return "#10b981";
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "critical":
        return "Critical Risk";
      case "high":
        return "High Risk";
      case "medium":
        return "Medium Risk";
      default:
        return "Low Risk";
    }
  };

  const handleRegionClick = (region: FailureModeRegion) => {
    setSelectedRegion(region);
    if (onFailureModeClick) {
      onFailureModeClick(region);
    }
  };
  function Model({ modelPath }: { modelPath: string }) {
    const { scene } = useGLTF(modelPath);
    return <primitive object={scene} scale={1.5} position={[0, 0, 0]} />;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-400">Identifies potential failures and calculates RPN based on severity, occurrence, and detection</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
            {/* <span className="text-sm text-gray-400">Risk Monitoring</span> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 relative" style={{ height: "500px" }}>
            <div id="fmeadigitaltwin-container" className="w-full h-full flex items-center justify-center relative">
              <Suspense fallback={<p className="text-gray-500 text-sm">Loading 3D model...</p>}>
                <Canvas camera={{ position: [0, 0, 8], fov: 120 }}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <pointLight position={[-5, 5, 5]} intensity={0.5} />
                  <Model modelPath={modelPath} />
                  {failureModeRegions.map((region) => (
                    <group key={region.id} position={region.position}>
                      {/* <mesh
                        position={[0, 0, 0]}
                        scale={[1, 1, 1]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegionClick(region);
                        }}
                      >
                        <sphereGeometry args={[region.rpn / 25 + 0.1, 16, 16]} />
                        <meshBasicMaterial
                          color="white"
                          transparent
                          opacity={0}
                          depthWrite={false} // 👈 important
                        />
                      </mesh>

                     
                      <Html center distanceFactor={20}>
                        <div className="text-center text-white font-bold text-xs">
                          {region.name} <br />
                          <span style={{ color: getRPNColor(region.rpn) }}>RPN: {region.rpn}</span>
                        </div>
                      </Html>

                     
                      <mesh position={[0, 0, 0]} scale={[1, 1, 1]} onClick={() => handleRegionClick(region)}>
                        <sphereGeometry args={[region.rpn / 25 + 0.1, 16, 16]} />
                        <meshBasicMaterial transparent opacity={0} />
                      </mesh> */}
                      <mesh
                        position={[0, 0, 0]}
                        scale={[1, 1, 1]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegionClick(region);
                        }}
                      >
                        {/* <sphereGeometry args={[region.rpn / 25 + 0.1, 16, 16]} /> */}
                        <sphereGeometry args={[region.rpn / 150 + 0.1, 16, 16]} />
                        {/* <meshBasicMaterial
                          color={getRPNColor(region.rpn)} // visible color (optional)
                          transparent
                          opacity={0.5} // low opacity so you can still see through
                        /> */}
                        <meshBasicMaterial color={getRPNColor(region.rpn)} transparent opacity={0.6} depthWrite={false} depthTest={true} />
                      </mesh>

                      {/* <Html center distanceFactor={20}>
                        <div className="text-center text-white font-bold text-xs">
                          {region.name} <br />
                          <span style={{ color: getRPNColor(region.rpn) }}>RPN: {region.rpn}</span>
                        </div>
                      </Html> */}
                      <Html center distanceFactor={20} portal={{ current: document.querySelector("#fmeadigitaltwin-container") }}>
                        <div
                          className="font-semibold text-center"
                          style={{
                            fontSize: "8px", // fixed readable size
                            lineHeight: "1.2",
                            color: "white",
                            background: "rgba(0,0,0,0.3)",

                            borderRadius: "2px",
                            pointerEvents: "none",
                          }}
                        >
                          {region.name} <br />
                          <span style={{ color: getRPNColor(region.rpn), fontWeight: 700 }}>RPN: {region.rpn}</span>
                        </div>
                      </Html>
                    </group>
                  ))}

                  {/* <OrbitControls enablePan enableZoom enableRotate /> */}
                  <OrbitControls makeDefault enablePan enableZoom enableRotate />
                </Canvas>
              </Suspense>
            </div>

            <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-red-600 rounded" />
                  <span className="text-gray-400">Critical (RPN &gt; 160)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span className="text-gray-400">Warning (RPN 80-159)</span>
                </div>
                {/* <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-400 rounded" />
                  <span className="text-gray-400">Medium (RPN 50-100)</span>
                </div> */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-gray-400">Low (RPN &lt; 80)</span>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiMetrics.map((kpi) => (
              <div key={kpi.label} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <div className="flex items-baseline space-x-2">
                  <span
                    className={`text-2xl font-bold ${
                      kpi.status === "critical" ? "text-red-500" : kpi.status === "warning" ? "text-amber-500" : "text-green-500"
                    }`}
                  >
                    {kpi.value.toFixed(kpi.label.includes("Avg") ? 1 : 0)}
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                  <TrendingDown className="w-3 h-3" />
                  <span>Target: {kpi.target}</span>
                </div>
              </div>
            ))}
          </div> */}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-semibold text-white">Failure Modes</h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {failureModeRegions.map((region) => (
                <div
                  key={region.id}
                  onClick={() => handleRegionClick(region)}
                  className={`p-2 border rounded cursor-pointer transition-all ${
                    selectedRegion?.id === region.id ? "bg-gray-800 border-gray-600" : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{region.name}</span>
                    <span className={`text-lg font-bold`} style={{ color: getRPNColor(region.rpn) }}>
                      {region.rpn}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{region.failureMode}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>S:{region.severity}</span>
                    <span>O:{region.occurrence}</span>
                    <span>D:{region.detection}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRegion && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-semibold text-white">Selected Failure</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{selectedRegion.name}</p>
                  <p className="text-xs text-gray-400">{selectedRegion.failureMode}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-xs text-gray-400">Severity</p>
                    <p className="text-xl font-bold text-blue-500">{selectedRegion.severity}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-xs text-gray-400">Occurrence</p>
                    <p className="text-xl font-bold text-blue-500">{selectedRegion.occurrence}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-xs text-gray-400">Detection</p>
                    <p className="text-xl font-bold text-blue-500">{selectedRegion.detection}</p>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded p-2">
                    <p className="text-xs text-gray-400">RPN</p>
                    <p className="text-xl font-bold" style={{ color: getRPNColor(selectedRegion.rpn) }}>
                      {selectedRegion.rpn}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      selectedRegion.status === "critical"
                        ? "bg-red-500/20 text-red-400"
                        : selectedRegion.status === "high"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {getStatusLabel(selectedRegion.status)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-500/10 to-orange-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-1">AI Recommendations</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Focus on top 1 failure modes: Install inline fuel filtration to reduce nozzle clogging RPN from 168 to 42. Deploy AI borescope
                  analysis for combustion liner to reduce RPN from 160 to 64.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
