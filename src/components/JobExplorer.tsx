import React, { useState } from 'react';
import {
  Zap,
  Search,
  Filter,
  Plus,
  Play,
  RotateCcw,
  Ban,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Copy,
  Code,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Job, Queue, JobType, JobState } from '../types';

interface JobExplorerProps {
  jobs: Job[];
  queues: Queue[];
  selectedQueueFilter: string;
  setSelectedQueueFilter: (qId: string) => void;
  onSelectJob: (job: Job) => void;
  onRetryJob: (jobId: string) => void;
  onCancelJob: (jobId: string) => void;
  onCreateJob: (jobData: any) => void;
}

export const JobExplorer: React.FC<JobExplorerProps> = ({
  jobs,
  queues,
  selectedQueueFilter,
  setSelectedQueueFilter,
  onSelectJob,
  onRetryJob,
  onCancelJob,
  onCreateJob
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Create Job Form state
  const [jobType, setJobType] = useState<JobType>('immediate');
  const [jobName, setJobName] = useState('send_welcome_email');
  const [queueId, setQueueId] = useState(queues[0]?.id || 'q-critical');
  const [priority, setPriority] = useState(7);
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [scheduledAt, setScheduledAt] = useState('');
  const [cronExpression, setCronExpression] = useState('*/5 * * * *');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify({ to: 'user@example.com', templateId: 'tmpl_welcome_v2', trackingId: 'trk_9841' }, null, 2)
  );

  const presets = [
    {
      name: 'Transactional Email',
      taskName: 'send_transactional_email',
      queue: 'q-critical',
      type: 'immediate' as JobType,
      priority: 9,
      payload: { to: 'customer@acme.com', subject: 'Your Order #9812 has shipped', courier: 'FedEx' }
    },
    {
      name: 'Stripe Webhook Delivery',
      taskName: 'dispatch_stripe_webhook',
      queue: 'q-webhooks',
      type: 'immediate' as JobType,
      priority: 8,
      payload: { event: 'invoice.payment_succeeded', customerId: 'cus_9941a', amountCents: 4900 }
    },
    {
      name: 'Delayed Digest Email (30s)',
      taskName: 'send_daily_activity_digest',
      queue: 'q-critical',
      type: 'delayed' as JobType,
      delay: 30,
      priority: 6,
      payload: { userId: 'usr_8412', articlesRead: 14, streakDays: 7 }
    },
    {
      name: 'Recurring Cron (Every 5m)',
      taskName: 'reconcile_database_snapshots',
      queue: 'q-data',
      type: 'cron' as JobType,
      cron: '*/5 * * * *',
      priority: 5,
      payload: { targetCluster: 'prod-aurora-replica-01', checksumCheck: true }
    },
    {
      name: 'Deliberate Failure (Test DLQ)',
      taskName: 'sync_partner_crm_records',
      queue: 'q-data',
      type: 'immediate' as JobType,
      priority: 5,
      payload: { simulateFailure: true, customErrorMessage: 'Salesforce API 401 Unauthorized: Session Token Invalid' }
    }
  ];

  const applyPreset = (preset: any) => {
    setJobName(preset.taskName);
    setJobType(preset.type);
    if (preset.queue) setQueueId(preset.queue);
    if (preset.priority) setPriority(preset.priority);
    if (preset.delay) setDelaySeconds(preset.delay);
    if (preset.cron) setCronExpression(preset.cron);
    setPayloadJson(JSON.stringify(preset.payload, null, 2));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPayload = JSON.parse(payloadJson);
      onCreateJob({
        name: jobName,
        queueId,
        type: jobType,
        priority,
        delaySeconds: jobType === 'delayed' ? delaySeconds : 0,
        scheduledAt: jobType === 'scheduled' ? scheduledAt : undefined,
        cronExpression: jobType === 'cron' ? cronExpression : undefined,
        idempotencyKey: idempotencyKey.trim() || undefined,
        payload: parsedPayload
      });
      setIsCreateModalOpen(false);
      setIdempotencyKey('');
    } catch {
      alert('Invalid JSON in payload field.');
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    if (selectedQueueFilter && selectedQueueFilter !== 'ALL' && j.queueId !== selectedQueueFilter) return false;
    if (stateFilter !== 'ALL' && j.state !== stateFilter) return false;
    if (typeFilter !== 'ALL' && j.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = j.name.toLowerCase().includes(q);
      const matchId = j.id.toLowerCase().includes(q);
      const matchPayload = JSON.stringify(j.payload).toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPayload) return false;
    }
    return true;
  });

  const downloadJobsCsv = () => {
    const headers = [
      'Job ID',
      'Job Name',
      'Queue ID',
      'Queue Name',
      'Type',
      'Priority',
      'Status',
      'Attempt Count',
      'Max Retries',
      'Worker Host / ID',
      'Idempotency Key',
      'Created At',
      'Started At',
      'Completed At',
      'Error Message',
      'Payload'
    ];

    const rows = filteredJobs.map((job) => [
      job.id,
      job.name,
      job.queueId,
      job.queueName || 'Default',
      job.type,
      `P${job.priority}`,
      job.state,
      job.attemptCount,
      job.maxRetries,
      job.workerName || '',
      job.idempotencyKey || '',
      job.createdAt ? new Date(job.createdAt).toISOString() : '',
      job.startedAt ? new Date(job.startedAt).toISOString() : '',
      job.completedAt ? new Date(job.completedAt).toISOString() : '',
      job.errorMessage || '',
      JSON.stringify(job.payload || {})
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `job-history-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const getStateBadge = (state: JobState) => {
    switch (state) {
      case 'QUEUED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">QUEUED</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1"><Clock className="w-2.5 h-2.5" /><span>SCHEDULED</span></span>;
      case 'CLAIMED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">CLAIMED</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" /><span>RUNNING</span></span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1"><CheckCircle className="w-2.5 h-2.5" /><span>COMPLETED</span></span>;
      case 'RETRYING':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center space-x-1"><RotateCcw className="w-2.5 h-2.5" /><span>RETRYING</span></span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1"><AlertTriangle className="w-2.5 h-2.5" /><span>FAILED</span></span>;
      case 'DEAD_LETTERED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1"><AlertOctagon className="w-2.5 h-2.5" /><span>DEAD LETTER</span></span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">{state}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-jobs"
            placeholder="Search jobs by name, ID, or JSON payload content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Queue Filter */}
          <select
            id="filter-queue"
            value={selectedQueueFilter}
            onChange={(e) => setSelectedQueueFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Queues</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            id="filter-state"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="QUEUED">QUEUED</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="RETRYING">RETRYING</option>
            <option value="FAILED">FAILED</option>
            <option value="DEAD_LETTERED">DEAD LETTERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Type Filter */}
          <select
            id="filter-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="immediate">Immediate</option>
            <option value="delayed">Delayed</option>
            <option value="scheduled">Scheduled</option>
            <option value="cron">Recurring (Cron)</option>
            <option value="dag_step">Workflow DAG Step</option>
          </select>

          {/* Download CSV Button */}
          <button
            id="btn-download-jobs-csv"
            onClick={downloadJobsCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl font-medium transition-colors shadow-sm cursor-pointer"
            title="Download filtered job history as CSV"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">CSV Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download CSV</span>
              </>
            )}
          </button>

          {/* Enqueue New Job Button */}
          <button
            id="btn-open-create-job"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Enqueue Job</span>
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Job Name & ID</th>
                <th className="py-3 px-4">Queue</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Worker / Host</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching jobs found in queue. Click "Enqueue Job" or "Simulate Traffic" to create background tasks.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  return (
                    <tr
                      key={job.id}
                      id={`job-row-${job.id}`}
                      onClick={() => onSelectJob(job)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                          <span>{job.name}</span>
                          {job.idempotencyKey && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Idempotent
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{job.id}</div>
                      </td>

                      {/* Queue */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap">
                          {job.queueName || 'Default'}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-400">
                        {job.type}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                          job.priority >= 8 ? 'text-rose-400 bg-rose-500/10' :
                          job.priority >= 5 ? 'text-indigo-400 bg-indigo-500/10' :
                          'text-slate-400'
                        }`}>
                          P{job.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStateBadge(job.state)}
                      </td>

                      {/* Attempts */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className={job.attemptCount > 1 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {job.attemptCount}
                        </span>
                        <span className="text-slate-500">/{job.maxRetries}</span>
                      </td>

                      {/* Worker */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                        {job.workerName || '—'}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {(job.state === 'FAILED' || job.state === 'DEAD_LETTERED') && (
                            <button
                              id={`btn-retry-${job.id}`}
                              onClick={() => onRetryJob(job.id)}
                              className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded transition-colors"
                              title="Retry job"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(job.state === 'QUEUED' || job.state === 'SCHEDULED' || job.state === 'RUNNING') && (
                            <button
                              id={`btn-cancel-${job.id}`}
                              onClick={() => onCancelJob(job.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                              title="Cancel job"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectJob(job)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title="Inspect job execution"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Enqueue Job Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Enqueue New Background Task</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Presets Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Presets:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Job Name / Task Identifier *</label>
                  <input
                    type="text"
                    required
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Queue *</label>
                  <select
                    value={queueId}
                    onChange={(e) => setQueueId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {queues.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} (Priority {q.priority})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Execution Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="delayed">Delayed</option>
                    <option value="scheduled">Scheduled (UTC)</option>
                    <option value="cron">Recurring (Cron)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority Weight (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Idempotency Key (Optional)</label>
                  <input
                    type="text"
                    placeholder="req_uniq_token_123"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Conditional Timing Inputs */}
              {jobType === 'delayed' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Delay Duration (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="3600"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {jobType === 'scheduled' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Scheduled Time (ISO Date/Time)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {jobType === 'cron' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cron Syntax (Minute Hour Day Month Weekday)</label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="*/5 * * * *"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Input JSON Payload</label>
                  <span className="text-[10px] text-slate-500">Passed directly to worker task sandbox</span>
                </div>
                <textarea
                  rows={5}
                  value={payloadJson}
                  onChange={(e) => setPayloadJson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  Enqueue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
