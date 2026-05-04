import { X } from "lucide-react";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { getStatusColorClass } from "../utils/thresholds";

// interface KPIDetail {
//   title: string;
//   value: string | number;
//   unit?: string;
//   description: string;
//   factors: {
//     name: string;
//     impact: number;
//     description: string;
//   }[];
//   historicalData?: {
//     x: number | string;
//     y: number;
//   }[];
//   relatedMetrics?: {
//     label: string;
//     value: number;
//     color?: string;
//   }[];
// }
interface KPIDetail {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  status?: string; // ✅ add this line
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  historicalData?: {
    x: number | string;
    y: number;
  }[];
  relatedMetrics?: {
    label: string;
    value: number;
    color?: string;
  }[];
}

interface KPIDetailModalProps {
  kpiDetail: KPIDetail;
  onClose: () => void;
}

export function KPIDetailModal({ kpiDetail, onClose }: KPIDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{kpiDetail.title}</h2>
            {/* <p className="text-gray-400 mt-1">{kpiDetail.description}</p> */}
            <p className="text-gray-400 whitespace-pre-line">{kpiDetail.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Current Value</p>
            <div className="flex items-baseline space-x-3">
              {/* <span className="text-5xl font-bold text-green-500">
                {typeof kpiDetail.value === 'number' ? kpiDetail.value.toFixed(2) : kpiDetail.value}
              </span> */}
              <span className={`text-5xl font-bold ${getStatusColorClass(kpiDetail.status)}`}>
                {typeof kpiDetail.value === "number" ? kpiDetail.value.toFixed(2) : kpiDetail.value}
              </span>

              {kpiDetail.unit && <span className="text-2xl text-gray-500">{kpiDetail.unit}</span>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Key Influencing Factors</h3>
            <div className="space-y-3">
              {kpiDetail.factors.map((factor, index) => (
                <div key={index} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200">{factor.name}</span>
                    <span
                      className={`text-sm font-semibold ${
                        factor.impact > 0 ? "text-green-500" : factor.impact < 0 ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      {factor.impact > 0 ? "+" : ""}
                      {factor.impact.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{factor.description}</p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        factor.impact > 0 ? "bg-green-500" : factor.impact < 0 ? "bg-red-500" : "bg-gray-500"
                      }`}
                      style={{ width: `${Math.abs(factor.impact)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* {kpiDetail.historicalData && kpiDetail.historicalData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Historical Trend</h3>
              <LineChart
                data={kpiDetail.historicalData}
                title=""
                color="#10b981"
                height={250}
                xAxisLabel="Flight Cycle"
                yAxisLabel="Thrust-to-Weight Ratio"
              />
            </div>
          )} */}

          {/* {kpiDetail.relatedMetrics && kpiDetail.relatedMetrics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Related Metrics</h3>
              <BarChart data={kpiDetail.relatedMetrics} title="" height={220} />
            </div>
          )} */}
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-1">
          <button onClick={onClose} className="w-full bg-grey-400 hover:bg-grey-200 text-white font-medium py-3 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
