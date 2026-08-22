import React, { useState } from 'react';
import {
  Layers,
  Play,
  Pause,
  Trash2,
  Settings2,
  Plus,
  Zap,
  Clock,
  ShieldAlert,
  Gauge,
  Sliders,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Queue, RetryPolicy } from '../types';

interface QueueManagerProps {
  queues: Queue[];
  onTogglePause: (queueId: string, isPaused: boolean) => void;
  onPurgeQueue: (queueId: string) => void;
  onUpdateQueue: (queueId: string, updates: Partial<Queue>) => void;
  onCreateQueue: (data: any) => void;
  onSelectQueueForFilter?: (queueId: string) => void;
  onOpenRateLimits?: () => void;
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  queues,
  onTogglePause,
  onPurgeQueue,
  onUpdateQueue,
  onCreateQueue,
  onSelectQueueForFilter,
  onOpenRateLimits
}) => {
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for create
  const [newQueueName, setNewQueueName] = useState('');
  const [newQueueSlug, setNewQueueSlug] = useState('');
  const [newQueuePriority, setNewQueuePriority] = useState(5);
  const [newQueueConcurrency, setNewQueueConcurrency] = useState(10);
  const [newQueueRateLimit, setNewQueueRateLimit] = useState(300);
  const [newQueueStrategy, setNewQueueStrategy] = useState('pol-exp-jitter');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateQueue({
      name: newQueueName,
      slug: newQueueSlug || newQueueName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      priority: newQueuePriority,
      maxConcurrency: newQueueConcurrency,
      rateLimitPerMin: newQueueRateLimit,
      retryPolicyId: newQueueStrategy,
      dlqEnabled: true
    });
    setNewQueueName('');
    setNewQueueSlug('');
    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue) return;
    onUpdateQueue(editingQueue.id, {
      name: editingQueue.name,
      priority: editingQueue.priority,
      maxConcurrency: editingQueue.maxConcurrency,
      rateLimitPerMin: editingQueue.rateLimitPerMin,
      retryPolicyId: editingQueue.retryPolicyId,
      dlqEnabled: editingQueue.dlqEnabled
    });
    setEditingQueue(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Add Queue Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Job Queues & Priority Orchestrator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure weighted priority polling, concurrency ceilings, token-bucket rate limiters, and backoff retry rules.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onOpenRateLimits && (
            <button
              id="btn-open-rate-limits"
              onClick={onOpenRateLimits}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>Rate Limiting (Token Bucket)</span>
            </button>
          )}
          <button
            id="btn-create-queue"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Queue</span>
          </button>
        </div>
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queues.map((q) => {
          const concurrencyPct = Math.min(100, Math.round((q.stats.runningCount / q.maxConcurrency) * 100));

          // Color-coded deck styles based on queue priority/tier
          const isCritical = q.priority >= 8;
          const isHigh = q.priority >= 5 && q.priority < 8;
          const isDefault = q.priority >= 3 && q.priority < 5;

          const deckStyle = isCritical
            ? {
                border: 'border-rose-500/40 hover:border-rose-400/70',
                bg: 'bg-gradient-to-br from-rose-950/25 via-slate-900/95 to-slate-900',
                badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                accentText: 'text-rose-400',
                barGradient: 'from-rose-500 to-amber-500'
              }
            : isHigh
            ? {
                border: 'border-amber-500/40 hover:border-amber-400/70',
                bg: 'bg-gradient-to-br from-amber-950/25 via-slate-900/95 to-slate-900',
                badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                accentText: 'text-amber-400',
                barGradient: 'from-amber-500 to-yellow-400'
              }
            : isDefault
            ? {
                border: 'border-cyan-500/40 hover:border-cyan-400/70',
                bg: 'bg-gradient-to-br from-cyan-950/25 via-slate-900/95 to-slate-900',
                badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                accentText: 'text-cyan-400',
                barGradient: 'from-cyan-500 to-sky-400'
              }
            : {
                border: 'border-emerald-500/40 hover:border-emerald-400/70',
                bg: 'bg-gradient-to-br from-emerald-950/25 via-slate-900/95 to-slate-900',
                badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                accentText: 'text-emerald-400',
                barGradient: 'from-emerald-500 to-teal-400'
              };

          return (
            <div
              key={q.id}
              id={`queue-card-${q.id}`}
              className={`${deckStyle.bg} border ${deckStyle.border} rounded-2xl p-5 transition-all shadow-sm shadow-black/40 relative ${
                q.isPaused ? 'border-amber-500/40 opacity-85' : ''
              }`}
            >
              {/* Top Queue Bar */}
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 text-base">{q.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {q.slug}
                    </span>
                    {q.isPaused && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        PAUSED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{q.description || 'General asynchronous processing queue'}</p>
                </div>

                {/* Priority Badge */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md mt-0.5 border ${deckStyle.badge}`}>
                    Weight {q.priority}/10
                  </span>
                </div>
              </div>

              {/* Concurrency & Rate Limit Gauges */}
              <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                {/* Concurrency usage */}
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <Gauge className={`w-3.5 h-3.5 ${deckStyle.accentText}`} />
                      <span>Concurrency</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">{q.stats.runningCount} / {q.maxConcurrency} slots</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${deckStyle.barGradient} transition-all duration-300`}
                      style={{ width: `${concurrencyPct}%` }}
                    />
                  </div>
                </div>

                {/* Rate Limit */}
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rate Limit</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">{q.rateLimitPerMin} req/m</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-3/4" />
                  </div>
                </div>
              </div>

              {/* Live Status Counter Pills */}
              <div className="grid grid-cols-5 gap-1.5 my-3 text-center">
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 uppercase">Queued</div>
                  <div className="text-sm font-bold font-mono text-amber-300">{q.stats.queuedCount}</div>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 uppercase">Running</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{q.stats.runningCount}</div>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 uppercase">Done</div>
                  <div className="text-sm font-bold font-mono text-emerald-300">{q.stats.completedCount}</div>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 uppercase">Failed</div>
                  <div className="text-sm font-bold font-mono text-rose-400">{q.stats.failedCount}</div>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 uppercase">DLQ</div>
                  <div className="text-sm font-bold font-mono text-purple-300">{q.stats.dlqCount}</div>
                </div>
              </div>

              {/* Policy & Duration Footnote */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-1.5 truncate">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">Policy: {q.retryPolicy?.name || 'Exponential Backoff'}</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-slate-300 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Avg {q.stats.avgExecutionDurationMs}ms</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-800">
                {onSelectQueueForFilter && (
                  <button
                    onClick={() => onSelectQueueForFilter(q.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    View Jobs
                  </button>
                )}

                <button
                  id={`btn-toggle-pause-${q.id}`}
                  onClick={() => onTogglePause(q.id, !q.isPaused)}
                  className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    q.isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {q.isPaused ? (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  id={`btn-configure-${q.id}`}
                  onClick={() => setEditingQueue(q)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Configure queue parameters"
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                <button
                  id={`btn-purge-${q.id}`}
                  onClick={() => {
                    if (confirm(`Purge all pending jobs from queue "${q.name}"?`)) {
                      onPurgeQueue(q.id);
                    }
                  }}
                  className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors"
                  title="Purge pending jobs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Queue Modal */}
      {editingQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Configure Queue: {editingQueue.name}</span>
              </h3>
              <button
                onClick={() => setEditingQueue(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Queue Name</label>
                <input
                  type="text"
                  value={editingQueue.name}
                  onChange={(e) => setEditingQueue({ ...editingQueue, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority Weight (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingQueue.priority}
                    onChange={(e) => setEditingQueue({ ...editingQueue, priority: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Concurrency Ceiling</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingQueue.maxConcurrency}
                    onChange={(e) => setEditingQueue({ ...editingQueue, maxConcurrency: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Token-Bucket Rate Limit (req/min)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={editingQueue.rateLimitPerMin}
                  onChange={(e) => setEditingQueue({ ...editingQueue, rateLimitPerMin: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Retry Policy</label>
                <select
                  value={editingQueue.retryPolicyId}
                  onChange={(e) => setEditingQueue({ ...editingQueue, retryPolicyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pol-exp-jitter">Exponential Backoff with Full Jitter (Max 4 Retries)</option>
                  <option value="pol-linear">Linear Step Backoff (10s increments, Max 3)</option>
                  <option value="pol-fixed">Fixed Interval (3s, Max 2)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-dlq"
                  checked={editingQueue.dlqEnabled}
                  onChange={(e) => setEditingQueue({ ...editingQueue, dlqEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-dlq" className="text-slate-300 cursor-pointer">
                  Route permanent failures to Dead Letter Queue (DLQ)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingQueue(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Queue Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Provision New Job Queue</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Queue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Video Rendering Cluster"
                  value={newQueueName}
                  onChange={(e) => setNewQueueName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Slug (Identifier)</label>
                <input
                  type="text"
                  placeholder="video-rendering"
                  value={newQueueSlug}
                  onChange={(e) => setNewQueueSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newQueuePriority}
                    onChange={(e) => setNewQueuePriority(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Concurrency</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newQueueConcurrency}
                    onChange={(e) => setNewQueueConcurrency(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Rate Limit (req/minute)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={newQueueRateLimit}
                  onChange={(e) => setNewQueueRateLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Retry Policy</label>
                <select
                  value={newQueueStrategy}
                  onChange={(e) => setNewQueueStrategy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pol-exp-jitter">Exponential Backoff with Full Jitter (Default)</option>
                  <option value="pol-linear">Linear Step Backoff (10s)</option>
                  <option value="pol-fixed">Fixed Delay (3s)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  Create Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
