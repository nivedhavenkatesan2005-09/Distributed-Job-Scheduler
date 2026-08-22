import React, { useState } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Power,
  Pause,
  Play,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Worker } from '../types';

interface WorkerFleetProps {
  workers: Worker[];
  onScaleFleet: (targetCount: number) => void;
  onShutdownWorker: (workerId: string) => void;
  onPauseWorker: (workerId: string) => void;
}

export const WorkerFleet: React.FC<WorkerFleetProps> = ({
  workers,
  onScaleFleet,
  onShutdownWorker,
  onPauseWorker
}) => {
  const [scaleCount, setScaleCount] = useState(workers.length);

  const activeNodes = workers.filter((w) => w.status === 'HEALTHY' || w.status === 'BUSY' || w.status === 'IDLE');
  const totalConcurrency = workers.reduce((acc, w) => acc + (w.status !== 'SHUTDOWN' ? w.concurrencyLimit : 0), 0);
  const activeJobs = workers.reduce((acc, w) => acc + w.activeJobsCount, 0);

  const handleScaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScaleFleet(scaleCount);
  };

  const getStatusBadge = (status: Worker['status']) => {
    switch (status) {
      case 'HEALTHY':
      case 'IDLE':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>HEALTHY</span>
          </span>
        );
      case 'BUSY':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
            <span>BUSY</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
            PAUSED
          </span>
        );
      case 'STALLED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-400/20 text-rose-300 border border-rose-400/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>STALLED</span>
          </span>
        );
      case 'SHUTDOWN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700">
            SHUTDOWN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cluster Overview Header & Scaling Controls */}
      <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-100 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shadow-sm shadow-sky-500/5">
              <Server className="w-4.5 h-4.5" />
            </div>
            <span>Worker Fleet Orchestrator & Auto-Scaler</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Autonomous worker cluster pulling atomic queue locks with heartbeat monitoring and lease expiration reaper.
          </p>
        </div>

        {/* Fleet Auto-Scaler */}
        <form onSubmit={handleScaleSubmit} className="flex items-center space-x-2 bg-stone-950 p-2 rounded-xl border border-stone-800 text-xs">
          <Sliders className="w-4 h-4 text-sky-300" />
          <span className="text-stone-300 font-semibold">Cluster Size:</span>
          <input
            type="number"
            min="1"
            max="12"
            value={scaleCount}
            onChange={(e) => setScaleCount(Number(e.target.value))}
            className="w-14 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-100 text-center font-mono font-bold focus:outline-none focus:border-sky-400"
          />
          <span className="text-stone-500">nodes</span>
          <button
            type="submit"
            id="btn-scale-fleet"
            className="px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 rounded-lg font-semibold transition-all shadow-sm shadow-sky-900/10 cursor-pointer"
          >
            Apply Scale
          </button>
        </form>
      </div>

      {/* Cluster Stats Summary (4 distinct colored decks) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-gradient-to-br from-sky-950/30 via-stone-900/90 to-stone-900/90 border border-sky-500/30 hover:border-sky-400/60 rounded-xl space-y-1 shadow-sm transition-all">
          <div className="flex items-center space-x-2 text-[10px] text-stone-400 uppercase font-semibold">
            <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
              <Server className="w-3 h-3" />
            </div>
            <span>Active Fleet Nodes</span>
          </div>
          <div className="text-xl font-bold font-mono text-sky-300 mt-1">
            {activeNodes.length} <span className="text-xs text-stone-400 font-normal">/ {workers.length} total</span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-indigo-950/30 via-stone-900/90 to-stone-900/90 border border-indigo-500/30 hover:border-indigo-400/60 rounded-xl space-y-1 shadow-sm transition-all">
          <div className="flex items-center space-x-2 text-[10px] text-stone-400 uppercase font-semibold">
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Activity className="w-3 h-3" />
            </div>
            <span>Concurrent Slot Capacity</span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {activeJobs} <span className="text-xs text-stone-400 font-normal">/ {totalConcurrency} active</span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-950/30 via-stone-900/90 to-stone-900/90 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl space-y-1 shadow-sm transition-all">
          <div className="flex items-center space-x-2 text-[10px] text-stone-400 uppercase font-semibold">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <CheckCircle className="w-3 h-3" />
            </div>
            <span>Avg Heartbeat Latency</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            &lt; 3.0s <span className="text-xs text-stone-400 font-normal">(Healthy)</span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-fuchsia-950/30 via-stone-900/90 to-stone-900/90 border border-fuchsia-500/30 hover:border-fuchsia-400/60 rounded-xl space-y-1 shadow-sm transition-all">
          <div className="flex items-center space-x-2 text-[10px] text-stone-400 uppercase font-semibold">
            <div className="w-5 h-5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center border border-fuchsia-400/30">
              <Clock className="w-3 h-3" />
            </div>
            <span>Lease Recovery Reaper</span>
          </div>
          <div className="text-xl font-bold font-mono text-fuchsia-300 mt-1">
            15s <span className="text-xs text-stone-400 font-normal">TTL threshold</span>
          </div>
        </div>
      </div>

      {/* Worker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => {
          const isShutdown = worker.status === 'SHUTDOWN';
          const concurrencyPct = Math.round((worker.activeJobsCount / worker.concurrencyLimit) * 100);

          const workerDeckStyle = worker.status === 'BUSY'
            ? 'bg-gradient-to-br from-sky-950/30 via-stone-900/95 to-stone-900 border-sky-500/30 hover:border-sky-400/60'
            : worker.status === 'HEALTHY' || worker.status === 'IDLE'
            ? 'bg-gradient-to-br from-emerald-950/30 via-stone-900/95 to-stone-900 border-emerald-500/30 hover:border-emerald-400/60'
            : worker.status === 'PAUSED'
            ? 'bg-gradient-to-br from-amber-950/30 via-stone-900/95 to-stone-900 border-amber-500/30 hover:border-amber-400/60'
            : worker.status === 'STALLED'
            ? 'bg-gradient-to-br from-rose-950/30 via-stone-900/95 to-stone-900 border-rose-500/40 hover:border-rose-400/70'
            : 'bg-stone-950/40 border-stone-800/40 opacity-60';

          return (
            <div
              key={worker.id}
              id={`worker-node-${worker.id}`}
              className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${workerDeckStyle}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300 shrink-0 shadow-sm shadow-sky-500/5">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-stone-100 text-sm">{worker.name}</h3>
                      <span className="text-[10px] font-mono text-stone-500">{worker.version}</span>
                    </div>
                    <p className="text-[11px] font-mono text-stone-400">{worker.hostname} • {worker.ipAddress}</p>
                  </div>
                </div>
                {getStatusBadge(worker.status)}
              </div>

              {/* Concurrency Bar */}
              <div className="space-y-1.5 p-3 bg-stone-950/70 rounded-xl border border-stone-800/80 text-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-300" />
                    <span>Slot Utilization</span>
                  </span>
                  <span className="font-mono text-stone-200 font-semibold">
                    {worker.activeJobsCount} / {worker.concurrencyLimit} tasks
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-300"
                    style={{ width: `${concurrencyPct}%` }}
                  />
                </div>
              </div>

              {/* Hardware Telemetry Gauges (CPU & RAM) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* CPU */}
                <div className="p-2.5 bg-stone-950/50 rounded-xl border border-stone-800/60">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <div className="w-4 h-4 rounded bg-sky-400/10 flex items-center justify-center text-sky-300">
                        <Cpu className="w-2.5 h-2.5" />
                      </div>
                      <span>CPU</span>
                    </span>
                    <span className="font-mono text-stone-200">{worker.cpuUsagePct}%</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${worker.cpuUsagePct > 80 ? 'bg-rose-400' : 'bg-sky-400'}`}
                      style={{ width: `${worker.cpuUsagePct}%` }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="p-2.5 bg-stone-950/50 rounded-xl border border-stone-800/60">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <div className="w-4 h-4 rounded bg-fuchsia-400/10 flex items-center justify-center text-fuchsia-300">
                        <HardDrive className="w-2.5 h-2.5" />
                      </div>
                      <span>RAM</span>
                    </span>
                    <span className="font-mono text-stone-200">{worker.memoryUsageMb} MB</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fuchsia-400"
                      style={{ width: `${Math.min(100, (worker.memoryUsageMb / 1024) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lifetime Stats & Heartbeat Time */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-800">
                <div className="flex items-center space-x-1.5 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{worker.totalCompletedJobs} done</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  HB: {new Date(worker.lastHeartbeatAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* Worker Node Actions */}
              {!isShutdown && (
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => onPauseWorker(worker.id)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-750 rounded-lg transition-colors cursor-pointer"
                  >
                    {worker.status === 'PAUSED' ? (
                      <>
                        <Play className="w-3 h-3 text-sky-300" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-amber-300" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onShutdownWorker(worker.id)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-rose-300 hover:text-white bg-rose-900/20 hover:bg-rose-900/40 border border-rose-400/20 rounded-lg transition-colors cursor-pointer"
                    title="Gracefully drain and shutdown worker node"
                  >
                    <Power className="w-3 h-3 text-rose-300" />
                    <span>Drain</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
