import React, { useState, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Calendar,
  Globe,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Sliders,
  Copy,
  ChevronRight,
  Trash2,
  History,
  Timer
} from 'lucide-react';
import { CronSchedule, Queue, Role } from '../types';

interface RecurringSchedulesViewProps {
  queues: Queue[];
  currentUserRole: Role;
  onEnqueueJob: (jobData: any) => Promise<any>;
  onShowToast: (msg: string) => void;
}

const CRON_PRESETS = [
  { label: 'Every 1 Minute', expression: '* * * * *', desc: 'Runs every single minute' },
  { label: 'Every 5 Minutes', expression: '*/5 * * * *', desc: 'Runs at minute 0, 5, 10, 15, 20...' },
  { label: 'Every 15 Minutes', expression: '*/15 * * * *', desc: 'Runs at minute 0, 15, 30, 45' },
  { label: 'Every Hour (Top of Hour)', expression: '0 * * * *', desc: 'Runs at minute 0 of every hour' },
  { label: 'Every 6 Hours', expression: '0 */6 * * *', desc: 'Runs at 00:00, 06:00, 12:00, 18:00' },
  { label: 'Daily at Midnight (UTC)', expression: '0 0 * * *', desc: 'Runs once every day at 00:00 UTC' },
  { label: 'Daily at 09:00 AM', expression: '0 9 * * *', desc: 'Runs once every day at 09:00 AM' },
  { label: 'Weekdays at 09:00 AM', expression: '0 9 * * 1-5', desc: 'Runs Mon–Fri at 09:00 AM' },
  { label: 'Weekly on Sunday 00:00', expression: '0 0 * * 0', desc: 'Runs every Sunday at midnight' },
  { label: 'Monthly on 1st at 00:00', expression: '0 0 1 * *', desc: 'Runs on the 1st of every month' }
];

const INITIAL_SCHEDULES: CronSchedule[] = [
  {
    id: 'cron-billing-rollup',
    projectId: 'proj-default',
    name: 'Daily Stripe & Invoicing Aggregator',
    description: 'Aggregates tenant usage meters and generates batch invoice receipts.',
    cronExpression: '0 2 * * *',
    humanSchedule: 'Every day at 02:00 UTC',
    timezone: 'UTC',
    queueId: 'q-critical-p0',
    queueName: 'P0 Critical Operations',
    priority: 0,
    taskType: 'billing_aggregation',
    payload: { dryRun: false, batchSize: 500, notifyFinance: true },
    status: 'ACTIVE',
    misfirePolicy: 'FIRE_ONE_IMMEDIATELY',
    concurrencyPolicy: 'FORBID_OVERLAPPING',
    jitterSeconds: 15,
    timeoutSeconds: 300,
    maxRetries: 3,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    lastRunStatus: 'COMPLETED',
    lastRunJobId: 'job-cron-8821',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(),
    totalRunsCount: 142,
    successfulRunsCount: 140,
    failedRunsCount: 2,
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'cron-db-vacuum',
    projectId: 'proj-default',
    name: 'Cluster Garbage Collection & Stale Log Vacuum',
    description: 'Purges execution logs older than 30 days and reclaims table bloat.',
    cronExpression: '30 4 * * 0',
    humanSchedule: 'Every Sunday at 04:30 UTC',
    timezone: 'UTC',
    queueId: 'q-maintenance-p3',
    queueName: 'P3 Background Maintenance',
    priority: 3,
    taskType: 'db_vacuum_cleanup',
    payload: { purgeOlderThanDays: 30, vacuumAnalyze: true },
    status: 'ACTIVE',
    misfirePolicy: 'SKIP_MISSED',
    concurrencyPolicy: 'FORBID_OVERLAPPING',
    jitterSeconds: 30,
    timeoutSeconds: 600,
    maxRetries: 2,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    lastRunStatus: 'COMPLETED',
    lastRunJobId: 'job-cron-7419',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    totalRunsCount: 28,
    successfulRunsCount: 28,
    failedRunsCount: 0,
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'cron-search-reindex',
    projectId: 'proj-default',
    name: 'Vector Embeddings & Search Index Sync',
    description: 'Syncs new catalog items into the distributed vector search index.',
    cronExpression: '*/15 * * * *',
    humanSchedule: 'Every 15 minutes',
    timezone: 'UTC',
    queueId: 'q-default-p1',
    queueName: 'P1 High Throughput Ingestion',
    priority: 1,
    taskType: 'search_reindex',
    payload: { shardCount: 4, fullSync: false },
    status: 'ACTIVE',
    misfirePolicy: 'SKIP_MISSED',
    concurrencyPolicy: 'REPLACE_RUNNING',
    jitterSeconds: 5,
    timeoutSeconds: 120,
    maxRetries: 3,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    lastRunStatus: 'COMPLETED',
    lastRunJobId: 'job-cron-9942',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 7).toISOString(),
    totalRunsCount: 1840,
    successfulRunsCount: 1836,
    failedRunsCount: 4,
    createdAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'cron-telemetry-digest',
    projectId: 'proj-default',
    name: 'Executive SLA & Latency Digest Report',
    description: 'Calculates P95/P99 latency trends and sends Slack notification summaries.',
    cronExpression: '0 9 * * 1-5',
    humanSchedule: 'Weekdays at 09:00 AM UTC',
    timezone: 'America/New_York',
    queueId: 'q-default-p1',
    queueName: 'P1 High Throughput Ingestion',
    priority: 1,
    taskType: 'generate_sla_report',
    payload: { channel: '#ops-telemetry', notifyPagerDuty: false },
    status: 'PAUSED',
    misfirePolicy: 'SKIP_MISSED',
    concurrencyPolicy: 'ALLOW_CONCURRENT',
    jitterSeconds: 0,
    timeoutSeconds: 90,
    maxRetries: 2,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    lastRunStatus: 'COMPLETED',
    lastRunJobId: 'job-cron-4102',
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    totalRunsCount: 65,
    successfulRunsCount: 64,
    failedRunsCount: 1,
    createdAt: '2026-04-10T00:00:00Z'
  }
];

export const RecurringSchedulesView: React.FC<RecurringSchedulesViewProps> = ({
  queues,
  currentUserRole,
  onEnqueueJob,
  onShowToast
}) => {
  const [schedules, setSchedules] = useState<CronSchedule[]>(INITIAL_SCHEDULES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CronSchedule | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  // Form State for Schedule Creator
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCron, setFormCron] = useState('*/5 * * * *');
  const [formTimezone, setFormTimezone] = useState('UTC');
  const [formQueueId, setFormQueueId] = useState(queues[0]?.id || 'q-default-p1');
  const [formPriority, setFormPriority] = useState(1);
  const [formTaskType, setFormTaskType] = useState('custom_cron_job');
  const [formPayload, setFormPayload] = useState('{\n  "batchSize": 100,\n  "dryRun": false\n}');
  const [formMisfirePolicy, setFormMisfirePolicy] = useState<'SKIP_MISSED' | 'FIRE_ONE_IMMEDIATELY' | 'CATCH_UP_ALL'>('SKIP_MISSED');
  const [formConcurrencyPolicy, setFormConcurrencyPolicy] = useState<'ALLOW_CONCURRENT' | 'FORBID_OVERLAPPING' | 'REPLACE_RUNNING'>('FORBID_OVERLAPPING');
  const [formJitter, setFormJitter] = useState(10);
  const [formTimeout, setFormTimeout] = useState(180);
  const [formMaxRetries, setFormMaxRetries] = useState(3);

  // Compute calculated upcoming runs for a given cron string
  const calculateUpcomingRuns = (cronExpr: string, count = 8): Date[] => {
    const dates: Date[] = [];
    const now = new Date();
    let current = new Date(now.getTime());

    // Approximate next ticks based on common patterns
    for (let i = 1; i <= count; i++) {
      if (cronExpr.startsWith('* * * * *')) {
        current = new Date(now.getTime() + i * 60 * 1000);
      } else if (cronExpr.startsWith('*/5')) {
        current = new Date(now.getTime() + i * 5 * 60 * 1000);
      } else if (cronExpr.startsWith('*/15')) {
        current = new Date(now.getTime() + i * 15 * 60 * 1000);
      } else if (cronExpr.startsWith('0 *')) {
        current = new Date(now.getTime() + i * 60 * 60 * 1000);
      } else if (cronExpr.includes('0 9') || cronExpr.includes('0 2') || cronExpr.includes('0 0')) {
        current = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      } else {
        current = new Date(now.getTime() + i * 30 * 60 * 1000);
      }
      dates.push(current);
    }
    return dates;
  };

  const previewUpcomingDates = useMemo(() => {
    return calculateUpcomingRuns(formCron, 6);
  }, [formCron]);

  const handleToggleStatus = (id: string) => {
    if (currentUserRole === 'VIEWER') {
      onShowToast('Permission denied: Viewer role cannot modify recurring schedules');
      return;
    }
    setSchedules(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    onShowToast('Schedule status updated');
  };

  const handleTriggerNow = async (schedule: CronSchedule) => {
    try {
      await onEnqueueJob({
        name: `[Manual Trigger] ${schedule.name}`,
        queueId: schedule.queueId,
        type: 'cron',
        priority: schedule.priority,
        cronExpression: schedule.cronExpression,
        payload: schedule.payload,
        maxRetries: schedule.maxRetries,
        timeoutSeconds: schedule.timeoutSeconds
      });

      setSchedules(prev =>
        prev.map(s => {
          if (s.id === schedule.id) {
            return {
              ...s,
              lastRunAt: new Date().toISOString(),
              lastRunStatus: 'RUNNING',
              totalRunsCount: s.totalRunsCount + 1
            };
          }
          return s;
        })
      );
      onShowToast(`Dispatched manual execution for: ${schedule.name}`);
    } catch (e: any) {
      onShowToast(`Failed to trigger schedule: ${e.message}`);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (currentUserRole !== 'ADMIN') {
      onShowToast('Permission denied: Only Admins can delete recurring schedules');
      return;
    }
    setSchedules(prev => prev.filter(s => s.id !== id));
    if (selectedSchedule?.id === id) setSelectedSchedule(null);
    onShowToast('Recurring schedule deleted');
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Please provide a schedule name');
      return;
    }

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(formPayload);
    } catch {
      onShowToast('Invalid JSON in payload');
      return;
    }

    const targetQueue = queues.find(q => q.id === formQueueId);
    const newSchedule: CronSchedule = {
      id: `cron-${Date.now()}`,
      projectId: 'proj-default',
      name: formName.trim(),
      description: formDescription.trim() || 'Custom automated cron schedule',
      cronExpression: formCron.trim(),
      humanSchedule: `Cron: ${formCron.trim()}`,
      timezone: formTimezone,
      queueId: formQueueId,
      queueName: targetQueue?.name || 'Default Queue',
      priority: formPriority,
      taskType: formTaskType.trim(),
      payload: parsedPayload,
      status: 'ACTIVE',
      misfirePolicy: formMisfirePolicy,
      concurrencyPolicy: formConcurrencyPolicy,
      jitterSeconds: formJitter,
      timeoutSeconds: formTimeout,
      maxRetries: formMaxRetries,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      totalRunsCount: 0,
      successfulRunsCount: 0,
      failedRunsCount: 0,
      createdAt: new Date().toISOString()
    };

    setSchedules(prev => [newSchedule, ...prev]);
    setIsCreateModalOpen(false);
    onShowToast(`Registered new recurring schedule: ${newSchedule.name}`);

    // Reset Form
    setFormName('');
    setFormDescription('');
    setFormPayload('{\n  "batchSize": 100\n}');
  };

  const filteredSchedules = schedules.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.cronExpression.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.taskType.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Recurring & Cron Schedule Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                {schedules.filter(s => s.status === 'ACTIVE').length} Active Tickers
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage distributed recurring tasks with visual cron expression builders, multi-timezone forecasting, and misfire policies
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-create-recurring-schedule"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Cron Schedule</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search schedules by name, cron expression, or task type..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-80 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedules Grid & Details Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Schedules List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredSchedules.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No recurring schedules found</p>
              <p className="text-xs text-slate-500 mt-1">Adjust search filters or click "Create Cron Schedule" to register a new recurring task.</p>
            </div>
          ) : (
            filteredSchedules.map((schedule) => {
              const isSelected = selectedSchedule?.id === schedule.id;
              return (
                <div
                  key={schedule.id}
                  id={`schedule-card-${schedule.id}`}
                  onClick={() => setSelectedSchedule(schedule)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            schedule.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <h3 className="text-sm font-bold text-slate-100">{schedule.name}</h3>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 font-semibold">
                          {schedule.cronExpression}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{schedule.description}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Trigger Now */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerNow(schedule);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-colors"
                        title="Trigger one-off execution immediately"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Now</span>
                      </button>

                      {/* Pause / Resume */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(schedule.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          schedule.status === 'ACTIVE'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                        }`}
                        title={schedule.status === 'ACTIVE' ? 'Pause Schedule' : 'Resume Schedule'}
                      >
                        {schedule.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(schedule.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{schedule.queueName}</span>
                      </span>
                      <span className="font-mono text-amber-400 font-semibold">P{schedule.priority}</span>
                      <span>{schedule.humanSchedule}</span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-[10px]">
                      <span>Runs: {schedule.totalRunsCount}</span>
                      <span className="text-emerald-400">✓ {schedule.successfulRunsCount}</span>
                      {schedule.failedRunsCount > 0 && (
                        <span className="text-rose-400">✗ {schedule.failedRunsCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Selected Schedule Deep Inspector & Timezone Forecaster */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Multi-Timezone Execution Forecast</span>
              </h2>
            </div>

            {selectedSchedule ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-100">{selectedSchedule.name}</div>
                  <div className="font-mono text-xs text-indigo-400 font-semibold bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span>{selectedSchedule.cronExpression}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{selectedSchedule.timezone}</span>
                  </div>
                </div>

                {/* Policies Badge Strip */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Misfire Policy:</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedSchedule.misfirePolicy}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Concurrency:</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedSchedule.concurrencyPolicy}</span>
                  </div>
                </div>

                {/* Next 5 Upcoming Executions Across Timezones */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Next Calculated Firing Windows:
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {calculateUpcomingRuns(selectedSchedule.cronExpression, 5).map((date, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-200 font-mono font-semibold">
                          <span>#{idx + 1} Run</span>
                          <span className="text-emerald-400">{date.toUTCString().slice(0, 22)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>EST: {date.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}</span>
                          <span>IST: {date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                          <span>JST: {date.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payload Preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Attached Task Payload:</span>
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
                    {JSON.stringify(selectedSchedule.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <span>Select a recurring schedule on the left to inspect multi-timezone forecasts and execution policies.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Recurring Schedule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Create Recurring Cron Schedule</h2>
                  <p className="text-xs text-slate-400">Configure recurring automated tasks with cron expressions and target queues</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSchedule} className="p-6 overflow-y-auto space-y-5">
              
              {/* Name & Task Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Schedule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Data Lake Exporter"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Task Type Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. export_data_lake"
                    value={formTaskType}
                    onChange={(e) => setFormTaskType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="Summary of what this scheduled automation executes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Presets Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Standard Cron Presets</span>
                  <span className="text-[10px] text-indigo-400 font-mono">5-Part Syntax (min hr dom mon dow)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {CRON_PRESETS.slice(0, 10).map((preset) => (
                    <button
                      key={preset.expression}
                      type="button"
                      onClick={() => setFormCron(preset.expression)}
                      className={`p-2 rounded-lg text-left text-[10px] border transition-colors ${
                        formCron === preset.expression
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate font-semibold">{preset.label}</div>
                      <div className="font-mono text-[9px] text-slate-500 truncate">{preset.expression}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cron Expression Input & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Cron Expression *</label>
                  <input
                    type="text"
                    required
                    value={formCron}
                    onChange={(e) => setFormCron(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Timezone</label>
                  <select
                    value={formTimezone}
                    onChange={(e) => setFormTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              {/* Target Queue & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Queue</label>
                  <select
                    value={formQueueId}
                    onChange={(e) => setFormQueueId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {queues.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} (P{q.priority})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Priority Weight</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>P0 - Critical (Immediate Worker Preemption)</option>
                    <option value={1}>P1 - High Throughput</option>
                    <option value={2}>P2 - Standard Batch</option>
                    <option value={3}>P3 - Background Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Concurrency & Misfire Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Concurrency Policy</label>
                  <select
                    value={formConcurrencyPolicy}
                    onChange={(e) => setFormConcurrencyPolicy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FORBID_OVERLAPPING">Forbid Overlapping (Wait for previous to finish)</option>
                    <option value="ALLOW_CONCURRENT">Allow Concurrent (Run new tick independently)</option>
                    <option value="REPLACE_RUNNING">Replace Running (Cancel previous in-flight run)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Misfire Handling Policy</label>
                  <select
                    value={formMisfirePolicy}
                    onChange={(e) => setFormMisfirePolicy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SKIP_MISSED">Skip Missed (Wait for next scheduled interval)</option>
                    <option value="FIRE_ONE_IMMEDIATELY">Fire One Immediately (Catch up single latest tick)</option>
                    <option value="CATCH_UP_ALL">Catch Up All (Run all missed historical ticks)</option>
                  </select>
                </div>
              </div>

              {/* Jitter & Retries */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Jitter (Seconds)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formJitter}
                    onChange={(e) => setFormJitter(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Timeout (Seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="3600"
                    value={formTimeout}
                    onChange={(e) => setFormTimeout(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Max Retries</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formMaxRetries}
                    onChange={(e) => setFormMaxRetries(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payload JSON */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Task Payload (JSON)</label>
                <textarea
                  rows={4}
                  value={formPayload}
                  onChange={(e) => setFormPayload(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-colors"
                >
                  Register Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
