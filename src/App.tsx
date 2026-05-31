import { useState, useEffect, Component } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './services/socket';
import AppLayout from './components/cwm/Layout';
import CWMLoginPage from './pages/CWMLoginPage';
import ProfilePage from './pages/CWMProfile';
import PostFlightAnalysisPage from './pages/PostFlightAnalysisPage';
import ProcessSimulatorPage   from './pages/ProcessSimulatorPage';
import LifeCyclePage          from './pages/LifeCyclePage';
import SandboxPage            from './pages/SandboxPage';

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: '#dc2626', background: '#0f172a', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 8 }}>Application Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#f87171', fontSize: 12 }}>{String(this.state.error)}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '6px 14px', background: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer' }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser]   = useState<Record<string, unknown> | null>(() => {
    try { const u = localStorage.getItem('cwm_user'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('cwm_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('cwm_theme', theme);
  }, [theme]);

  const handleLogin = (userData: Record<string, unknown>, token: string) => {
    localStorage.setItem('cwm_token', token);
    localStorage.setItem('cwm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('cwm_token');
    localStorage.removeItem('cwm_user');
    setUser(null);
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (!user) {
    return (
      <CWMLoginPage onLogin={handleLogin} theme={theme} onThemeToggle={toggleTheme} />
    );
  }

  return (
    <RootErrorBoundary>
    <BrowserRouter>
      <SocketProvider>
        <AppLayout user={user} onLogout={handleLogout} theme={theme} onThemeToggle={toggleTheme}>
          <Routes>
            <Route path="/"            element={<PostFlightAnalysisPage />} />
            <Route path="/simulator"   element={<ProcessSimulatorPage />} />
            <Route path="/life-cycle"  element={<LifeCyclePage />} />
            <Route path="/sandbox"     element={<SandboxPage />} />
            <Route path="/profile"     element={<ProfilePage user={user} onLogout={handleLogout} />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </SocketProvider>
    </BrowserRouter>
    </RootErrorBoundary>
  );
}

export default App;
