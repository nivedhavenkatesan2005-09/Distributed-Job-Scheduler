import React, { useState } from 'react';
import {
  Server,
  Layers,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Sliders,
  ShieldAlert,
  BellRing,
  Activity,
  Cpu,
  Flame,
  Zap
} from 'lucide-react';
import { SystemMetrics, ActiveAlertNotification, ThemeMode } from '../types';

interface MetricCardsProps {
  metrics: SystemMetrics | null;
  onNavigateToTab: (tab: string) => void;
  onOpenAlertSettings?: () => void;
  activeAlerts?: ActiveAlertNotification[];
  currentTheme?: ThemeMode;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  onNavigateToTab,
  onOpenAlertSettings,
  activeAlerts = [],
  currentTheme = 'cyber'
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const hasWorkerAlert = activeAlerts.some(a => a.metricType === 'cpu' || a.metricType === 'memory' || a.metricType === 'cluster_utilization');
  const hasQueueAlert = activeAlerts.some(a => a.metricType === 'queue_depth');
  const hasErrorAlert = activeAlerts.some(a => a.metricType === 'error_rate');

  const successCount = metrics.completedJobs;
  const total = metrics.completedJobs + metrics.failedJobs + metrics.dlqJobs;
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '99.2';

  const downloadMetricsCsv = () => {
    const timestamp = new Date().toISOString();
    const rows = [
      ['Metric Category', 'Metric Name', 'Metric Key', 'Value', 'Unit / Details', 'Timestamp'],
      ['Cluster Fleet', 'Active Workers', 'active_workers', metrics.activeWorkers, 'Nodes', timestamp],
      ['Cluster Fleet', 'Total Registered Workers', 'total_workers', metrics.totalWorkers, 'Nodes', timestamp],
      ['Cluster Fleet', 'Cluster Concurrency Utilization', 'cluster_utilization_pct', `${metrics.clusterUtilizationPct}%`, 'Percent', timestamp],
      ['Job Queue', 'Queued Backlog', 'queued_jobs', metrics.queuedJobs, 'Pending jobs', timestamp],
      ['Job Queue', 'Running Tasks', 'running_jobs', metrics.runningJobs, 'Active execution leases', timestamp],
      ['Throughput & SLA', 'System Throughput', 'throughput_per_min', `${metrics.systemThroughputPerMin}/min`, 'Jobs processed per minute', timestamp],
      ['Throughput & SLA', 'P95 Execution Latency', 'p95_latency_ms', `${metrics.p95LatencyMs}ms`, 'Milliseconds', timestamp],
      ['Throughput & SLA', 'Average Execution Latency', 'avg_latency_ms', `${metrics.avgLatencyMs}ms`, 'Milliseconds', timestamp],
      ['Reliability & DLQ', 'Dead Letter Queue Jobs', 'dlq_jobs', metrics.dlqJobs, 'Unrecoverable failures', timestamp],
      ['Reliability & DLQ', 'Completed Jobs Count', 'completed_jobs', metrics.completedJobs, 'Successfully executed jobs', timestamp],
      ['Reliability & DLQ', 'Failed Jobs Count', 'failed_jobs', metrics.failedJobs, 'Jobs that incurred errors', timestamp],
      ['Reliability & DLQ', 'System Success Rate', 'success_rate', `${successRate}%`, 'Percentage', timestamp]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hyperplane-metrics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Aesthetic glowing badge icons with premium distinct color accents for each deck
  const cards = [
    {
      id: 'metric-active-workers',
      title: 'Worker Fleet',
      value: `${metrics.activeWorkers}/${metrics.totalWorkers}`,
      subtext: `${metrics.clusterUtilizationPct}% Cluster Concurrency`,
      icon: Server,
      iconColor: 'text-sky-300',
      iconGlow: 'bg-sky-500/20 border-sky-400/30 text-sky-200 shadow-md shadow-sky-500/10',
      color: hasWorkerAlert ? 'text-rose-300' : 'text-sky-300',
      bg: hasWorkerAlert
        ? 'bg-rose-950/40 border-rose-400/40 ring-1 ring-rose-400/30 animate-pulse'
        : 'bg-gradient-to-br from-sky-950/30 via-stone-900/90 to-stone-900/90 border-sky-500/30 hover:border-sky-400/60 shadow-sky-950/20',
      tab: 'workers',
      alertBadge: hasWorkerAlert ? 'HIGH LOAD' : null
    },
    {
      id: 'metric-queued-jobs',
      title: 'Queued Backlog',
      value: metrics.queuedJobs,
      subtext: 'Pending worker claim',
      icon: Layers,
      iconColor: 'text-amber-300',
      iconGlow: 'bg-amber-500/20 border-amber-400/30 text-amber-200 shadow-md shadow-amber-500/10',
      color: hasQueueAlert ? 'text-rose-300' : 'text-amber-300',
      bg: hasQueueAlert
        ? 'bg-amber-950/40 border-amber-400/40 ring-1 ring-amber-400/30 animate-pulse'
        : 'bg-gradient-to-br from-amber-950/30 via-stone-900/90 to-stone-900/90 border-amber-500/30 hover:border-amber-400/60 shadow-amber-950/20',
      tab: 'jobs',
      alertBadge: hasQueueAlert ? 'BACKLOG EXCEEDED' : null
    },
    {
      id: 'metric-running-jobs',
      title: 'Running Tasks',
      value: metrics.runningJobs,
      subtext: 'Active execution leases',
      icon: PlayCircle,
      iconColor: 'text-indigo-300',
      iconGlow: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200 shadow-md shadow-indigo-500/10',
      color: 'text-indigo-300',
      bg: 'bg-gradient-to-br from-indigo-950/30 via-stone-900/90 to-stone-900/90 border-indigo-500/30 hover:border-indigo-400/60 shadow-indigo-950/20',
      tab: 'jobs'
    },
    {
      id: 'metric-throughput',
      title: 'Throughput',
      value: `${metrics.systemThroughputPerMin}/m`,
      subtext: 'Processed / minute',
      icon: TrendingUp,
      iconColor: 'text-emerald-300',
      iconGlow: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 shadow-md shadow-emerald-500/10',
      color: 'text-emerald-300',
      bg: 'bg-gradient-to-br from-emerald-950/30 via-stone-900/90 to-stone-900/90 border-emerald-500/30 hover:border-emerald-400/60 shadow-emerald-950/20',
      tab: 'dashboard'
    },
    {
      id: 'metric-p95-latency',
      title: 'P95 Latency',
      value: `${metrics.p95LatencyMs}ms`,
      subtext: `Avg: ${metrics.avgLatencyMs}ms`,
      icon: Clock,
      iconColor: 'text-fuchsia-300',
      iconGlow: 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200 shadow-md shadow-fuchsia-500/10',
      color: 'text-fuchsia-300',
      bg: 'bg-gradient-to-br from-fuchsia-950/30 via-stone-900/90 to-stone-900/90 border-fuchsia-500/30 hover:border-fuchsia-400/60 shadow-fuchsia-950/20',
      tab: 'dashboard'
    },
    {
      id: 'metric-dlq',
      title: 'Dead Letter Queue',
      value: metrics.dlqJobs,
      subtext: 'Exhausted retries',
      icon: AlertTriangle,
      iconColor: metrics.dlqJobs > 0 ? 'text-rose-300' : 'text-stone-400',
      iconGlow: metrics.dlqJobs > 0
        ? 'bg-rose-500/20 border-rose-400/30 text-rose-200 shadow-md shadow-rose-500/10'
        : 'bg-stone-800/60 border-stone-700/50 text-stone-400',
      color: metrics.dlqJobs > 0 ? 'text-rose-300' : 'text-stone-400',
      bg: metrics.dlqJobs > 0
        ? 'bg-gradient-to-br from-rose-950/40 via-stone-900/90 to-stone-900/90 border-rose-500/40 hover:border-rose-400/70 shadow-rose-950/20'
        : 'bg-stone-900/90 hover:border-stone-700 border-stone-800',
      tab: 'dlq'
    },
    {
      id: 'metric-success-rate',
      title: 'Success Rate',
      value: `${successRate}%`,
      subtext: `${metrics.completedJobs} completed`,
      icon: CheckCircle,
      iconColor: hasErrorAlert ? 'text-rose-300' : 'text-teal-300',
      iconGlow: hasErrorAlert
        ? 'bg-rose-500/20 border-rose-400/30 text-rose-200'
        : 'bg-teal-500/20 border-teal-400/30 text-teal-200 shadow-md shadow-teal-500/10',
      color: hasErrorAlert ? 'text-rose-300' : 'text-teal-300',
      bg: hasErrorAlert
        ? 'bg-rose-950/30 border-rose-400/40'
        : 'bg-gradient-to-br from-teal-950/30 via-stone-900/90 to-stone-900/90 border-teal-500/30 hover:border-teal-400/60 shadow-teal-950/20',
      tab: 'dashboard'
    }
  ];

  return (
    <div className="space-y-2.5 mb-6">
      {/* Header bar with Alert Controls & CSV Export */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-300">
            <Activity className="w-3 h-3" />
          </div>
          <span>Real-Time Cluster Telemetry</span>
          {activeAlerts.length > 0 && (
            <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30 animate-pulse font-mono lowercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300" />
              <span>{activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''} active</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Configure Thresholds Button */}
          {onOpenAlertSettings && (
            <button
              id="btn-open-alert-thresholds"
              onClick={onOpenAlertSettings}
              className={`flex items-center space-x-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors shadow-sm cursor-pointer ${
                activeAlerts.length > 0
                  ? 'bg-rose-950/40 text-rose-300 border-rose-400/40 hover:bg-rose-900/50'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-sky-300 border-stone-800 hover:border-sky-400/40'
              }`}
              title="Configure SLA KPI alert threshold limits for CPU, Memory, Queue Depth"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-300" />
              <span>Alert Thresholds</span>
            </button>
          )}

          {/* Download CSV Button */}
          <button
            id="btn-download-metrics-csv"
            onClick={downloadMetricsCsv}
            className="flex items-center space-x-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-sky-300 border border-stone-800 hover:border-sky-400/40 transition-colors shadow-sm cursor-pointer"
            title="Export system performance metrics as CSV"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300 font-semibold">Metrics Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span>Download CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              onClick={() => onNavigateToTab(card.tab)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 shadow-sm relative overflow-hidden group ${card.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 truncate">
                  {card.title}
                </span>
                {/* Visual Icon with refined glowing chip */}
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${card.iconGlow}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-stone-100 font-mono tracking-tight flex items-baseline justify-between">
                <span>{card.value}</span>
                {card.alertBadge && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-400/20 text-rose-300 border border-rose-400/30 uppercase tracking-wider font-sans">
                    {card.alertBadge}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-1">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
