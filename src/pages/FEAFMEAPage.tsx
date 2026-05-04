import { Shield, AlertTriangle, Activity } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { BarChart } from "../components/BarChart";
import { LineChart } from "../components/LineChart";
import { HeatmapChart } from "../components/HeatmapChart";
import { AIRecommendationPanel } from "../components/AIRecommendationPanel";
import { KPIDetailModal } from "../components/KPIDetailModal";
import { StructuralDigitalTwin } from "../components/StructuralDigitalTwin";
import { generateFEAData, generateFMEAData, generateVibrationData, generateAIRecommendations } from "../utils/mockData";
import { getThresholdStatus } from "../utils/thresholds";
import { useState } from "react";
import { getStressToYieldDetail, getFatigueLifeDetail, getRPNDetail, KPIDetail } from "../utils/kpiDetails";
import EngineFailureAnimation from "../components/EngineFailureAnimation";

export function FEAFMEAPage() {
  const feaData = generateFEAData();
  const fmeaData = generateFMEAData();
  const vibrationData = generateVibrationData();
  const [recommendations] = useState(
    generateAIRecommendations().filter(
      (r) => r.recommendationType === "alert" || r.affectedComponent.includes("Blade") || r.affectedComponent.includes("Bearing")
    )
  );
  const [selectedKPI, setSelectedKPI] = useState<KPIDetail | null>(null);

  const structuralComponents = [
    {
      id: "compressorBlade",
      name: "Compressor Blade",
      stressLevel: parseFloat((feaData.find((d) => d.componentName === "Compressor Blade")?.stressToYieldRatio! * 100).toFixed(2)),
      fatigueLevel: parseFloat((feaData.find((d) => d.componentName === "Compressor Blade")?.fatigueLifeRemaining || 65).toFixed(2)),
      status: (feaData.find((d) => d.componentName === "Compressor Blade")?.stressToYieldRatio! * 100 > 85
        ? "critical"
        : feaData.find((d) => d.componentName === "Compressor Blade")?.stressToYieldRatio! * 100 > 75
        ? "warning"
        : "normal") as const,
      x: 90,
      y: 150,
      width: 50,
      height: 120,
    },
    {
      id: "turbineBlade",
      name: "Turbine Blade",
      stressLevel: parseFloat((feaData.find((d) => d.componentName === "Turbine Blade")?.stressToYieldRatio! * 100).toFixed(2)),
      fatigueLevel: parseFloat((feaData.find((d) => d.componentName === "Turbine Blade")?.fatigueLifeRemaining || 72).toFixed(2)),
      status: (feaData.find((d) => d.componentName === "Turbine Blade")?.stressToYieldRatio! * 100 > 85
        ? "critical"
        : feaData.find((d) => d.componentName === "Turbine Blade")?.stressToYieldRatio! * 100 > 75
        ? "warning"
        : "normal") as const,
      x: 484,
      y: 160,
      width: 50,
      height: 125,
    },
    {
      id: "combustionChamber",
      name: "Combustion Chamber",
      stressLevel: parseFloat((feaData.find((d) => d.componentName === "Combustion Chamber")?.stressToYieldRatio! * 100).toFixed(2)),
      fatigueLevel: parseFloat((feaData.find((d) => d.componentName === "Combustion Chamber")?.fatigueLifeRemaining || 80).toFixed(2)),
      status: (feaData.find((d) => d.componentName === "Combustion Chamber")?.stressToYieldRatio! * 100 > 85
        ? "critical"
        : feaData.find((d) => d.componentName === "Combustion Chamber")?.stressToYieldRatio! * 100 > 75
        ? "warning"
        : "normal") as const,
      x: 380,
      y: 155,
      width: 100,
      height: 130,
    },
    {
      id: "shaft",
      name: "Main Shaft",
      stressLevel: parseFloat((feaData.find((d) => d.componentName === "Shaft")?.stressToYieldRatio! * 100).toFixed(2)),
      fatigueLevel: parseFloat((feaData.find((d) => d.componentName === "Shaft")?.fatigueLifeRemaining || 85).toFixed(2)),
      status: (feaData.find((d) => d.componentName === "Shaft")?.stressToYieldRatio! * 100 > 85
        ? "critical"
        : feaData.find((d) => d.componentName === "Shaft")?.stressToYieldRatio! * 100 > 75
        ? "warning"
        : "normal") as const,
      x: 250,
      y: 180,
      width: 150,
      height: 50,
    },
    {
      id: "nozzle",
      name: "Exhaust Nozzle",
      stressLevel: parseFloat((feaData.find((d) => d.componentName === "Nozzle")?.stressToYieldRatio! * 100).toFixed(2)),
      fatigueLevel: parseFloat((feaData.find((d) => d.componentName === "Nozzle")?.fatigueLifeRemaining || 78).toFixed(2)),
      status: (feaData.find((d) => d.componentName === "Nozzle")?.stressToYieldRatio! * 100 > 85
        ? "critical"
        : feaData.find((d) => d.componentName === "Nozzle")?.stressToYieldRatio! * 100 > 75
        ? "warning"
        : "normal") as const,
      x: 15,
      y: 150,
      width: 50,
      height: 120,
    },
  ];

  const avgStressRatio = feaData.reduce((sum, d) => sum + d.stressToYieldRatio, 0) / feaData.length;
  const avgFatigueLife = feaData.reduce((sum, d) => sum + d.fatigueLifeRemaining, 0) / feaData.length;
  const avgThermalMargin = feaData.reduce((sum, d) => sum + d.thermalStressMargin, 0) / feaData.length;
  const avgRPN = fmeaData.reduce((sum, d) => sum + d.rpn, 0) / fmeaData.length;
  const avgMTBF = fmeaData.reduce((sum, d) => sum + d.mtbf, 0) / fmeaData.length;
  const currentVibration = vibrationData[vibrationData.length - 1];

  const stressRatioData = feaData.map((d) => ({
    label: d.componentName,
    value: d.stressToYieldRatio * 100,
    color: d.stressToYieldRatio > 0.9 ? "#ef4444" : d.stressToYieldRatio > 0.8 ? "#f59e0b" : "#10b981",
  }));

  const fatigueLifeData = feaData.map((d) => ({
    label: d.componentName,
    value: d.fatigueLifeRemaining,
    color: d.fatigueLifeRemaining < 50 ? "#ef4444" : d.fatigueLifeRemaining < 70 ? "#f59e0b" : "#10b981",
  }));

  const rpnData = fmeaData
    .sort((a, b) => b.rpn - a.rpn)
    .map((d) => ({
      label: d.failureMode,
      value: d.rpn,
      color: d.rpn > 200 ? "#ef4444" : d.rpn > 100 ? "#f59e0b" : "#10b981",
    }));

  const mtbfData = fmeaData.map((d) => ({
    label: d.componentName,
    value: d.mtbf,
    color: "#3b82f6",
  }));

  const mttrData = fmeaData.map((d) => ({
    label: d.componentName,
    value: d.mttr,
    color: "#8b5cf6",
  }));

  const vibrationTimeSeries = vibrationData.slice(-50).map((d, i) => ({
    x: i,
    y: d.amplitude,
  }));

  const stressHeatmapData = [
    { component: "Compressor", metric: "Stress", value: 75 },
    { component: "Compressor", metric: "Fatigue", value: 65 },
    { component: "Compressor", metric: "Thermal", value: 45 },
    { component: "Turbine", metric: "Stress", value: 85 },
    { component: "Turbine", metric: "Fatigue", value: 78 },
    { component: "Turbine", metric: "Thermal", value: 82 },
    { component: "Combustor", metric: "Stress", value: 68 },
    { component: "Combustor", metric: "Fatigue", value: 72 },
    { component: "Combustor", metric: "Thermal", value: 88 },
    { component: "Shaft", metric: "Stress", value: 62 },
    { component: "Shaft", metric: "Fatigue", value: 58 },
    { component: "Shaft", metric: "Thermal", value: 35 },
    { component: "Nozzle", metric: "Stress", value: 55 },
    { component: "Nozzle", metric: "Fatigue", value: 68 },
    { component: "Nozzle", metric: "Thermal", value: 72 },
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  const handleAction = () => {
    setNotification("Inspection task has been triggered!");
    setTimeout(() => setNotification(""), 3000); // hide after 3s
    setIsModalOpen(false);
  };
  const [selectedFailure, setSelectedFailure] = useState<FMEAItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">FEA + FMEA Analysis</h2>
          <p className="text-gray-400 mt-1">Structural integrity and reliability assessment</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-300">
            System Status: <span className="text-green-500 font-semibold">Nominal</span>
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Alert card */}
        <div
          className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-lg p-4 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-500">Critical Alert</h3>
              <p className="text-sm text-gray-300 mt-1">
                Turbine blade stress-to-yield ratio approaching critical threshold. Immediate inspection recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-96 relative">
              <h3 className="text-lg font-semibold text-amber-500 mb-3">Critical Alert Details</h3>
              <p className="text-gray-300 mb-4">
                Turbine blade stress-to-yield ratio is currently at 87%. Exceeds safe limits of 85%. Immediate inspection and maintenance recommended.
              </p>
              <p className="text-gray-400 text-sm mb-6">Suggested actions: Notify maintenance team, schedule inspection, and log event in system.</p>
              <div className="flex justify-end space-x-3">
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
                <button className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded" onClick={handleAction}>
                  Take Action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 bg-amber-500 text-gray-900 px-4 py-2 rounded shadow-lg animate-slide-in">{notification}</div>
        )}
      </div>
      {/*
      <StructuralDigitalTwin components={structuralComponents} /> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Avg Fatigue Life"
          value={avgFatigueLife.toFixed(1)}
          unit="% "
          status={avgFatigueLife < 50 ? "critical" : avgFatigueLife < 70 ? "warning" : "normal"}
          trend="down"
          trendValue="Normal wear"
          icon={<Activity className="w-5 h-5" />}
          onClick={() => setSelectedKPI(getFatigueLifeDetail(avgFatigueLife))}
        />
        <KPICard
          title="Thermal Margin"
          value={avgThermalMargin.toFixed(0)}
          unit="°C"
          status={getThresholdStatus(avgThermalMargin, "thermalStressMargin")}
          trend="neutral"
          trendValue="Stable"
          icon={<Shield className="w-5 h-5" />}
        />
        <KPICard
          title="Average RPN"
          value={avgRPN.toFixed(0)}
          status={avgRPN > 200 ? "critical" : avgRPN > 100 ? "warning" : "normal"}
          trend="up"
          trendValue="Risk decreasing"
          icon={<AlertTriangle className="w-5 h-5" />}
          onClick={() => setSelectedKPI(getRPNDetail(avgRPN))}
        />
        <KPICard
          title="Mean MTBF"
          value={avgMTBF.toFixed(0)}
          unit="hrs"
          status="normal"
          trend="up"
          trendValue="+5% improvement"
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="Vibration Level"
          value={currentVibration.amplitude.toFixed(1)}
          unit="mm/s"
          status={getThresholdStatus(currentVibration.amplitude, "vibrationAmplitude")}
          trend="neutral"
          trendValue="Normal range"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <StructuralDigitalTwin components={structuralComponents} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarChart data={stressRatioData} title="Stress-to-Yield Ratio by Component" yAxisLabel="Ratio (%)" height={300} />
        <BarChart data={fatigueLifeData} title="Fatigue Life Remaining by Component" yAxisLabel="Life Remaining (%)" height={300} />
      </div>

      <HeatmapChart data={stressHeatmapData} title="Stress Analysis Heatmap" minValue={0} maxValue={100} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarChart data={rpnData} title="Risk Priority Number (RPN) - Pareto Analysis" yAxisLabel="RPN Score" height={300} />
        <LineChart
          data={vibrationTimeSeries}
          title="Vibration Amplitude Time Series"
          color="#8b5cf6"
          yAxisLabel="Amplitude (mm/s)"
          xAxisLabel="Time Sample"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarChart data={mtbfData} title="Mean Time Between Failures (MTBF)" yAxisLabel="Hours" height={300} />
        <BarChart data={mttrData} title="Mean Time To Repair (MTTR)" yAxisLabel="Hours" height={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Critical Components</h3>
          <div className="space-y-3">
            {feaData
              .filter((d) => d.stressToYieldRatio > 0.75)
              .sort((a, b) => b.stressToYieldRatio - a.stressToYieldRatio)
              .map((comp) => (
                <div key={comp.componentName} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <div>
                    <p className="font-medium text-white">{comp.componentName}</p>
                    <p className="text-xs text-gray-400">{comp.material}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        comp.stressToYieldRatio > 0.9 ? "text-red-500" : comp.stressToYieldRatio > 0.8 ? "text-amber-500" : "text-green-500"
                      }`}
                    >
                      {(comp.stressToYieldRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">Stress Ratio</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4">High Risk Failure Modes</h3>

          <div className="space-y-3">
            {fmeaData
              .sort((a, b) => b.rpn - a.rpn)
              .slice(0, 4)
              .map((failure, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-900 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-all"
                  onClick={() => setSelectedFailure(failure)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">{failure.failureMode}</p>
                      <p className="text-xs text-gray-400">{failure.componentName}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        failure.rpn > 200
                          ? "bg-red-500/20 text-red-500"
                          : failure.rpn > 100
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-green-500/20 text-green-500"
                      }`}
                    >
                      RPN: {failure.rpn}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Modal with full info */}
          {selectedFailure && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-lg p-6 w-96 relative border border-gray-800">
                <h3 className="text-lg font-semibold text-amber-500 mb-3">{selectedFailure.failureMode}</h3>
                <p className="text-gray-300 mb-2">
                  Component: <span className="font-semibold">{selectedFailure.componentName}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Severity</p>
                    <p className="text-white font-semibold">{selectedFailure.severity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Occurrence</p>
                    <p className="text-white font-semibold">{selectedFailure.occurrence}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Detection</p>
                    <p className="text-white font-semibold">{selectedFailure.detection}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Test Phase</p>
                    <p className="text-white font-semibold">{selectedFailure.testPhase || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Test Status</p>
                    <p
                      className={`font-semibold ${
                        selectedFailure.testStatus === "Fail"
                          ? "text-red-500"
                          : selectedFailure.testStatus === "Pass"
                          ? "text-green-500"
                          : "text-amber-500"
                      }`}
                    >
                      {selectedFailure.testStatus || "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Serial / Batch</p>
                    <p className="text-white font-semibold">{selectedFailure.serial || "Unknown"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400">Observed Deviations</p>
                    <p className="text-white font-semibold">{selectedFailure.deviation || "None"}</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6">{selectedFailure.recommendedAction}</p>

                <div className="flex justify-end space-x-3">
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded" onClick={() => setSelectedFailure(null)}>
                    Close
                  </button>
                  <button
                    className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded"
                    onClick={() => {
                      console.log("Inspection triggered for", selectedFailure.failureMode);
                      setSelectedFailure(null);
                    }}
                  >
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* <div className="col-span-2 w-full">
          <h2 className="text-white">FMEA Simulation</h2>
          <EngineFailureAnimation />
        </div> */}

        {/* <AIRecommendationPanel recommendations={recommendations} /> */}
        <div className="col-span-2 w-full">
          <AIRecommendationPanel recommendations={recommendations} />
        </div>

        {selectedKPI && <KPIDetailModal kpiDetail={selectedKPI} onClose={() => setSelectedKPI(null)} />}
      </div>
    </div>
  );
}
