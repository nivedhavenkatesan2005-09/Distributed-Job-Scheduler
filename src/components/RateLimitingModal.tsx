import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Zap,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  Activity,
  Layers
} from 'lucide-react';
import { TokenBucketStatus, Queue } from '../types';

interface RateLimitingModalProps {
  isOpen: boolean;
  onClose: () => void;
  queues: Queue[];
  onUpdateRateLimit: (queueId: string, rpm: number) => Promise<any>;
  onTestBurst: (queueId: string, count: number) => Promise<any>;
  userRole?: string;
}

export const RateLimitingModal: React.FC<RateLimitingModalProps> = ({
  isOpen,
  onClose,
  queues,
  onUpdateRateLimit,
  onTestBurst,
  userRole = 'admin'
}) => {
  const [selectedQueueId, setSelectedQueueId] = useState<string>(queues[0]?.id || 'q-critical');
  const [rateLimitPerMin, setRateLimitPerMin] = useState<number>(300);
  const [burstCount, setBurstCount] = useState<number>(25);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [burstTestResults, setBurstTestResults] = useState<any | null>(null);

  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0];

  useEffect(() => {
    if (selectedQueue) {
      setRateLimitPerMin(selectedQueue.rateLimitPerMin || 300);
    }
  }, [selectedQueueId, selectedQueue]);

  if (!isOpen) return null;

  const canManage = userRole === 'admin' || userRole === 'operator';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateRateLimit(selectedQueueId, rateLimitPerMin);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBurstTest = async () => {
    setIsTesting(true);
    try {
      const res = await onTestBurst(selectedQueueId, burstCount);
      setBurstTestResults(res);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Token Bucket Rate Limiter</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HTTP 429 Throttle Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure throughput rates, refill frequency, and simulate burst traffic exhaustion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Queue Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-semibold">Select Target Queue</label>
          <select
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          >
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.rateLimitPerMin || 300} req/min)
              </option>
            ))}
          </select>
        </div>

        {/* Token Bucket Metrics & Config */}
        <form onSubmit={handleUpdate} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Rate Limit Configuration</span>
            <span className="text-[11px] text-amber-400 font-mono">
              Refill: {((rateLimitPerMin || 300) / 60).toFixed(1)} tokens/sec
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Requests Per Minute (RPM)</label>
              <input
                type="number"
                value={rateLimitPerMin}
                onChange={(e) => setRateLimitPerMin(Number(e.target.value))}
                min={10}
                max={5000}
                step={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Calculated Burst Capacity</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono">
                {Math.max(20, Math.round(rateLimitPerMin / 2))} Tokens Max Headroom
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating || !canManage}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/30 transition-colors"
          >
            {isUpdating ? 'Saving...' : 'Apply Rate Limit to Queue'}
          </button>
        </form>

        {/* Burst Stress Test Section */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Burst Ingestion Stress Test</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Fires consecutive requests to observe HTTP 429 throttling
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={burstCount}
              onChange={(e) => setBurstCount(Number(e.target.value))}
              min={5}
              max={50}
              className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              placeholder="e.g. 25"
            />
            <span className="text-xs text-slate-400">Rapid Requests</span>

            <button
              type="button"
              onClick={handleBurstTest}
              disabled={isTesting}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTesting ? 'Simulating Traffic...' : 'Execute Burst Stress Test'}</span>
            </button>
          </div>

          {/* Test Feedback Cards */}
          {burstTestResults && (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-200">Stress Test Summary:</span>
                <span className="text-amber-400 font-mono">
                  {burstTestResults.allowedCount} Allowed • {burstTestResults.throttledCount} Throttled (429)
                </span>
              </div>

              <div className="flex flex-wrap gap-1 pt-1 max-h-32 overflow-y-auto">
                {burstTestResults.attempts?.map((a: any) => (
                  <div
                    key={a.attempt}
                    className={`px-2 py-1 rounded text-[10px] font-mono flex items-center space-x-1 ${
                      a.allowed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span>#{a.attempt}</span>
                    {a.allowed ? <span>OK ({a.remainingTokens} tok)</span> : <span>429 (Wait {a.retryAfterMs / 1000}s)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
