import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Key,
  Clock,
  RefreshCw,
  AlertTriangle,
  Server,
  Hash,
  Play,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Plus
} from 'lucide-react';
import { DistributedLock } from '../types';

interface DistributedLockingViewProps {
  locks: DistributedLock[];
  contentions: { key: string; requestedBy: string; deniedAt: string; heldBy: string }[];
  onAcquireLock: (key: string, ttlMs: number, workerId: string) => Promise<any>;
  onRenewLock: (key: string, workerId: string, fencingToken: number, ttlMs: number) => Promise<any>;
  onReleaseLock: (key: string, workerId: string, fencingToken: number) => Promise<any>;
  onTestContention: () => Promise<any>;
  userRole?: string;
}

export const DistributedLockingView: React.FC<DistributedLockingViewProps> = ({
  locks,
  contentions,
  onAcquireLock,
  onRenewLock,
  onReleaseLock,
  onTestContention,
  userRole = 'admin'
}) => {
  const [isAcquireModalOpen, setIsAcquireModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('resource:tenant_sync:acme_corp');
  const [newTtlMs, setNewTtlMs] = useState(30000);
  const [workerName, setWorkerName] = useState('worker-node-alpha-01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testContentionResult, setTestContentionResult] = useState<any | null>(null);

  const canManage = userRole === 'admin' || userRole === 'operator';

  const handleAcquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    setIsSubmitting(true);
    try {
      await onAcquireLock(newKey, newTtlMs, workerName);
      setIsAcquireModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentionTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await onTestContention();
      setTestContentionResult(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Distributed Lock Manager (DLM)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Redlock + Fencing Tokens
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guarantees mutual exclusion and prevents split-brain writes across worker nodes using monotonically increasing 64-bit fencing tokens.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-test-contention"
            onClick={handleContentionTest}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Contention</span>
          </button>

          <button
            id="btn-acquire-lock"
            onClick={() => setIsAcquireModalOpen(true)}
            disabled={!canManage}
            title={!canManage ? 'Requires Operator or Admin role' : ''}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Acquire Lock</span>
          </button>
        </div>
      </div>

      {/* Contention Banner Test Result */}
      {testContentionResult && (
        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-200">
                Lock Contention Test: {testContentionResult.outcome}
              </span>
              <p className="text-amber-300/80">{testContentionResult.details}</p>
              <div className="text-[11px] text-amber-400/60 font-mono">
                Key: {testContentionResult.testKey} • Contention Observed: {testContentionResult.contentionObserved ? 'YES (Mutual Exclusion Verified)' : 'NO'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestContentionResult(null)}
            className="text-amber-400/60 hover:text-amber-300 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Active Leases</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{locks.length}</div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Mutual Exclusion Enforced</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Fencing Token Generator</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
            #{locks[0]?.fencingToken || 1004}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Monotonic 64-bit counter
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Contention Events</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{contentions.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Prevented race conditions
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Auto-Renewal Strategy</span>
          <div className="text-base font-bold text-teal-400 mt-1 flex items-center space-x-1.5">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            <span>Heartbeat Lease</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Auto-reclaimed on stalled node
          </div>
        </div>
      </div>

      {/* Active Locks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Active Distributed Locks</span>
          </h3>
          <span className="text-xs text-slate-400">
            {locks.length} active resource leases
          </span>
        </div>

        {locks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active distributed locks. Click "Acquire Lock" to test mutual exclusion.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {locks.map((lock) => {
              const remainingSec = Math.max(0, Math.round((lock.remainingTtlMs || 0) / 1000));
              const progressPct = Math.min(100, Math.round(( (lock.remainingTtlMs || 0) / lock.ttlMs) * 100));

              return (
                <div key={lock.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {lock.key}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Fencing Token #{lock.fencingToken}
                        </span>
                        {lock.renewCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Renewed {lock.renewCount}x</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Server className="w-3 h-3 text-slate-500" />
                          <span>Holder: <strong className="text-slate-300">{lock.holderWorkerName}</strong></span>
                        </span>
                        <span>Acquired: {new Date(lock.acquiredAt).toLocaleTimeString()}</span>
                        <span>Lease TTL: {lock.ttlMs / 1000}s</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onRenewLock(lock.key, lock.holderWorkerId, lock.fencingToken, 30000)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 text-teal-400" />
                        <span>Renew (+30s)</span>
                      </button>

                      <button
                        onClick={() => onReleaseLock(lock.key, lock.holderWorkerId, lock.fencingToken)}
                        disabled={!canManage}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 disabled:opacity-40 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Release</span>
                      </button>
                    </div>
                  </div>

                  {/* Lease Expiry Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Lease Countdown</span>
                      <span className="font-mono text-amber-400 font-bold">{remainingSec}s remaining</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contention & Race Condition Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Lock Contention & Rejection Audit Log</span>
        </h3>
        <p className="text-xs text-slate-400">
          When multiple nodes attempt to acquire the same resource simultaneously, Redlock safely grants the lease to the first requester and denies subsequent contenders.
        </p>

        {contentions.length === 0 ? (
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
            No lock contentions recorded yet. Click "Simulate Contention" to verify rejection.
          </div>
        ) : (
          <div className="space-y-2">
            {contentions.slice(0, 5).map((c, i) => (
              <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-amber-300 font-bold">{c.key}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      DENIED (409 Contention)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Denied Requester: <strong className="text-slate-300">{c.requestedBy}</strong> • Currently Held By: <strong className="text-slate-300">{c.heldBy}</strong>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(c.deniedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acquire Modal */}
      {isAcquireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Acquire Distributed Lock</span>
              </h3>
              <button
                onClick={() => setIsAcquireModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAcquire} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Resource Lock Key</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="resource:subsystem:task_id"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Lease TTL (Milliseconds)</label>
                <input
                  type="number"
                  value={newTtlMs}
                  onChange={(e) => setNewTtlMs(Number(e.target.value))}
                  min={5000}
                  max={120000}
                  step={5000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Lock automatically expires if not renewed within TTL.</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Holder Worker Node</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAcquireModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30"
                >
                  Acquire Lease
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
