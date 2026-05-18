import { ReactNode } from "react";
import { Activity, AlertTriangle, Sparkles, Zap, Brain, Shield } from "lucide-react";
import { useGTSUStore } from "../store/useGTSUStore";

interface LayoutProps {
  children: ReactNode;
}

export type Page =
  | "overview"
  | "start-sequence"
  | "phm"
  | "fmea"
  | "fea-analytics"
  | "vv-compliance"
  | "smart-optimization"
  | "fea-fmea"
  | "optimization";

interface LayoutPropsWithNav extends LayoutProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutPropsWithNav) {
  const { operationMode, setOperationMode } = useGTSUStore();
  const navItems: { id: Page; label: string; icon: ReactNode; group?: string }[] = [
    { id: "overview", label: "GTSU Overview", icon: <Activity className="w-5 h-5" />, group: "Monitor" },
    { id: "start-sequence", label: "Start Sequence", icon: <Zap className="w-5 h-5" />, group: "Monitor" },
    { id: "phm", label: "PHM Dashboard", icon: <Brain className="w-5 h-5" />, group: "Monitor" },
    { id: "fmea", label: "FMEA Analysis", icon: <AlertTriangle className="w-5 h-5" />, group: "Analysis" },
    { id: "fea-analytics", label: "FEA / Structural", icon: <Sparkles className="w-5 h-5" />, group: "Analysis" },
    { id: "smart-optimization", label: "Smart Optimization", icon: <Sparkles className="w-5 h-5" />, group: "Analysis" },
    { id: "vv-compliance", label: "V&V Compliance", icon: <Shield className="w-5 h-5" />, group: "Compliance" },
  ];

  const groups = ["Monitor", "Analysis", "Compliance"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <header className="bg-black border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/Logo-s.png" alt="HAL logo" className="w-15 h-15" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GTSU-110 Digital Twin</h1>
                <p className="text-xs text-gray-400">HAL DRISHTI Challenge 5 · iDEX</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500">ISO 23247 · MIL-STD-1553B · DO-178C</span>
              <div className="flex items-center rounded-md border border-gray-700 bg-gray-950 p-1 gap-1">
                <button
                  onClick={() => setOperationMode("live-test")}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    operationMode === "live-test"
                      ? "bg-green-500/20 text-green-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  LIVE TEST
                </button>
                <button
                  onClick={() => setOperationMode("post-test-review")}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    operationMode === "post-test-review"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  POST-TEST REVIEW
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-black border-r border-gray-800 overflow-y-auto">
          <nav className="p-4 space-y-4">
            {groups.map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-2">{group}</p>
                <div className="space-y-1">
                  {navItems
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                          currentPage === item.id
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50"
                        }`}
                      >
                        {item.icon}
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 ml-64 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
