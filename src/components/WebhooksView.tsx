import React, { useState } from 'react';
import {
  Webhook,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Play,
  Lock,
  Radio,
  ExternalLink,
  ChevronRight,
  Trash2,
  Clock,
  Layers
} from 'lucide-react';
import { WebhookEndpoint, WebhookDeliveryLog, Role } from '../types';

interface WebhooksViewProps {
  currentUserRole: Role;
  onShowToast: (msg: string) => void;
}

const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh-slack-alerts',
    projectId: 'proj-default',
    name: 'Slack Incident & DLQ Channel Bot',
    targetUrl: 'https://api.slack.com/mock-webhook-for-assignment',
    description: 'Notifies the engineering team on Slack whenever a job enters the Dead Letter Queue.',
    status: 'ACTIVE',
    events: ['job:failed', 'job:dlq', 'worker:stalled'],
    secretToken: 'whsec_984f88231ab7c409e51c88319f0a887b',
    maxRetries: 3,
    timeoutSeconds: 10,
    totalDeliveries: 124,
    successfulDeliveries: 121,
    failedDeliveries: 3,
    lastDeliveryAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    lastDeliveryStatus: 200,
    createdAt: '2026-01-20T00:00:00Z'
  },
  {
    id: 'wh-pagerduty-critical',
    projectId: 'proj-default',
    name: 'PagerDuty P0 Job Preemption & High Severity Escalator',
    targetUrl: 'https://events.pagerduty.com/v2/enqueue',
    description: 'Triggers on-call incident alerts if P0 Critical jobs fail or worker clusters stall.',
    status: 'ACTIVE',
    events: ['job:dlq', 'worker:stalled'],
    secretToken: 'whsec_71ac398e09f54b6790a32194c6ef8811',
    maxRetries: 5,
    timeoutSeconds: 5,
    totalDeliveries: 18,
    successfulDeliveries: 18,
    failedDeliveries: 0,
    lastDeliveryAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    lastDeliveryStatus: 202,
    createdAt: '2026-02-10T00:00:00Z'
  },
  {
    id: 'wh-datadog-metrics',
    projectId: 'proj-default',
    name: 'Datadog APM Custom Metric Ingestion Stream',
    targetUrl: 'https://http-intake.logs.datadoghq.com/api/v2/logs',
    description: 'Streams completed and failed job metadata to Datadog for latency observability.',
    status: 'ACTIVE',
    events: ['job:completed', 'job:failed', 'job:dlq'],
    secretToken: 'whsec_a3199fe048bb7123985dc98301fa329b',
    maxRetries: 3,
    timeoutSeconds: 15,
    totalDeliveries: 4210,
    successfulDeliveries: 4202,
    failedDeliveries: 8,
    lastDeliveryAt: new Date(Date.now() - 1000 * 45).toISOString(),
    lastDeliveryStatus: 200,
    createdAt: '2026-02-15T00:00:00Z'
  }
];

const SAMPLE_DELIVERIES: WebhookDeliveryLog[] = [
  {
    id: 'deliv-1',
    webhookId: 'wh-slack-alerts',
    webhookName: 'Slack Incident & DLQ Channel Bot',
    event: 'job:dlq',
    targetUrl: 'https://api.slack.com/mock-webhook-for-assignment',
    payload: {
      event: 'job:dlq',
      jobId: 'job-9841',
      jobName: 'Process Stripe Payment',
      queue: 'P0 Critical Operations',
      attempts: 5,
      reason: 'HTTP 504 Gateway Timeout from payment gateway'
    },
    statusCode: 200,
    durationMs: 142,
    status: 'SUCCESS',
    attemptCount: 1,
    signature: 't=1771465200,v1=9f8a32b8471c08e1...',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'deliv-2',
    webhookId: 'wh-datadog-metrics',
    webhookName: 'Datadog APM Custom Metric Ingestion Stream',
    event: 'job:completed',
    targetUrl: 'https://http-intake.logs.datadoghq.com/api/v2/logs',
    payload: {
      event: 'job:completed',
      jobId: 'job-9912',
      durationMs: 840,
      workerId: 'worker-node-1'
    },
    statusCode: 200,
    durationMs: 65,
    status: 'SUCCESS',
    attemptCount: 1,
    signature: 't=1771465800,v1=12a9ef387c10b48a...',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString()
  },
  {
    id: 'deliv-3',
    webhookId: 'wh-slack-alerts',
    webhookName: 'Slack Incident & DLQ Channel Bot',
    event: 'job:failed',
    targetUrl: 'https://api.slack.com/mock-webhook-for-assignment',
    payload: {
      event: 'job:failed',
      jobId: 'job-9810',
      reason: 'Downstream Database Lock Timeout'
    },
    statusCode: 500,
    durationMs: 310,
    status: 'FAILED',
    attemptCount: 3,
    error: 'Remote server returned 500 Internal Server Error',
    signature: 't=1771464000,v1=33f810aa76c5b901...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  }
];

export const WebhooksView: React.FC<WebhooksViewProps> = ({ currentUserRole, onShowToast }) => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOKS);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>(SAMPLE_DELIVERIES);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(webhooks[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>(['job:failed', 'job:dlq']);
  const [formSecret, setFormSecret] = useState(() => `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateDispatch = (webhook: WebhookEndpoint) => {
    setIsDispatchingTest(true);
    setTimeout(() => {
      setIsDispatchingTest(false);
      const isSuccess = Math.random() > 0.15;
      const newLog: WebhookDeliveryLog = {
        id: `deliv-${Date.now()}`,
        webhookId: webhook.id,
        webhookName: webhook.name,
        event: 'job:completed',
        targetUrl: webhook.targetUrl,
        payload: {
          event: 'job:completed',
          jobId: `job-${Math.floor(1000 + Math.random() * 9000)}`,
          jobName: 'Simulated Execution Callback',
          durationMs: Math.floor(120 + Math.random() * 800),
          timestamp: new Date().toISOString()
        },
        statusCode: isSuccess ? 200 : 503,
        durationMs: Math.floor(45 + Math.random() * 180),
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        attemptCount: 1,
        error: isSuccess ? undefined : 'Simulated Gateway Unavailable',
        signature: `t=${Date.now()},v1=sha256_${Math.random().toString(36).substring(2, 12)}`,
        timestamp: new Date().toISOString()
      };

      setDeliveryLogs(prev => [newLog, ...prev]);
      setWebhooks(prev =>
        prev.map(w => {
          if (w.id === webhook.id) {
            return {
              ...w,
              totalDeliveries: w.totalDeliveries + 1,
              successfulDeliveries: isSuccess ? w.successfulDeliveries + 1 : w.successfulDeliveries,
              failedDeliveries: !isSuccess ? w.failedDeliveries + 1 : w.failedDeliveries,
              lastDeliveryAt: new Date().toISOString(),
              lastDeliveryStatus: newLog.statusCode
            };
          }
          return w;
        })
      );
      onShowToast(isSuccess ? `Webhook delivered successfully (HTTP 200)` : `Webhook delivery failed (HTTP 503)`);
    }, 600);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      onShowToast('Please provide a name and target endpoint URL');
      return;
    }

    const newEndpoint: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      projectId: 'proj-default',
      name: formName.trim(),
      targetUrl: formUrl.trim(),
      description: formDescription.trim(),
      status: 'ACTIVE',
      events: formEvents as any,
      secretToken: formSecret,
      maxRetries: 3,
      timeoutSeconds: 10,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      createdAt: new Date().toISOString()
    };

    setWebhooks(prev => [newEndpoint, ...prev]);
    setSelectedWebhook(newEndpoint);
    setIsCreateModalOpen(false);
    onShowToast(`Registered webhook endpoint: ${newEndpoint.name}`);

    // Reset Form
    setFormName('');
    setFormUrl('');
    setFormDescription('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <span>Webhooks & Event Triggers</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                HMAC SHA-256 Verified
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Dispatch outbound notifications on job lifecycle milestones or trigger asynchronous background tasks via incoming HTTP webhooks
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/30 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {/* Main Grid: Endpoints List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Registered Webhook Endpoints & Deliveries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Endpoints Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Outbound Subscriptions ({webhooks.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {webhooks.map((wh) => {
                const isSelected = selectedWebhook?.id === wh.id;
                return (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWebhook(wh)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <h3 className="text-sm font-bold text-slate-100">{wh.name}</h3>
                        </div>
                        <p className="text-xs font-mono text-cyan-300 truncate max-w-md">{wh.targetUrl}</p>
                        {wh.description && <p className="text-[11px] text-slate-400">{wh.description}</p>}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateDispatch(wh);
                          }}
                          disabled={isDispatchingTest}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Test Ping</span>
                        </button>
                      </div>
                    </div>

                    {/* Events Subscribed Badges */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-slate-500 text-[10px]">Events:</span>
                        {wh.events.map(ev => (
                          <span
                            key={ev}
                            className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-3 font-mono text-[10px] text-slate-400">
                        <span>Total: {wh.totalDeliveries}</span>
                        <span className="text-emerald-400">✓ {wh.successfulDeliveries}</span>
                        {wh.failedDeliveries > 0 && <span className="text-rose-400">✗ {wh.failedDeliveries}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Webhook Delivery Audit Trail</span>
            </h2>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {deliveryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        HTTP {log.statusCode || 'ERR'}
                      </span>
                      <span className="font-semibold text-slate-200">{log.webhookName}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{log.event}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{log.targetUrl}</div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px] space-y-0.5">
                    <div className="text-cyan-400 font-semibold">{log.durationMs}ms</div>
                    <div className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Inbound Triggers & Security Verification Guide */}
        <div className="space-y-4">
          
          {/* Inbound Webhook Trigger endpoint guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Inbound Webhook Trigger API</span>
            </h2>
            <p className="text-xs text-slate-400">
              Submit jobs directly to this scheduler from external services (GitHub Actions, Stripe, Zapier) by calling our Ingress API:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>cURL Trigger Command:</span>
                <button
                  onClick={() =>
                    handleCopy(
                      `curl -X POST https://api.hyperplane.internal/api/jobs \\\n  -H "Authorization: Bearer sec_tok_prod" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "Webhook Ingest Task", "queueId": "q-critical-p0", "type": "immediate", "priority": 0, "payload": {"source": "github_ci"}}'`,
                      'curl-code'
                    )
                  }
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {copiedId === 'curl-code' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'curl-code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`curl -X POST /api/jobs \\
  -H "Authorization: Bearer ${selectedWebhook?.secretToken || 'whsec_token'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Webhook Ingest Task",
    "queueId": "q-critical-p0",
    "type": "immediate",
    "priority": 0,
    "payload": { "source": "github_webhook" }
  }'`}
              </pre>
            </div>
          </div>

          {/* HMAC Signature Verification Card */}
          {selectedWebhook && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>HMAC Signing Secret</span>
                </h3>
              </div>

              <p className="text-[11px] text-slate-400">
                All outbound requests include header <code className="text-cyan-300 font-mono">X-Scheduler-Signature-256</code> computed via HMAC SHA-256.
              </p>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-200">
                <span className="truncate max-w-[200px]">{selectedWebhook.secretToken}</span>
                <button
                  onClick={() => handleCopy(selectedWebhook.secretToken, selectedWebhook.id)}
                  className="p-1 rounded text-slate-400 hover:text-cyan-300"
                >
                  {copiedId === selectedWebhook.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Webhook Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Webhook className="w-5 h-5 text-cyan-400" />
                <span>Register Outbound Webhook</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Ops Channel Alerts"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target HTTP URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/webhooks/scheduler"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="Summary of this webhook integration..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Trigger Events</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['job:queued', 'job:started', 'job:completed', 'job:failed', 'job:dlq', 'worker:stalled'].map((ev) => (
                    <label key={ev} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEvents.includes(ev)}
                        onChange={(e) => {
                          if (e.target.checked) setFormEvents([...formEvents, ev]);
                          else setFormEvents(formEvents.filter(x => x !== ev));
                        }}
                        className="rounded text-cyan-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-slate-300 font-mono text-[11px]">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-cyan-600/30"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
