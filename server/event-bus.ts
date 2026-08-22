/**
 * Event-Driven Execution Engine
 * Decoupled event bus with configurable trigger rules, event pattern matching,
 * and automatic background job & workflow dispatching.
 */

import { EventTriggerRule, EventBusMessage, Job } from '../src/types';
import { db } from './db';

class EventBusEngine {
  private rules: Map<string, EventTriggerRule> = new Map();
  private eventHistory: EventBusMessage[] = [];

  constructor() {
    this.seedInitialRules();
  }

  private seedInitialRules() {
    const initial: EventTriggerRule[] = [
      {
        id: 'rule-user-signup',
        projectId: 'proj-prod',
        name: 'User Onboarding Pipeline',
        description: 'Triggers welcome email series and Stripe customer sync when a new user registers.',
        eventPattern: 'user.signup',
        actionType: 'SCHEDULE_JOB',
        targetQueueId: 'q-critical',
        targetJobName: 'Send Welcome Email & Provision Workspace',
        payloadTemplate: {
          templateId: 'tpl_welcome_2026',
          channel: 'email',
          priority: 'high'
        },
        enabled: true,
        totalTriggeredCount: 124,
        lastTriggeredAt: new Date(Date.now() - 140000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'rule-order-paid',
        projectId: 'proj-prod',
        name: 'Order Paid Fulfillment & Invoice',
        description: 'Auto-dispatches invoice PDF generator and warehouse inventory decrement.',
        eventPattern: 'order.paid',
        actionType: 'SCHEDULE_JOB',
        targetQueueId: 'q-default',
        targetJobName: 'Generate PDF Invoice & ERP Sync',
        payloadTemplate: {
          action: 'generate_invoice_pdf',
          currency: 'USD',
          syncErp: true
        },
        enabled: true,
        totalTriggeredCount: 89,
        lastTriggeredAt: new Date(Date.now() - 65000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'rule-media-uploaded',
        projectId: 'proj-prod',
        name: 'Video Transcoding & AI Captioning',
        description: 'Triggers video thumbnail extraction and Gemini multi-lingual audio transcription.',
        eventPattern: 'media.uploaded',
        actionType: 'TRIGGER_WORKFLOW',
        targetWorkflowId: 'wf-01',
        payloadTemplate: {
          codec: 'h264',
          targetResolutions: ['1080p', '720p', '480p'],
          generateCaptions: true
        },
        enabled: true,
        totalTriggeredCount: 42,
        lastTriggeredAt: new Date(Date.now() - 320000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'rule-security-alert',
        projectId: 'proj-prod',
        name: 'Security Anomaly Webhook Dispatch',
        description: 'Sends real-time high-priority webhook alert to PagerDuty/Slack on brute-force attempts.',
        eventPattern: 'security.anomaly',
        actionType: 'DISPATCH_WEBHOOK',
        targetWebhookId: 'wh-01',
        payloadTemplate: {
          severity: 'CRITICAL',
          autoBlockIp: true
        },
        enabled: true,
        totalTriggeredCount: 6,
        lastTriggeredAt: new Date(Date.now() - 900000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    for (const r of initial) {
      this.rules.set(r.id, r);
    }
  }

  /**
   * Publish an event into the bus, match rules, and trigger automated jobs/workflows.
   */
  publish(event: {
    eventName: string;
    source: string;
    payload: Record<string, any>;
  }): { messageId: string; matchedRules: number; spawnedJobIds: string[] } {
    const { eventName, source, payload } = event;
    const matchedRules: EventTriggerRule[] = [];
    const spawnedJobIds: string[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.matchesPattern(rule.eventPattern, eventName)) {
        matchedRules.push(rule);
        rule.totalTriggeredCount += 1;
        rule.lastTriggeredAt = new Date().toISOString();

        if (rule.actionType === 'SCHEDULE_JOB' && rule.targetQueueId) {
          const jobId = `job-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const mergedPayload = { ...rule.payloadTemplate, eventPayload: payload, triggeredByEvent: eventName };
          
          const newJob: Job = {
            id: jobId,
            projectId: rule.projectId,
            queueId: rule.targetQueueId,
            name: rule.targetJobName || `Event: ${eventName} handler`,
            type: 'immediate',
            priority: 8,
            payload: mergedPayload,
            state: 'QUEUED',
            attemptCount: 0,
            maxRetries: 3,
            retryPolicyId: 'pol-exp-jitter',
            createdAt: new Date().toISOString()
          };

          db.jobs.set(jobId, newJob);
          spawnedJobIds.push(jobId);

          const queue = db.queues.get(rule.targetQueueId);
          if (queue) queue.stats.queuedCount += 1;

          db.appendLog(jobId, 'info', `Job created automatically via Event Bus rule [${rule.name}] triggered by event "${eventName}"`);
        } else if (rule.actionType === 'TRIGGER_WORKFLOW' && rule.targetWorkflowId) {
          const wf = db.workflows.get(rule.targetWorkflowId);
          if (wf) {
            wf.status = 'RUNNING';
            for (const node of wf.nodes) {
              if (node.dependsOn.length === 0) {
                node.status = 'PENDING';
              } else {
                node.status = 'WAITING';
              }
            }
          }
        }
      }
    }

    const msgId = `evt-msg-${Date.now()}`;
    const logEntry: EventBusMessage = {
      id: msgId,
      eventName,
      source,
      payload,
      timestamp: new Date().toISOString(),
      matchedRulesCount: matchedRules.length,
      triggeredJobIds: spawnedJobIds,
      status: matchedRules.length > 0 ? 'PROCESSED' : 'NO_MATCH'
    };

    this.eventHistory.unshift(logEntry);
    if (this.eventHistory.length > 100) this.eventHistory.pop();

    db.emitEvent({
      id: 'evt-' + Date.now(),
      type: 'job:created',
      timestamp: new Date().toISOString(),
      data: { eventName, matchedRules: matchedRules.length, spawnedJobIds },
      message: `Event Bus: "${eventName}" dispatched -> ${matchedRules.length} rule(s) triggered`
    });

    return { messageId: msgId, matchedRules: matchedRules.length, spawnedJobIds };
  }

  private matchesPattern(pattern: string, eventName: string): boolean {
    if (pattern === '*' || pattern === eventName) return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventName.startsWith(prefix);
    }
    return false;
  }

  getRules(): EventTriggerRule[] {
    return Array.from(this.rules.values());
  }

  createRule(rule: Partial<EventTriggerRule>): EventTriggerRule {
    const id = `rule-${Date.now()}`;
    const newRule: EventTriggerRule = {
      id,
      projectId: rule.projectId || 'proj-prod',
      name: rule.name || 'Custom Event Trigger Rule',
      description: rule.description || '',
      eventPattern: rule.eventPattern || 'custom.event',
      actionType: rule.actionType || 'SCHEDULE_JOB',
      targetQueueId: rule.targetQueueId || 'q-default',
      targetJobName: rule.targetJobName || 'Custom Event Job',
      targetWorkflowId: rule.targetWorkflowId,
      targetWebhookId: rule.targetWebhookId,
      payloadTemplate: rule.payloadTemplate || {},
      enabled: rule.enabled ?? true,
      totalTriggeredCount: 0,
      createdAt: new Date().toISOString()
    };

    this.rules.set(id, newRule);
    return newRule;
  }

  toggleRule(ruleId: string, enabled: boolean): boolean {
    const r = this.rules.get(ruleId);
    if (!r) return false;
    r.enabled = enabled;
    return true;
  }

  getEventHistory(): EventBusMessage[] {
    return this.eventHistory;
  }
}

export const eventBus = new EventBusEngine();
