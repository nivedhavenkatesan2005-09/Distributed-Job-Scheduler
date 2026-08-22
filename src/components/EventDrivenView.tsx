import React, { useState } from 'react';
import {
  Zap,
  Radio,
  Plus,
  Play,
  CheckCircle2,
  Filter,
  Send,
  Workflow,
  Webhook,
  Layers,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { EventTriggerRule, EventBusMessage } from '../types';

interface EventDrivenViewProps {
  rules: EventTriggerRule[];
  eventHistory: EventBusMessage[];
  onToggleRule: (ruleId: string, enabled: boolean) => Promise<any>;
  onPublishEvent: (eventName: string, payload: any) => Promise<any>;
  onCreateRule: (rule: Partial<EventTriggerRule>) => Promise<any>;
  userRole?: string;
}

export const EventDrivenView: React.FC<EventDrivenViewProps> = ({
  rules,
  eventHistory,
  onToggleRule,
  onPublishEvent,
  onCreateRule,
  userRole = 'admin'
}) => {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [eventName, setEventName] = useState('user.signup');
  const [eventPayloadStr, setEventPayloadStr] = useState('{\n  "userId": "usr_9912",\n  "email": "customer@acme.corp",\n  "plan": "enterprise"\n}');
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublishResult, setLastPublishResult] = useState<any | null>(null);

  const canManage = userRole === 'admin' || userRole === 'operator' || userRole === 'developer';

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!eventName) return;
    setIsPublishing(true);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(eventPayloadStr);
      } catch {
        parsedPayload = { raw: eventPayloadStr };
      }
      const res = await onPublishEvent(eventName, parsedPayload);
      setLastPublishResult(res);
      setIsPublishModalOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  const presetEvents = [
    { name: 'user.signup', payload: '{\n  "userId": "usr_1024",\n  "name": "Sarah Connor",\n  "email": "sarah@cyberdyne.io"\n}' },
    { name: 'order.paid', payload: '{\n  "orderId": "ord_8829",\n  "amount": 299.00,\n  "currency": "USD"\n}' },
    { name: 'media.uploaded', payload: '{\n  "fileId": "vid_4k_sample",\n  "resolution": "4K",\n  "sizeMb": 450\n}' },
    { name: 'security.anomaly', payload: '{\n  "ipAddress": "192.168.1.100",\n  "failedAttempts": 15,\n  "severity": "CRITICAL"\n}' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Event-Driven Execution Bus</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Pub/Sub Event Routing
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Trigger asynchronous background jobs, DAG workflows, and outbound webhooks reactively upon incoming event bus messages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-open-publish-event"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={!canManage}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/30 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Publish Synthetic Event</span>
          </button>
        </div>
      </div>

      {/* Quick Event Presets Trigger Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>1-Click Event Trigger Sandbox</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Click any preset to broadcast an event and watch automated rules execute in real-time
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presetEvents.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setEventName(p.name);
                setEventPayloadStr(p.payload);
                onPublishEvent(p.name, JSON.parse(p.payload));
              }}
              disabled={isPublishing || !canManage}
              className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-500/40 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 group-hover:text-purple-200">
                  {p.name}
                </span>
                <Play className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Fire event now</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Trigger Rules Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-purple-400" />
            <span>Configured Event Subscription Rules</span>
          </h3>
          <span className="text-xs text-slate-400">
            {rules.length} active event triggers
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <h4 className="text-xs font-bold text-slate-100">{rule.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Pattern: {rule.eventPattern}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Action: {rule.actionType}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rule.description}</p>
                <div className="flex items-center space-x-4 text-[11px] text-slate-500">
                  <span>Target: <strong className="text-slate-300">{rule.targetJobName || rule.targetQueueId || rule.targetWorkflowId || rule.targetWebhookId}</strong></span>
                  <span>Triggered: <strong>{rule.totalTriggeredCount} times</strong></span>
                  {rule.lastTriggeredAt && (
                    <span>Last: {new Date(rule.lastTriggeredAt).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onToggleRule(rule.id, !rule.enabled)}
                  disabled={!canManage}
                  className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white"
                >
                  {rule.enabled ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                      <span>ENABLED</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-slate-500">
                      <ToggleLeft className="w-5 h-5" />
                      <span>DISABLED</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Event Bus Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Radio className="w-4 h-4 text-purple-400" />
          <span>Real-Time Event Bus Message Stream</span>
        </h3>

        {eventHistory.length === 0 ? (
          <div className="p-6 bg-slate-950/40 rounded-xl text-center text-xs text-slate-400">
            No events broadcasted yet. Click any 1-Click trigger above to publish an event.
          </div>
        ) : (
          <div className="space-y-2">
            {eventHistory.slice(0, 8).map((evt) => (
              <div key={evt.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-purple-300">{evt.eventName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Source: {evt.source}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {evt.matchedRulesCount} Rule(s) Triggered
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800/80 overflow-x-auto max-h-16">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Custom Event Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Send className="w-4 h-4 text-purple-400" />
                <span>Publish Event to Bus</span>
              </h3>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Event Name / Topic</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  placeholder="e.g. user.signup or order.completed"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">JSON Event Payload</label>
                <textarea
                  value={eventPayloadStr}
                  onChange={(e) => setEventPayloadStr(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/30"
                >
                  Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
