import { Bot, CheckCircle2, Clock, AlertCircle, Brain } from "lucide-react";
import { AIRecommendation } from "../types/engine";

interface AIRecommendationPanelProps {
  recommendations: AIRecommendation[];
  onAcknowledge?: (id: string) => void;
}

export function AIRecommendationPanel({ recommendations, onAcknowledge }: AIRecommendationPanelProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-500/10";
      case "warning":
        return "border-amber-500 bg-amber-500/10";
      case "info":
        return "border-blue-500 bg-blue-500/10";
      default:
        return "border-gray-700 bg-gray-900/50";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bot className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "acknowledged":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
            <CheckCircle2 className="w-3 h-3" />
            <span>Acknowledged</span>
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
      <div className="border-b border-gray-800 px-5 py-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
        </div>
        <p className="text-sm text-gray-400 mt-1">Real-time insights and predictive alerts</p>
      </div>
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {recommendations.map((rec) => (
          <div key={rec.id} className={`border rounded-lg p-4 transition-all ${getPriorityStyles(rec.priority)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start space-x-3 flex-1">
                {getPriorityIcon(rec.priority)}
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm">{rec.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {rec.affectedComponent} • {new Date(rec.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {getStatusBadge(rec.status)}
            </div>
            <p className="text-sm text-gray-300 mt-3 mb-3">{rec.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                </span>
                <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-300">{rec.recommendationType}</span>
              </div>
              {rec.status === "pending" && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(rec.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
