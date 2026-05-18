import React, { createContext, useContext, useState } from 'react';

/* ─── Seed / Mock Data ─────────────────────────────────── */
const _t = Date.now();
const _ago = (min: number) => new Date(_t - min * 60000).toISOString();

/* ─── Types ────────────────────────────────────────────── */
export interface Alert {
  alertId: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  zone: string;
  assetId: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface Advisory {
  id: string;
  title: string;
  message: string;
  type: string;
  acknowledged: boolean;
  createdAt: string;
}

/* ─── GTSU Engine Alerts ───────────────────────────────── */
const SEED_ALERTS: Alert[] = [
  {
    alertId: 'ENG-001',
    type: 'critical',
    category: 'thermal',
    title: 'JPT1 Approaching Operational Limit',
    message: 'Jet Pipe Temperature at 887 °C — within 13 °C of ground-start ceiling. Recommend reducing power setting or initiating active cool-down.',
    zone: 'Turbine Section',
    assetId: 'ENG-GTSU-001',
    acknowledged: false,
    createdAt: _ago(8),
  },
  {
    alertId: 'ENG-002',
    type: 'warning',
    category: 'mechanical',
    title: 'Compressor Fouling Index Elevated',
    message: 'Stages 5–7 fouling index at 0.73. Compressor washing cycle recommended within the next 20 flight hours to recover efficiency.',
    zone: 'Compressor Section',
    assetId: 'ENG-GTSU-001',
    acknowledged: false,
    createdAt: _ago(22),
  },
  {
    alertId: 'ENG-003',
    type: 'warning',
    category: 'vibration',
    title: 'HP Turbine Vibration Anomaly',
    message: 'HP turbine vibration at 4.2 mm/s RMS, exceeding the 3.5 mm/s nominal baseline. Monitor trend at next power cycle.',
    zone: 'Turbine Section',
    assetId: 'ENG-GTSU-001',
    acknowledged: false,
    createdAt: _ago(45),
  },
  {
    alertId: 'ENG-004',
    type: 'info',
    category: 'lifecycle',
    title: 'HPT Blade RUL Below 800 FH',
    message: 'High-pressure turbine blade remaining useful life estimate has crossed the 800-hour threshold. Next scheduled borescope in 120 FH.',
    zone: 'Turbine Section',
    assetId: 'ENG-GTSU-001',
    acknowledged: true,
    createdAt: _ago(90),
  },
  {
    alertId: 'ENG-005',
    type: 'info',
    category: 'system',
    title: 'SECU Backup Unit Health Check Passed',
    message: 'Scheduled SECU-B self-test completed successfully. All control lanes nominal. Primary / backup redundancy confirmed.',
    zone: 'Digital Control Unit',
    assetId: 'ENG-GTSU-001',
    acknowledged: true,
    createdAt: _ago(135),
  },
];

/* ─── GTSU AI Engine Advisories ────────────────────────── */
const SEED_ADVISORIES: Advisory[] = [
  {
    id: 'ADV-001',
    title: 'Start Sequence Optimisation',
    message: 'Analysis of the last 12 start cycles recommends reducing starter-motor dwell time by 0.8 s. Projected outcome: peak JPT reduced by ~18 °C, HPT blade life extended by an estimated 4%.',
    type: 'optimization',
    acknowledged: false,
    createdAt: _ago(12),
  },
  {
    id: 'ADV-002',
    title: 'Compressor Wash — Predicted +2.1 % Efficiency',
    message: 'Performing a compressor wash within the next 15 flight hours is predicted to recover 2.1 % engine efficiency and reduce fuel burn by ~3.4 kg/h at cruise power setting.',
    type: 'prediction',
    acknowledged: false,
    createdAt: _ago(38),
  },
  {
    id: 'ADV-003',
    title: 'Reduce Peak TET to Extend Creep Life',
    message: 'Current turbine entry temperature profile is consuming creep life at 112 % of the design rate. Reducing max TET by 15 °C is estimated to extend the HPT blade replacement interval by ~180 FH.',
    type: 'high',
    acknowledged: false,
    createdAt: _ago(65),
  },
  {
    id: 'ADV-004',
    title: 'Schedule P3 Seal Inspection',
    message: 'Pressure ratio trends indicate marginal P3 seal degradation. Borescope inspection at next C-check is recommended to prevent compressor delivery pressure loss exceeding 1.2 %.',
    type: 'medium',
    acknowledged: false,
    createdAt: _ago(110),
  },
];

/* ─── Context ──────────────────────────────────────────── */
interface DataContextValue {
  connected: boolean;
  alerts: Alert[];
  advisories: Advisory[];
  acknowledgeAlert: (id: string) => void;
  acknowledgeAdvisory: (id: string) => void;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [alerts,     setAlerts]     = useState<Alert[]>(SEED_ALERTS);
  const [advisories, setAdvisories] = useState<Advisory[]>(SEED_ADVISORIES);

  const handleAckAlert = (id: string) =>
    setAlerts(prev => prev.map(a => a.alertId === id ? { ...a, acknowledged: true } : a));

  const handleAckAdvisory = (id: string) =>
    setAdvisories(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));

  return (
    <DataContext.Provider value={{
      connected: true,
      alerts,
      advisories,
      acknowledgeAlert:  handleAckAlert,
      acknowledgeAdvisory: handleAckAdvisory,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within SocketProvider');
  return ctx;
}
