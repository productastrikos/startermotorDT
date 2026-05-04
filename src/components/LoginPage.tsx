import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple validation - in production this would be proper authentication
    if (credentials.username === 'admin' && credentials.password === 'Astrikos2026') {
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 2000);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setError('Invalid credentials. Use: admin / Astrikos2026');
      }, 1500);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: 'url("/astrikos_login_page.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Login Box Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/astrikos_logo_transparent_perfect.png" 
              alt="Astrikos Logo" 
              className="h-16 w-auto"
            />
          </div>
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-wider">
              GTSU-110 Digital Twin Platform
            </h1>
            <p className="text-cyan-300 text-sm uppercase tracking-wide">
              HAL DRISHTI Challenge 5 · iDEX · Secure Access
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wide">
                      admin ID
                    </label>
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-cyan-400/30 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      placeholder="Enter admin ID"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wide">
                      Access Code
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-slate-800/80 border border-cyan-400/30 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                        placeholder="Enter access code"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Access System
                      </>
                    )}
                  </button>
                </form>

        </div>
      </div>
    </div>
  );
}