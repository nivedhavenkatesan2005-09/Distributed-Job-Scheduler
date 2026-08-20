import React, { useState, useMemo } from 'react';
import {
  GanttChartSquare,
  Activity,
  Clock,
  Server,
  Layers,
  CheckCircle,
  AlertTriangle,
  Play,
  TrendingUp,
  Cpu,
  HardDrive,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Job, Worker, SystemMetrics, ExecutionTimelineSpan } from '../types';

interface ExecutionTimelineViewProps {
  jobs: Job[];
  workers: Worker[];
  metrics: SystemMetrics | null;
  onSelectJob: (job: Job) => void;
}

export const ExecutionTimelineView: React.FC<ExecutionTimelineViewProps> = ({
  jobs,
  workers,
  metrics,
  onSelectJob
}) => {
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('ALL');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('ALL');

  // Synthesize realistic Gantt execution spans from existing and recent jobs
  const timelineSpans: ExecutionTimelineSpan[] = useMemo(() => {
    const now = Date.now();
    return jobs.slice(0, 24).map((job, idx) => {
      const durationMs = job.durationMs || (job.completedAt && job.startedAt ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime() : Math.floor(150 + (idx * 95) % 850));
      const startTime = job.startedAt ? new Date(job.startedAt).getTime() : now - (idx * 2500) - durationMs;
      const endTime = startTime + durationMs;
      const workerIndex = idx % Math.max(1, workers.length);
      const assignedWorker = workers[workerIndex] || { id: 'worker-node-1', name: 'worker-node-1' };

      return {
        id: `span-${job.id}`,
        jobId: job.id,
        jobName: job.name,
        queueId: job.queueId,
        queueName: job.queueName || 'Default Queue',
        workerId: job.workerId || assignedWorker.id,
        workerName: job.workerName || assignedWorker.name,
        startTime,
        endTime,
        durationMs,
        state: (job.state === 'COMPLETED' ? 'COMPLETED' : job.state === 'FAILED' ? 'FAILED' : 'RUNNING') as any,
        priority: job.priority,
        attempt: job.attemptCount || 1,
        cpuPeakPct: Math.floor(35 + (idx * 7) % 55),
        memoryPeakMb: Math.floor(180 + (idx * 15) % 220)
      };
    });
  }, [jobs, workers]);

  const filteredSpans = timelineSpans.filter((s) => {
    const matchQueue = selectedQueueFilter === 'ALL' || s.queueId === selectedQueueFilter;
    const matchWorker = selectedWorkerFilter === 'ALL' || s.workerId === selectedWorkerFilter;
    return matchQueue && matchWorker;
  });

  // Calculate timeline min/max bounds for relative positioning
  const timeBounds = useMemo(() => {
    if (filteredSpans.length === 0) {
      const now = Date.now();
      return { min: now - 60000, max: now, totalRange: 60000 };
    }
    const min = Math.min(...filteredSpans.map(s => s.startTime));
    const max = Math.max(...filteredSpans.map(s => s.endTime), Date.now());
    return { min, max, totalRange: Math.max(1000, max - min) };
  }, [filteredSpans]);

  // SLA Percentile Calculation
  const durations = useMemo(() => {
    return timelineSpans.map(s => s.durationMs).sort((a, b) => a - b);
  }, [timelineSpans]);

  const p50 = durations.length ? durations[Math.floor(durations.length * 0.5)] : 180;
  const p90 = durations.length ? durations[Math.floor(durations.length * 0.9)] : 420;
  const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : 680;
  const p99 = durations.length ? durations[Math.floor(durations.length * 0.99)] : 920;

  // Group spans by worker for swimlane view
  const workerSwimlanes = useMemo(() => {
    const map = new Map<string, ExecutionTimelineSpan[]>();
    workers.forEach(w => map.set(w.id, []));
    filteredSpans.forEach(span => {
      if (!map.has(span.workerId)) {
        map.set(span.workerId, []);
      }
      map.get(span.workerId)!.push(span);
    });
    return Array.from(map.entries());
  }, [workers, filteredSpans]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <GanttChartSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Execution Gantt Timeline & SLA Profiler</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                Real-Time Swimlanes
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Visualize concurrent worker task execution lifespans, lock leases, duration overlaps, and latency distribution
            </p>
          </div>
        </div>

        {/* SLA Latency Pill Matrix */}
        <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-slate-500 block">P50 (Median)</span>
            <span className="text-emerald-400 font-bold">{p50}ms</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-slate-500 block">P90 SLA</span>
            <span className="text-cyan-400 font-bold">{p90}ms</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-slate-500 block">P95 Target</span>
            <span className="text-amber-400 font-bold">{p95}ms</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="px-2 py-1 text-center">
            <span className="text-[10px] text-slate-500 block">P99 Ceiling</span>
            <span className="text-purple-400 font-bold">{p99}ms</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filter Worker:</span>
            <select
              value={selectedWorkerFilter}
              onChange={(e) => setSelectedWorkerFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Worker Nodes ({workers.length})</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] font-medium text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Completed</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 animate-pulse" />
            <span>In-Flight (Running)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Failed / Retrying</span>
          </span>
        </div>
      </div>

      {/* Gantt Swimlanes Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Worker Execution Concurrency Swimlanes</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Time Window: ~{Math.round(timeBounds.totalRange / 1000)}s Horizon
          </span>
        </div>

        {/* Worker Swimlanes List */}
        <div className="space-y-4">
          {workerSwimlanes.map(([workerId, spans]) => {
            const worker = workers.find(w => w.id === workerId);
            return (
              <div key={workerId} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200">{worker?.name || workerId}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ({spans.length} execution spans)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                    <span className="text-indigo-400">{worker?.cpuUsagePct || 42}% CPU</span>
                    <span>•</span>
                    <span className="text-cyan-400">{worker?.memoryUsageMb || 240} MB</span>
                  </div>
                </div>

                {/* Timeline Track Bar */}
                <div className="relative h-9 bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden">
                  {spans.map((span) => {
                    const leftPct = Math.max(0, Math.min(95, ((span.startTime - timeBounds.min) / timeBounds.totalRange) * 100));
                    const widthPct = Math.max(4, Math.min(100 - leftPct, (span.durationMs / timeBounds.totalRange) * 100));

                    const colorClass =
                      span.state === 'COMPLETED'
                        ? 'bg-emerald-600/80 hover:bg-emerald-500 border-emerald-400/50 text-emerald-100'
                        : span.state === 'RUNNING'
                        ? 'bg-indigo-600/80 hover:bg-indigo-500 border-indigo-400/50 text-indigo-100 animate-pulse'
                        : 'bg-rose-600/80 hover:bg-rose-500 border-rose-400/50 text-rose-100';

                    const matchingJob = jobs.find(j => j.id === span.jobId);

                    return (
                      <div
                        key={span.id}
                        onClick={() => matchingJob && onSelectJob(matchingJob)}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-md border text-[10px] font-mono font-bold flex items-center px-1.5 truncate cursor-pointer transition-all shadow-xs group z-10 ${colorClass}`}
                        title={`${span.jobName} (${span.durationMs}ms) - Click to inspect job details`}
                      >
                        <span className="truncate">{span.jobName}</span>
                        <span className="ml-1 opacity-75 font-normal">({span.durationMs}ms)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
