import React, { useState } from 'react';
import {
  X,
  Bell,
  Cpu,
  HardDrive,
  Layers,
  AlertTriangle,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { AlertThresholdConfig } from '../types';

interface AlertThresholdModalProps {
  config: AlertThresholdConfig;
  onSave: (newConfig: AlertThresholdConfig) => void;
  onClose: () => void;
  onTriggerTestAlert: () => void;
}

export const AlertThresholdModal: React.FC<AlertThresholdModalProps> = ({
  config,
  onSave,
  onClose,
  onTriggerTestAlert
}) => {
  const [formData, setFormData] = useState<AlertThresholdConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applyPreset = (preset: 'strict' | 'standard' | 'relaxed') => {
    if (preset === 'strict') {
      setFormData({
        enabled: true,
        cpuLimitPct: 60,
        memoryLimitMb: 300,
        queueDepthLimit: 8,
        errorRateLimitPct: 5,
        clusterUtilizationLimitPct: 70,
        soundEnabled: formData.soundEnabled
      });
    } else if (preset === 'standard') {
      setFormData({
        enabled: true,
        cpuLimitPct: 75,
        memoryLimitMb: 400,
        queueDepthLimit: 15,
        errorRateLimitPct: 10,
        clusterUtilizationLimitPct: 85,
        soundEnabled: formData.soundEnabled
      });
    } else {
      setFormData({
        enabled: true,
        cpuLimitPct: 90,
        memoryLimitMb: 480,
        queueDepthLimit: 30,
        errorRateLimitPct: 20,
        clusterUtilizationLimitPct: 95,
        soundEnabled: formData.soundEnabled
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="alert-thresholds-modal"
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Configure KPI Alert Thresholds</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  SLA Monitor
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Trigger instant UI notification banners when cluster telemetry violates operational limits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {/* Master Enable & Sound Toggle */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="alert-enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="alert-enabled" className="text-xs font-semibold text-slate-200 cursor-pointer">
                Enable Real-Time Metric Threshold Monitoring
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, soundEnabled: !formData.soundEnabled })}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  formData.soundEnabled
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {formData.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{formData.soundEnabled ? 'Audio Alerts On' : 'Audio Alerts Off'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Threshold Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('strict')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="text-xs font-semibold text-rose-300">Strict SLA</div>
                <div className="text-[10px] text-slate-400">CPU 60% • Queue 8 • Err 5%</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-indigo-500/40 text-left transition-colors group"
              >
                <div className="text-xs font-semibold text-indigo-300">Production (Default)</div>
                <div className="text-[10px] text-slate-400">CPU 75% • Queue 15 • Err 10%</div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('relaxed')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="text-xs font-semibold text-amber-300">Relaxed / Dev</div>
                <div className="text-[10px] text-slate-400">CPU 90% • Queue 30 • Err 20%</div>
              </button>
            </div>
          </div>

          {/* Threshold Sliders & Controls */}
          <div className="space-y-4">
            
            {/* 1. CPU Usage Limit */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-semibold text-slate-200">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Max Worker CPU Usage Limit</span>
                </div>
                <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {formData.cpuLimitPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger critical warning if any worker node exceeds this processor utilization threshold.
              </p>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={formData.cpuLimitPct}
                onChange={(e) => setFormData({ ...formData, cpuLimitPct: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* 2. Worker Memory Usage Limit */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-semibold text-slate-200">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Max Worker Memory Limit (MB)</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {formData.memoryLimitMb} MB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Alert when a worker process memory consumption approaches container heap ceiling (512 MB).
              </p>
              <input
                type="range"
                min="200"
                max="500"
                step="25"
                value={formData.memoryLimitMb}
                onChange={(e) => setFormData({ ...formData, memoryLimitMb: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* 3. Queue Depth Limit */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-semibold text-slate-200">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Max Queue Backlog Depth (Pending Jobs)</span>
                </div>
                <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {formData.queueDepthLimit} jobs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Alert when cumulative queued backlog exceeds capacity, indicating a need for worker scale-out.
              </p>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={formData.queueDepthLimit}
                onChange={(e) => setFormData({ ...formData, queueDepthLimit: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* 4. Cluster Concurrency Utilization Limit */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-semibold text-slate-200">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Cluster Concurrency Utilization Limit (%)</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {formData.clusterUtilizationLimitPct}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={formData.clusterUtilizationLimitPct}
                onChange={(e) => setFormData({ ...formData, clusterUtilizationLimitPct: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              id="btn-trigger-test-alert"
              onClick={onTriggerTestAlert}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Alert Notification</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-thresholds"
                className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Thresholds</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
