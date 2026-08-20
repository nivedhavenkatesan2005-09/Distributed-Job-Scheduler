import React from 'react';
import {
  Activity,
  Layers,
  Server,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Terminal,
  Radio,
  Cpu,
  Sparkles
} from 'lucide-react';
import { Queue, Job, Worker, SystemMetrics, SystemEvent } from '../types';

interface DashboardViewProps {
  metrics: SystemMetrics | null;
  queues: Queue[];
  recentJobs: Job[];
  workers: Worker[];
  recentEvents: SystemEvent[];
  onNavigateToTab: (tab: string) => void;
  onSelectJob: (job: Job) => void;
  onSpawnTraffic: (burstFailures?: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  queues,
  recentJobs,
  workers,
  recentEvents,
  onNavigateToTab,
  onSelectJob,
  onSpawnTraffic
}) => {
  const history = metrics?.history || [];

  return (
    <div className="space-y-6">
      
      {/* Top Section: Real-Time Throughput Visualizer & Fleet Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): Real-Time Throughput / Minute Stream */}
        <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-stone-100 flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shadow-sm shadow-sky-500/5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span>Distributed Throughput & Backlog Telemetry</span>
              </h3>
              <p className="text-xs text-stone-400">Live processed jobs/min rolling 30-second window</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-sky-400/10 border border-sky-400/20 text-sky-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse ring-2 ring-sky-300/30" />
                <span>{metrics?.systemThroughputPerMin || 48} jobs/min</span>
              </span>
            </div>
          </div>

          {/* Simple Clean SVG Sparkline Chart */}
          <div className="h-44 w-full bg-[#0c0a09] rounded-xl border border-stone-800/80 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                <span>Backlog: {metrics?.queuedJobs || 0} queued</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-300" />
                <span>P95 Latency: {metrics?.p95LatencyMs || 0}ms</span>
              </span>
            </div>

            {/* Sparkline visualization */}
            <div className="h-28 flex items-end space-x-1.5 pt-2">
              {history.map((point, idx) => {
                const maxThroughput = Math.max(...history.map(h => h.throughput), 50);
                const heightPct = Math.max(12, Math.round((point.throughput / maxThroughput) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-sky-500 via-sky-400 to-sky-300 rounded-t-sm transition-all duration-300 group-hover:brightness-125 shadow-sm shadow-sky-900/10"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-stone-800 text-stone-100 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg border border-stone-700 whitespace-nowrap">
                        {point.throughput} req/m • {point.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-1 border-t border-stone-800/50">
              <span>-30 seconds</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* Right (1 col): System Health & Quick Actions */}
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-stone-100 flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-200 shadow-sm shadow-amber-500/5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span>Operational Controls</span>
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onSpawnTraffic(false)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 hover:border-sky-400/30 text-xs font-semibold text-stone-200 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shrink-0 group-hover:scale-105 transition-transform shadow-sm shadow-sky-500/5">
                  <Play className="w-3.5 h-3.5 fill-sky-300" />
                </div>
                <div>
                  <div className="group-hover:text-sky-200 transition-colors">Simulate Traffic Spike</div>
                  <div className="text-[10px] text-stone-400 font-normal">Spawn 10 parallel jobs across queues</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-sky-300 transition-colors" />
            </button>

            <button
              onClick={() => onSpawnTraffic(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-rose-400/10 border border-rose-400/20 flex items-center justify-center text-rose-300 shrink-0 group-hover:scale-105 transition-transform shadow-sm shadow-rose-500/5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="group-hover:text-rose-200 transition-colors">Inject Downstream Errors</div>
                  <div className="text-[10px] text-rose-400/70 font-normal">Test retries, backoff, and DLQ triage</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-300" />
            </button>

            <button
              onClick={() => onNavigateToTab('tests')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-800/80 border border-stone-800 hover:border-emerald-400/30 text-xs font-semibold text-stone-200 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-105 transition-transform shadow-sm shadow-emerald-500/5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="group-hover:text-emerald-200 transition-colors">Run Verification Test Suite</div>
                  <div className="text-[10px] text-stone-400 font-normal">Validate CAS locking & idempotency</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-300 transition-colors" />
            </button>
          </div>

          <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
            <div className="flex justify-between">
              <span>Active Worker Nodes:</span>
              <span className="font-mono text-stone-200">{workers.filter(w => w.status !== 'SHUTDOWN').length} nodes</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Success Rate:</span>
              <span className="font-mono text-emerald-300 font-semibold">{metrics ? ((metrics.completedJobs / Math.max(1, metrics.completedJobs + metrics.failedJobs + metrics.dlqJobs)) * 100).toFixed(1) : 99}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Active Queues Overview */}
      <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-100 flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shadow-sm shadow-sky-500/5">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span>Active Priority Queues</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('queues')}
            className="text-xs text-sky-300 hover:text-sky-200 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>Manage All ({queues.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {queues.slice(0, 4).map((q) => (
            <div
              key={q.id}
              onClick={() => onNavigateToTab('queues')}
              className="p-4 bg-stone-950/70 hover:bg-stone-850 border border-stone-800/80 hover:border-sky-400/30 rounded-xl cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-100 text-xs truncate group-hover:text-sky-200 transition-colors">{q.name}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-400/10 text-sky-300 border border-sky-400/20">
                  P{q.priority}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="p-1.5 bg-stone-900 rounded-lg border border-stone-800/50">
                  <div className="text-[9px] text-stone-500">QUEUED</div>
                  <div className="text-xs font-bold text-amber-200">{q.stats.queuedCount}</div>
                </div>
                <div className="p-1.5 bg-stone-900 rounded-lg border border-stone-800/50">
                  <div className="text-[9px] text-stone-500">RUNNING</div>
                  <div className="text-xs font-bold text-sky-300">{q.stats.runningCount}</div>
                </div>
                <div className="p-1.5 bg-stone-900 rounded-lg border border-stone-800/50">
                  <div className="text-[9px] text-stone-500">DONE</div>
                  <div className="text-xs font-bold text-emerald-300">{q.stats.completedCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span>Limit: {q.rateLimitPerMin} req/m</span>
                <span>Avg: {q.stats.avgExecutionDurationMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Recent Jobs & Real-Time Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Executions */}
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-fuchsia-400/10 border border-fuchsia-400/20 flex items-center justify-center text-fuchsia-300 shadow-sm shadow-fuchsia-500/5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span>Recent Job Executions</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('jobs')}
              className="text-xs text-sky-300 hover:text-sky-200 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="p-3 bg-stone-950/70 hover:bg-stone-850 border border-stone-800/80 hover:border-sky-400/30 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs group"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-semibold text-stone-200 truncate group-hover:text-sky-200 transition-colors">{job.name}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{job.id} • {job.queueName || 'Queue'}</div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.state === 'COMPLETED' ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' :
                    job.state === 'RUNNING' ? 'bg-sky-400/10 text-sky-300 border border-sky-400/20 animate-pulse' :
                    job.state === 'FAILED' || job.state === 'DEAD_LETTERED' ? 'bg-rose-400/10 text-rose-300 border border-rose-400/20' :
                    'bg-amber-400/10 text-amber-200 border border-amber-400/20'
                  }`}>
                    {job.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Event Stream Snippet */}
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shadow-sm shadow-sky-500/5">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span>Real-Time Cluster Event Stream</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('logs')}
              className="text-xs text-sky-300 hover:text-sky-200 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#0c0a09] p-3 rounded-xl border border-stone-800/80 font-mono text-[11px] space-y-2 h-[230px] overflow-y-auto">
            {recentEvents.slice(0, 6).map((evt, idx) => (
              <div key={idx} className="flex items-start space-x-2 leading-tight">
                <span className="text-stone-500 text-[10px] whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-sky-300 font-bold text-[10px]">[{evt.type}]</span>
                <span className="text-stone-300 flex-1 truncate">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
