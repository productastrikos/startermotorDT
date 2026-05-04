import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ThresholdStatus } from "../types/engine";
import { getStatusColorClass } from "../utils/thresholds";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: ThresholdStatus;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function KPICard({ title, value, unit, status, trend, trendValue, icon, onClick }: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    const iconClass = "w-4 h-4";
    switch (trend) {
      case "up":
        return <TrendingUp className={iconClass} />;
      case "down":
        return <TrendingDown className={iconClass} />;
      case "neutral":
        return <Minus className={iconClass} />;
    }
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gray-900/50 border border-gray-800 rounded-lg p-5 backdrop-blur-sm transition-all ${
        onClick ? "cursor-pointer hover:bg-gray-900/70 hover:border-gray-700" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${getStatusColorClass(status)}`}>{typeof value === "number" ? value.toFixed(2) : value}</span>
            {unit && <span className="text-lg text-gray-500">{unit}</span>}
          </div>
        </div>
        {icon && (
          // <div className={`p-2 rounded-lg ${status === 'normal' ? 'bg-green-500/10' : status === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
          //   <div className={getStatusColorClass(status)}>
          //     {icon}
          //   </div>
          // </div>
          <div
            className={`w-7 flex-shrink-0 p-1 rounded-lg ${
              status === "normal" ? "bg-green-500/10" : status === "warning" ? "bg-amber-500/10" : "bg-red-500/10"
            }`}
          >
            <div className={getStatusColorClass(status)}>{icon}</div>
          </div>
        )}
      </div>
      {/* {trend && trendValue && (
        <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trendValue}</span>
        </div>
      )} */}
    </div>
  );
}
