import { create } from 'zustand';
import { GTSUTelemetry, GTSUHealthState, StartScenario } from '../types/engine';
import { generateCurrentTelemetry, generateHealthState } from '../utils/mockData';
import type { Alert } from '../components/AlertNotification';

let _alertCounter = 0;

interface GTSUStore {
  telemetry: GTSUTelemetry;
  health: GTSUHealthState;
  alerts: Alert[];
  activeScenario: StartScenario;
  lastRefresh: Date;

  refreshTelemetry: () => void;
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  dismissAlert: (id: string) => void;
  setScenario: (scenario: StartScenario) => void;
}

export const useGTSUStore = create<GTSUStore>((set) => ({
  telemetry: generateCurrentTelemetry(),
  health: generateHealthState(),
  alerts: [],
  activeScenario: 'normal',
  lastRefresh: new Date(),

  refreshTelemetry: () =>
    set({
      telemetry: generateCurrentTelemetry(),
      health: generateHealthState(),
      lastRefresh: new Date(),
    }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        { ...alert, id: `alert-${Date.now()}-${_alertCounter++}` },
        ...state.alerts,
      ].slice(0, 8),
    })),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  setScenario: (scenario) => set({ activeScenario: scenario }),
}));
