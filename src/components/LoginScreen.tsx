import React, { useState } from 'react';
import { Lock, Mail, Key } from 'lucide-react';

export function LoginScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [email, setEmail] = useState('alex.rivera@hyperplane.io');
  const [password, setPassword] = useState('intern2026');
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
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-2">System Login</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Distributed Job Scheduler</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors flex justify-center"
          >
            {loading ? <span className="animate-pulse">Authenticating...</span> : 'Authenticate'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Demo Credentials: alex.rivera@hyperplane.io / intern2026</p>
        </div>
      </div>
    </div>
  );
}
