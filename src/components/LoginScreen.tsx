import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, Eye, EyeOff, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (token: string, user: any) => void;
}

const PRESET_ACCOUNTS = [
  {
    name: 'Alex Rivera (Admin)',
    email: 'alex.rivera@hyperplane.io',
    password: 'intern2026',
    role: 'admin',
    desc: 'Full system control & worker scaling'
  },
  {
    name: 'Sam Chen (Developer)',
    email: 'sam.chen@hyperplane.io',
    password: 'intern2026',
    role: 'developer',
    desc: 'Enqueue jobs, manage queues & workflows'
  },
  {
    name: 'Elena Rostova (Viewer)',
    email: 'elena.r@hyperplane.io',
    password: 'intern2026',
    role: 'viewer',
    desc: 'Read-only metrics, timeline & logs'
  }
];

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('alex.rivera@hyperplane.io');
  const [password, setPassword] = useState('intern2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to authentication service');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d1a2d] border border-[#172a46] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-[#172a46]/80 text-center">
          <div className="mx-auto w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-4">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">HyperPlane Login</h1>
          <p className="text-xs text-slate-400 mt-1">Distributed Job Scheduler &amp; Worker Mesh</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-center space-x-2">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#060b13] border border-[#172a46] text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono"
                  placeholder="name@hyperplane.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#060b13] border border-[#172a46] text-white text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse text-sm">Authenticating Session...</span>
              ) : (
                <>
                  <span className="text-sm">Sign In to Cluster</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Profiles */}
          <div className="mt-7 pt-5 border-t border-[#172a46]/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Switch Demo Roles
            </div>
            <div className="space-y-1.5">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.email}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                    email === preset.email 
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                      : 'bg-[#060b13]/60 border-[#172a46] text-slate-400 hover:text-slate-200 hover:bg-[#060b13]'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-200">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.desc}</div>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {preset.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
