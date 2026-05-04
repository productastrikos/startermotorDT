import { useState, useEffect, useRef } from 'react';
import { Layout, Page } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { FEAAnalyticsPage } from './pages/FEAAnalyticsPage';
import { FMEAPage } from './pages/FMEAPage';
import { FEAFMEAPage } from './pages/FEAFMEAPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { SmartOptimizationPage } from './pages/SmartOptimizationPage';
import { StartSequencePage } from './pages/StartSequencePage';
import { PHMPage } from './pages/PHMPage';
import { VVPage } from './pages/VVPage';
import LoginPage from './components/LoginPage';
import { AlertContainer } from './components/AlertContainer';
import { Alert } from './components/AlertNotification';
import { useGTSUStore } from './store/useGTSUStore';
import { GTSUTelemetry, GTSUHealthState } from './types/engine';

// ── Threshold → Alert mapping ──────────────────────────────────────────────
function checkThresholds(t: GTSUTelemetry, h: GTSUHealthState): Omit<Alert, 'id'>[] {
  const now = new Date();
  const results: Omit<Alert, 'id'>[] = [];

  // JPT1
  if (t.jpt1 >= 900) {
    results.push({ type: 'critical', title: 'JPT1 Ground Limit Exceeded', message: `JPT1 ${t.jpt1.toFixed(0)}°C ≥ 900°C — SECU abort sequence initiated`, timestamp: now });
  } else if (t.jpt1 >= 820) {
    results.push({ type: 'warning', title: 'JPT1 Approaching Abort Threshold', message: `JPT1 ${t.jpt1.toFixed(0)}°C approaching 900°C ground limit — monitor closely`, timestamp: now });
  }

  // Compressor fouling
  if (h.compressorFoulingIndex >= 50) {
    results.push({ type: 'critical', title: 'Compressor Fouling — Immediate Wash', message: `Fouling index ${h.compressorFoulingIndex.toFixed(1)}% — P2/P1 critically degraded, wash required now`, timestamp: now });
  } else if (h.compressorFoulingIndex >= 25) {
    results.push({ type: 'warning', title: 'Compressor Fouling Detected', message: `Fouling index ${h.compressorFoulingIndex.toFixed(1)}% — schedule compressor wash within 20 start cycles`, timestamp: now });
  }

  // RUL
  if (h.rul < 100) {
    results.push({ type: 'critical', title: 'RUL Below Minimum', message: `RUL ${h.rul} hrs — component life exhausted, immediate MRO required`, timestamp: now });
  } else if (h.rul < 250) {
    results.push({ type: 'warning', title: 'RUL Low', message: `RUL ${h.rul} hrs — plan maintenance action within the next 2 weeks`, timestamp: now });
  }

  // Hot start risk
  if (h.hotStartRisk > 60) {
    results.push({ type: 'critical', title: 'Hot Start Risk Critical', message: `Hot start probability ${h.hotStartRisk.toFixed(1)}% — inspect combustor before next start`, timestamp: now });
  } else if (h.hotStartRisk > 30) {
    results.push({ type: 'warning', title: 'Hot Start Risk Elevated', message: `Hot start probability ${h.hotStartRisk.toFixed(1)}% — monitor JPT1 closely during next start`, timestamp: now });
  }

  // Starter readiness
  if (h.starterReadiness < 60) {
    results.push({ type: 'critical', title: 'Starter Readiness Critical', message: `Starter readiness ${h.starterReadiness.toFixed(1)}% — abort start sequence, maintenance required`, timestamp: now });
  } else if (h.starterReadiness < 80) {
    results.push({ type: 'warning', title: 'Starter Readiness Low', message: `Starter readiness ${h.starterReadiness.toFixed(1)}% — increased abort risk, verify SECU BIT before start`, timestamp: now });
  }

  // SECU / BIT
  if (!t.bitPass) {
    results.push({ type: 'critical', title: 'SECU BIT Failure', message: 'Built-In-Test failed — SECU integrity compromised, abort start sequence immediately', timestamp: now });
  }

  // IPS mode
  if (t.ipsMode === 2) {
    results.push({ type: 'critical', title: 'IPS Degraded Mode Active', message: 'IPS in open-loop fallback (Mode 2) — SECU emergency override, manual oversight required', timestamp: now });
  } else if (t.ipsMode === 1) {
    results.push({ type: 'warning', title: 'IPS Emergency Mode Armed', message: 'IPS emergency shutdown armed (Mode 1) — abnormal start condition detected by SECU', timestamp: now });
  }

  // MIL-STD-1553B bus
  if (t.milBusHealth < 80) {
    results.push({ type: 'critical', title: 'MIL-STD-1553B Bus Fault', message: `1553B health ${t.milBusHealth}% — SECU data link critically degraded`, timestamp: now });
  } else if (t.milBusHealth < 95) {
    results.push({ type: 'warning', title: 'MIL-STD-1553B Degraded', message: `1553B health ${t.milBusHealth}% — monitor bus for additional frame errors`, timestamp: now });
  }

  // HPT creep life
  if (h.creepLifeConsumption > 80) {
    results.push({ type: 'critical', title: 'HPT Blade Creep Life Critical', message: `Creep life consumption ${h.creepLifeConsumption.toFixed(1)}% — blade replacement required at next MRO`, timestamp: now });
  } else if (h.creepLifeConsumption > 40) {
    results.push({ type: 'warning', title: 'HPT Blade Creep Accumulating', message: `Creep life consumption ${h.creepLifeConsumption.toFixed(1)}% — Larson-Miller trending up, schedule borescope`, timestamp: now });
  }

  return results;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const { telemetry, health, alerts, refreshTelemetry, addAlert, dismissAlert } = useGTSUStore();
  // Track last-fired time per alert title to throttle duplicates (2-min window)
  const recentAlerts = useRef<Map<string, number>>(new Map());

  // Refresh telemetry every 5 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshTelemetry, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshTelemetry]);

  // Check thresholds on every telemetry update
  useEffect(() => {
    if (!isAuthenticated) return;
    const now = Date.now();
    const THROTTLE_MS = 2 * 60_000;
    for (const alert of checkThresholds(telemetry, health)) {
      const lastFired = recentAlerts.current.get(alert.title) ?? 0;
      if (now - lastFired > THROTTLE_MS) {
        addAlert(alert);
        recentAlerts.current.set(alert.title, now);
      }
    }
  }, [telemetry, health, isAuthenticated, addAlert]);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':          return <OverviewPage />;
      case 'start-sequence':    return <StartSequencePage />;
      case 'phm':               return <PHMPage />;
      case 'fea-analytics':     return <FEAAnalyticsPage />;
      case 'fmea':              return <FMEAPage />;
      case 'fea-fmea':          return <FEAFMEAPage />;
      case 'optimization':      return <OptimizationPage />;
      case 'smart-optimization':return <SmartOptimizationPage />;
      case 'vv-compliance':     return <VVPage />;
      default:                  return <OverviewPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
      <AlertContainer alerts={alerts} onClose={dismissAlert} />
    </Layout>
  );
}

export default App;

