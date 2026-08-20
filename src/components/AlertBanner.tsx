import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Sliders,
  ArrowRight,
  CheckCircle2,
  Server,
  Layers,
  Cpu,
  HardDrive,
  Activity,
  BellRing
} from 'lucide-react';
import { ActiveAlertNotification } from '../types';

interface AlertBannerProps {
  alerts: ActiveAlertNotification[];
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
  onOpenThresholdModal: () => void;
  onNavigateToTab: (tab: string) => void;
  onScaleWorkers?: (count: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onDismissAlert,
  onDismissAll,
  onOpenThresholdModal,
  onNavigateToTab,
  onScaleWorkers
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const primaryAlert = alerts[0];
  const hasMultiple = alerts.length > 1;

  const getMetricIcon = (type: ActiveAlertNotification['metricType']) => {
    switch (type) {
      case 'cpu':
        return <Cpu className="w-4 h-4 text-rose-400" />;
      case 'memory':
        return <HardDrive className="w-4 h-4 text-amber-400" />;
      case 'queue_depth':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'cluster_utilization':
        return <Activity className="w-4 h-4 text-rose-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div
      id="system-kpi-alert-banner"
      className="mb-6 rounded-2xl bg-gradient-to-r from-rose-950/90 via-stone-900 to-amber-950/80 border border-rose-500/40 p-4 shadow-lg shadow-rose-950/30 text-stone-100 animate-in slide-in-from-top duration-300"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Alert Icon & Summary */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 mt-0.5 animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                KPI Threshold Breach ({alerts.length})
              </span>
              <span className="text-xs font-bold text-stone-100">
                {primaryAlert.title}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {primaryAlert.message}
            </p>

            <div className="flex items-center space-x-3 text-[11px] font-mono text-stone-400 pt-0.5">
              <span className="text-rose-300 font-bold">
                Current: {primaryAlert.currentValue}{primaryAlert.unit}
              </span>
              <span>•</span>
              <span className="text-stone-400">
                Configured Limit: {primaryAlert.thresholdValue}{primaryAlert.unit}
              </span>
              <span>•</span>
              <span>{new Date(primaryAlert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center flex-wrap gap-2 self-end md:self-center shrink-0">
          
          {primaryAlert.metricType === 'cpu' || primaryAlert.metricType === 'cluster_utilization' ? (
            <button
              onClick={() => onNavigateToTab('workers')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Scale Fleet</span>
            </button>
          ) : primaryAlert.metricType === 'queue_depth' ? (
            <button
              onClick={() => onNavigateToTab('queues')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect Queues</span>
            </button>
          ) : null}

          {/* Adjust Thresholds */}
          <button
            onClick={onOpenThresholdModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-stone-100 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            title="Configure Alert Threshold Limits"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Thresholds</span>
          </button>

          {/* Multi-alert Expand toggle */}
          {hasMultiple && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
            >
              {isExpanded ? 'Collapse' : `+${alerts.length - 1} More`}
            </button>
          )}

          {/* Dismiss Alert */}
          <button
            onClick={() => onDismissAlert(primaryAlert.id)}
            className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            title="Acknowledge and dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Multi-Alerts Breakdown */}
      {isExpanded && alerts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
            <span>All Active Threshold Violations:</span>
            <button
              onClick={onDismissAll}
              className="text-rose-400 hover:text-rose-300 font-medium underline cursor-pointer"
            >
              Acknowledge All ({alerts.length})
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  {getMetricIcon(alert.metricType)}
                  <span className="font-semibold text-stone-200">{alert.title}:</span>
                  <span className="text-stone-400 font-mono">
                    {alert.currentValue}{alert.unit} &gt; {alert.thresholdValue}{alert.unit}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
