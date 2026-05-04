import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { Activity, Box, Layers, Play, Square, AlertTriangle, Brain, TrendingUp } from "lucide-react";

interface FEALayer {
  id: string;
  name: string;
  active: boolean;
  color: string;
}

interface FEAKPIMetric {
  label: string;
  value: number;
  unit: string;
  target: number;
  status: "normal" | "warning" | "critical";
}

// interface ComponentRegion {
//   id: string;
//   name: string;
//   stress: number;
//   strain: number;
//   displacement: number;
//   safetyFactor: number;
//   temperature: number;
//   position: [number, number, number];
// }
interface ComponentRegion {
  id: string;
  name: string;
  stress: number;
  strain: number;
  displacement: number;
  safetyFactor: number;
  temperature: number;
  position: [number, number, number];
  material?: string;
  operatingTempRange?: [number, number];
  stressRange?: [number, number];
  notes?: string;
}
interface ScenarioParameter {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
}

interface FEADigitalTwinProps {
  modelPath: string;
  title?: string;
  onRegionClick?: (region: ComponentRegion) => void;
}

export function FEADigitalTwin({ modelPath, title = "FEA Digital Twin - Structural Analysis", onRegionClick }: FEADigitalTwinProps) {
  const [activeLayers, setActiveLayers] = useState<string[]>(["stress"]);
  const [selectedRegion, setSelectedRegion] = useState<ComponentRegion | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [scenarioParams, setScenarioParams] = useState<ScenarioParameter[]>([
    { id: "rpm", label: "RPM", value: 15000, unit: "", min: 5000, max: 20000, step: 500 },
    { id: "temperature", label: "Temperature", value: 600, unit: "°C", min: 200, max: 1000, step: 50 },
    { id: "load", label: "Load", value: 5000, unit: "N", min: 1000, max: 10000, step: 500 },
  ]);

  const layers: FEALayer[] = [
    { id: "stress", name: "Von Mises Stress", active: activeLayers.includes("stress"), color: "#ef4444" },
    { id: "strain", name: "Principal Strain", active: activeLayers.includes("strain"), color: "#f59e0b" },
    { id: "displacement", name: "Displacement", active: activeLayers.includes("displacement"), color: "#3b82f6" },
    { id: "safety", name: "Safety Factor", active: activeLayers.includes("safety"), color: "#10b981" },
    { id: "fatigue", name: "Fatigue Life", active: activeLayers.includes("fatigue"), color: "#8b5cf6" },
  ];

  const kpiMetrics: FEAKPIMetric[] = [
    { label: "Max Stress", value: 820, unit: "MPa", target: 750, status: "critical" },
    { label: "Max Strain", value: 0.0074, unit: "mm/mm", target: 0.0065, status: "warning" },
    { label: "Safety Factor", value: 1.38, unit: "", target: 1.8, status: "critical" },
    { label: "Mesh Quality", value: 0.42, unit: "", target: 0.6, status: "warning" },
  ];

  // const componentRegions: ComponentRegion[] = [
  //   {
  //     id: "fan-blades",
  //     name: "Fan Blades",
  //     stress: 720,
  //     strain: 0.0065,
  //     displacement: 3.0,
  //     safetyFactor: 1.5,
  //     temperature: 350,
  //     position: [-110, 50, 10],
  //   },
  //   {
  //     id: "fan-disk",
  //     name: "Fan Disk",
  //     stress: 650,
  //     strain: 0.0058,
  //     displacement: 2.2,
  //     safetyFactor: 1.7,
  //     temperature: 360,
  //     position: [-110, 90, 0],
  //   },
  //   {
  //     id: "compressor-blades",
  //     name: "Compressor Blades",
  //     stress: 780,
  //     strain: 0.0072,
  //     displacement: 2.5,
  //     safetyFactor: 1.4,
  //     temperature: 600,
  //     position: [-90, 70, 20],
  //   },
  //   {
  //     id: "compressor-disk",
  //     name: "Compressor Disk",
  //     stress: 740,
  //     strain: 0.0068,
  //     displacement: 2.1,
  //     safetyFactor: 1.45,
  //     temperature: 620,
  //     position: [-80, 80, 20],
  //   },
  //   {
  //     id: "turbine-blades",
  //     name: "Turbine Blades",
  //     stress: 400,
  //     strain: 0.0078,
  //     displacement: 3.3,
  //     safetyFactor: 1.35,
  //     temperature: 1000,
  //     position: [45, 80, 30],
  //   },
  //   {
  //     id: "turbine-disk",
  //     name: "Turbine Disk",
  //     stress: 900,
  //     strain: 0.007,
  //     displacement: 2.8,
  //     safetyFactor: 1.4,
  //     temperature: 980,
  //     position: [50, 75, 20],
  //   },
  //   {
  //     id: "combustor",
  //     name: "Combustor",
  //     stress: 200,
  //     strain: 0.0055,
  //     displacement: 1.5,
  //     safetyFactor: 1.8,
  //     temperature: 1100,
  //     position: [30, 80, 0],
  //   },
  //   {
  //     id: "nozzle",
  //     name: "Nozzle",
  //     stress: 220,
  //     strain: 0.006,
  //     displacement: 2.0,
  //     safetyFactor: 1.6,
  //     temperature: 900,
  //     position: [110, 75, 20],
  //   },
  // ];

  const componentRegions: ComponentRegion[] = [
    {
      id: "fan-blades",
      name: "Fan Blades",
      stress: 720,
      strain: 0.0065,
      displacement: 3.0,
      safetyFactor: 1.5,
      temperature: 350,
      material: "Titanium alloy (Ti-6Al-4V / Ti-6-2-4-2)",
      operatingTempRange: [100, 300],
      stressRange: [450, 600],
      notes: "Light, high-strength front stage; fatigue-limited.",
      position: [-110, 50, 10],
    },
    {
      id: "fan-disk",
      name: "Fan Disk",
      stress: 650,
      strain: 0.0058,
      displacement: 2.2,
      safetyFactor: 1.7,
      temperature: 360,
      material: "Titanium alloy (Ti-6Al-4V / Ti-6-2-4-2)",
      operatingTempRange: [100, 300],
      stressRange: [450, 600],
      notes: "Light, high-strength front stage; fatigue-limited.",
      position: [-110, 90, 0],
    },
    {
      id: "compressor-blades",
      name: "Compressor Blades",
      stress: 780,
      strain: 0.0072,
      displacement: 2.5,
      safetyFactor: 1.4,
      temperature: 600,
      material: "Titanium (front) → Inconel 718 (rear stages)",
      operatingTempRange: [200, 550],
      stressRange: [450, 800],
      notes: "Balances weight vs temperature; keeps margin for HCF.",
      position: [-90, 70, 20],
    },
    {
      id: "compressor-disk",
      name: "Compressor Disk",
      stress: 740,
      strain: 0.0068,
      displacement: 2.1,
      safetyFactor: 1.45,
      temperature: 620,
      material: "Inconel 718",
      operatingTempRange: [200, 550],
      stressRange: [600, 800],
      notes: "Rear section operates hotter; Inconel used for durability.",
      position: [-80, 80, 20],
    },
    {
      id: "turbine-blades",
      name: "Turbine Blades",
      stress: 400,
      strain: 0.0078,
      displacement: 3.3,
      safetyFactor: 1.35,
      temperature: 1000,
      material: "Nickel superalloy (CMSX-4 / Rene 80 / Inconel 718)",
      operatingTempRange: [950, 1150],
      stressRange: [150, 250],
      notes: "Creep-controlled hot section; transient peaks ≤ 300 MPa.",
      position: [45, 80, 30],
    },
    {
      id: "turbine-disk",
      name: "Turbine Disk",
      stress: 900,
      strain: 0.007,
      displacement: 2.8,
      safetyFactor: 1.4,
      temperature: 980,
      material: "Nickel superalloy (Inconel 718 / Rene 80)",
      operatingTempRange: [950, 1150],
      stressRange: [600, 850],
      notes: "Creep-controlled hot section; transient peaks ≤ 300 MPa.",
      position: [50, 75, 20],
    },
    {
      id: "combustor",
      name: "Combustor",
      stress: 200,
      strain: 0.0055,
      displacement: 1.5,
      safetyFactor: 1.8,
      temperature: 1100,
      material: "Inconel 625 / Hastelloy X / Haynes 188",
      operatingTempRange: [850, 1100],
      stressRange: [80, 150],
      notes: "Thin hot-sheet alloy; creep & oxidation-limited.",
      position: [30, 80, 0],
    },
    {
      id: "nozzle",
      name: "Nozzle",
      stress: 220,
      strain: 0.006,
      displacement: 2.0,
      safetyFactor: 1.6,
      temperature: 900,
      material: "Haynes 230 / Hastelloy X / Inconel 718",
      operatingTempRange: [900, 1100],
      stressRange: [80, 150],
      notes: "Heat-resistant sheet; governed by thermal fatigue.",
      position: [110, 75, 20],
    },
  ];

  const toggleLayer = (layerId: string) => {
    setActiveLayers((prev) => (prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]));
  };

  const handleParameterChange = (paramId: string, newValue: number) => {
    setScenarioParams((prev) => prev.map((p) => (p.id === paramId ? { ...p, value: newValue } : p)));
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 3000);
  };

  // const getStressColor = (stress: number): string => {
  //   if (stress >= 800) return "#ef4444";
  //   if (stress >= 700) return "#f59e0b";
  //   if (stress >= 100) return "#fbbf24";
  //   return "#10b981";
  // };
  const getStressColor = (stress: number): string => {
    if (stress >= 380 && stress <= 420) return "#ef4444"; // 🔴 Only turbine blades (≈400)
    if (stress >= 700) return "#f59e0b"; // 🟠 High stress (compressor parts)
    if (stress >= 100) return "#fbbf24"; // 🟡 Moderate stress (fan parts)
    return "#10b981"; // 🟢 Low stress (nozzle, combustor)
  };

  const handleRegionClick = (region: ComponentRegion) => {
    setSelectedRegion(region);
    if (onRegionClick) {
      onRegionClick(region);
    }
  };
  interface ModelProps {
    path: string;
    onRegionClick?: (name: string) => void;
  }
  ////
  function Model({ path, onRegionClick }: ModelProps) {
    const { scene } = useGLTF(path);

    // Define stress min/max for color mapping
    const stressMin = 600; // adjust to your model's min stress
    const stressMax = 820; // adjust to your model's max stress

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Use a single light green color for all vertices
        const geometry = mesh.geometry as THREE.BufferGeometry;
        const positions = geometry.attributes.position;
        const colors: number[] = [];

        const lightGreen = new THREE.Color(0x90ee90); // light green

        for (let i = 0; i < positions.count; i++) {
          colors.push(lightGreen.r, lightGreen.g, lightGreen.b);
        }

        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        mesh.material = new THREE.MeshStandardMaterial({ vertexColors: true });
      }
    });

    return <primitive object={scene} scale={[20, 20, 20]} />;
  }

  //   return null; // no need to render anything, just inspect
  // }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Box className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-400">Predicts component stress, strain, displacement, and thermal behavior during design</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-500 animate-pulse" />
            {/* <span className="text-sm text-gray-400">Live</span> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 relative" style={{ height: "500px" }}>
            {/* <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Active Layers</span>
              </div>
              <div className="space-y-1">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-xs transition-all ${
                      layer.active ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: layer.active ? layer.color : "#4b5563" }} />
                    <span>{layer.name}</span>
                  </button>
                ))}
              </div>
            </div> */}

            {/* <div className="w-full h-full flex items-center justify-center relative">
              <Canvas camera={{ position: [0, 0, 120], fov: 100 }}> */}
            <div id="feadigitaltwin-container" className="w-full h-full flex items-center justify-center relative">
              <Canvas camera={{ position: [0, 0, 120], fov: 100 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1} />

                <Model
                  path={modelPath}
                  onRegionClick={(regionName) => {
                    const region = componentRegions.find((r) => r.name === regionName);
                    if (region) handleRegionClick(region);
                  }}
                  applyVertexColors={(geometry) => {
                    // geometry: Three.js BufferGeometry
                    const colors = [];
                    const stressValues = geometry.attributes.position.array.map((_, i) => {
                      // Map vertex to a region stress value if you have vertex-to-region mapping
                      return getStressForVertex(i); // implement this
                    });

                    stressValues.forEach((stress) => {
                      const color = new THREE.Color(getStressColor(stress));
                      colors.push(color.r, color.g, color.b);
                    });

                    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
                  }}
                />

                {/* 3D stress markers */}
                {/*  */}
                {componentRegions.map((region) => (
                  <group key={region.id} position={region.position}>
                    {/* Outer transparent sphere */}
                    <mesh>
                      <sphereGeometry args={[9, 32, 32]} />
                      <meshBasicMaterial color={getStressColor(region.stress)} transparent opacity={0.3} />
                    </mesh>

                    {/* Inner colored sphere */}
                    <mesh>
                      <sphereGeometry args={[10, 32, 32]} />
                      <meshBasicMaterial color={getStressColor(region.stress)} transparent opacity={0.6} />
                    </mesh>

                    {/* Labels */}
                    {/* <Html center distanceFactor={20}>
                      <div className="text-6xl text-black font-bold text-center">
                        {region.name} <br />
                        <span style={{ color: getStressColor(region.stress) }}>{region.stress} MPa</span>
                      </div>
                    </Html> */}
                    <Html center distanceFactor={20} portal={{ current: document.querySelector("#feadigitaltwin-container") }}>
                      <div
                        className="font-semibold text-center"
                        style={{
                          fontSize: "8px", // ✅ set fixed size
                          lineHeight: "1.2",
                          color: "white",
                          background: "rgba(0,0,0,0.3)",
                          // padding: "4px 6px",
                          borderRadius: "4px",
                          pointerEvents: "none",
                        }}
                      >
                        {region.name} <br />
                        <span style={{ color: getStressColor(region.stress), fontWeight: 700 }}>{region.stress} MPa</span>
                      </div>
                    </Html>

                    {/* Click interaction */}
                    <mesh position={[0, 0, 0]} scale={[14, 14, 14]} onClick={() => handleRegionClick(region)}>
                      <sphereGeometry args={[1, 16, 16]} />
                      <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                  </group>
                ))}

                <OrbitControls enablePan enableZoom enableRotate />
              </Canvas>
            </div>

            <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>Scale:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-2 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded" />
                  <span className="text-white">0-1 MPa</span>
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
                    {kpi.value.toFixed(kpi.label === "Safety Factor" || kpi.label === "Mesh Quality" ? 2 : 0)}
                  </span>
                  <span className="text-sm text-gray-600">{kpi.unit}</span>
                </div>
                <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Target: {kpi.target}</span>
                </div>
              </div>
            ))}
          </div> */}
        </div>

        <div className="space-y-4">
          {/* {selectedRegion && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-semibold text-white">Selected Region</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">{selectedRegion.name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stress:</span>
                    <span className={`font-semibold ${selectedRegion.stress >= 800 ? "text-red-500" : "text-amber-500"}`}>
                      {selectedRegion.stress} MPa
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Strain:</span>
                    <span className="text-white font-semibold">{selectedRegion.strain} mm/mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Displacement:</span>
                    <span className="text-white font-semibold">{selectedRegion.displacement} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Safety Factor:</span>
                    <span className={`font-semibold ${selectedRegion.safetyFactor < 1.5 ? "text-red-500" : "text-green-500"}`}>
                      {selectedRegion.safetyFactor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Temperature:</span>
                    <span className="text-white font-semibold">{selectedRegion.temperature}°C</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-400">
                    <span className="text-blue-400 font-semibold">AI Recommendation:</span> Stress exceeds target. Consider fillet redesign or
                    material upgrade.
                  </p>
                </div>
              </div>
            </div>
          )} */}
          {selectedRegion && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-semibold text-white">Selected Region</h4>
              </div>

              <div className="space-y-2">
                {/* Region Name */}
                <p className="text-sm font-semibold text-white">{selectedRegion.name}</p>

                <div className="space-y-1 text-xs">
                  {/* Material */}
                  {/* <div className="flex justify-between">
                    <span className="text-gray-500">Material:</span>
                    <span className="text-white text-right font-medium">{selectedRegion.material || "N/A"}</span>
                  </div>

                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Operating Temp Range:</span>
                    <span className="text-white font-medium">
                      {selectedRegion.operatingTempRange
                        ? `${selectedRegion.operatingTempRange[0]}–${selectedRegion.operatingTempRange[1]} °C`
                        : "N/A"}
                    </span>
                  </div>

                 
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Stress Range:</span>
                    <span className="text-white font-medium">
                      {selectedRegion.stressRange ? `${selectedRegion.stressRange[0]}–${selectedRegion.stressRange[1]} MPa` : "N/A"}
                    </span>
                  </div> */}

                  {/* Actual Stress */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Stress:</span>
                    <span
                      className={`font-semibold ${
                        selectedRegion.stress > (selectedRegion.stressRange ? selectedRegion.stressRange[1] : 800) ? "text-red-500" : "text-amber-500"
                      }`}
                    >
                      {selectedRegion.stress} MPa
                    </span>
                  </div>

                  {/* Strain */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Strain:</span>
                    <span className="text-white font-semibold">{selectedRegion.strain} mm/mm</span>
                  </div>

                  {/* Displacement */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Displacement:</span>
                    <span className="text-white font-semibold">{selectedRegion.displacement} mm</span>
                  </div>

                  {/* Safety Factor */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Safety Factor:</span>
                    <span className={`font-semibold ${selectedRegion.safetyFactor < 1.5 ? "text-red-500" : "text-green-500"}`}>
                      {selectedRegion.safetyFactor}
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Temperature:</span>
                    <span className="text-white font-semibold">{selectedRegion.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Material:</span>
                    <span className="text-white text-right font-medium">{selectedRegion.material || "N/A"}</span>
                  </div>

                  {/* Operating Temperature Range */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Operating Temp Range:</span>
                    <span className="text-white font-medium">
                      {selectedRegion.operatingTempRange
                        ? `${selectedRegion.operatingTempRange[0]}–${selectedRegion.operatingTempRange[1]} °C`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Target Stress Range */}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Stress Range:</span>
                    <span className="text-white font-medium">
                      {selectedRegion.stressRange ? `${selectedRegion.stressRange[0]}–${selectedRegion.stressRange[1]} MPa` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Optional Notes */}
                {selectedRegion.notes && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 italic">{selectedRegion.notes}</p>
                  </div>
                )}

                {/* AI Recommendation */}
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-400">
                    <span className="text-blue-400 font-semibold">AI Recommendation:</span>{" "}
                    {selectedRegion.stress > (selectedRegion.stressRange ? selectedRegion.stressRange[1] : 800)
                      ? "Stress exceeds target range. Consider material upgrade or cooling redesign."
                      : "Stress within design limits. No immediate action required."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-1">AI Insights</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Critical stress detected at blade root. Recommend increasing fillet radius to 3.5mm or upgrading to Inconel 718 for 25% strength
                  improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
