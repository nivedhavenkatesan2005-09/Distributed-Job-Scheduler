import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { DashboardView } from './components/DashboardView';
import { QueueManager } from './components/QueueManager';
import { JobExplorer } from './components/JobExplorer';
import { JobDetailModal } from './components/JobDetailModal';
import { WorkerFleet } from './components/WorkerFleet';
import { DeadLetterQueueView } from './components/DeadLetterQueueView';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { LiveLogStream } from './components/LiveLogStream';
import { ArchitectureView } from './components/ArchitectureView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { ApiDocsView } from './components/ApiDocsView';
import { DesignDecisionsView } from './components/DesignDecisionsView';
import { AutomatedTestRunner } from './components/AutomatedTestRunner';
import { AlertThresholdModal } from './components/AlertThresholdModal';
import { AlertBanner } from './components/AlertBanner';
import { RecurringSchedulesView } from './components/RecurringSchedulesView';
import { WebhooksView } from './components/WebhooksView';
import { ExecutionTimelineView } from './components/ExecutionTimelineView';

import {
  Project,
  Queue,
  Job,
  Worker,
  DeadLetterJob,
  Workflow,
  SystemMetrics,
  SystemEvent,
  User,
  Role,
  AlertThresholdConfig,
  ActiveAlertNotification,
  ThemeMode
} from './types';

const DEFAULT_ALERT_CONFIG: AlertThresholdConfig = {
  enabled: true,
  cpuLimitPct: 75,
  memoryLimitMb: 400,
  queueDepthLimit: 15,
  errorRateLimitPct: 10,
  clusterUtilizationLimitPct: 85,
  soundEnabled: false
};

const DEFAULT_USER: User = {
  id: 'usr-admin',
  name: 'Alex Rivera',
  email: 'alex.rivera@hyperplane.io',
  role: 'admin',
  organizationId: 'org-main',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
};

import { LoginScreen } from './components/LoginScreen';

export function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hyperplane_token');
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('hyperplane_user');
      if (savedUser) return JSON.parse(savedUser);
      const token = localStorage.getItem('hyperplane_token');
      if (token) return DEFAULT_USER;
      return null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('hyperplane_theme') as ThemeMode;
      if (saved && ['cyber', 'violet', 'crimson', 'emerald', 'warm', 'light'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'cyber'; // Default to Cyber Cyan dark theme
  });

  useEffect(() => {
    try {
      localStorage.setItem('hyperplane_theme', theme);
    } catch {}
    document.documentElement.classList.remove(
      'theme-cyber',
      'theme-violet',
      'theme-crimson',
      'theme-emerald',
      'theme-warm',
      'theme-light'
    );
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-prod');

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [dlqItems, setDlqItems] = useState<DeadLetterJob[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobLogs, setSelectedJobLogs] = useState<any[]>([]);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>('ALL');

  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const [isDiagnosingAi, setIsDiagnosingAi] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Alert Thresholds State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem('hyperplane_alert_thresholds');
      return saved ? JSON.parse(saved) : DEFAULT_ALERT_CONFIG;
    } catch {
      return DEFAULT_ALERT_CONFIG;
    }
  });
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertNotification[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const prevAlertCountRef = useRef(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  // Save Alert Config
  const handleSaveAlertConfig = (newConfig: AlertThresholdConfig) => {
    setAlertConfig(newConfig);
    try {
      localStorage.setItem('hyperplane_alert_thresholds', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
    showToast('KPI Alert Thresholds saved');
  };

  // Real-Time Alert Evaluator
  useEffect(() => {
    if (!alertConfig.enabled) {
      setActiveAlerts([]);
      return;
    }

    const detectedAlerts: ActiveAlertNotification[] = [];
    const timestamp = new Date().toISOString();

    // 1. Evaluate Worker CPU
    if (workers.length > 0) {
      const highCpuWorker = workers.find(
        w => w.status !== 'SHUTDOWN' && w.cpuUsagePct >= alertConfig.cpuLimitPct
      );
      if (highCpuWorker) {
        const id = `alert-cpu-${highCpuWorker.id}`;
        if (!dismissedAlertIds.has(id)) {
          detectedAlerts.push({
            id,
            metricType: 'cpu',
            title: `High CPU Utilization on ${highCpuWorker.name}`,
            message: `Worker node ${highCpuWorker.hostname} is running at ${highCpuWorker.cpuUsagePct}% CPU load (limit: ${alertConfig.cpuLimitPct}%). Consider scaling worker nodes.`,
            currentValue: highCpuWorker.cpuUsagePct,
            thresholdValue: alertConfig.cpuLimitPct,
            unit: '%',
            severity: highCpuWorker.cpuUsagePct >= alertConfig.cpuLimitPct + 10 ? 'critical' : 'warning',
            timestamp,
            acknowledged: false
          });
        }
      }
    }

    // 2. Evaluate Worker Memory
    if (workers.length > 0) {
      const highMemWorker = workers.find(
        w => w.status !== 'SHUTDOWN' && w.memoryUsageMb >= alertConfig.memoryLimitMb
      );
      if (highMemWorker) {
        const id = `alert-mem-${highMemWorker.id}`;
        if (!dismissedAlertIds.has(id)) {
          detectedAlerts.push({
            id,
            metricType: 'memory',
            title: `Worker Memory Pressure on ${highMemWorker.name}`,
            message: `Worker node is consuming ${highMemWorker.memoryUsageMb} MB memory (limit: ${alertConfig.memoryLimitMb} MB). Heap ceiling approaching.`,
            currentValue: highMemWorker.memoryUsageMb,
            thresholdValue: alertConfig.memoryLimitMb,
            unit: ' MB',
            severity: highMemWorker.memoryUsageMb >= alertConfig.memoryLimitMb + 50 ? 'critical' : 'warning',
            timestamp,
            acknowledged: false
          });
        }
      }
    }

    // 3. Evaluate Queue Depth Backlog
    if (metrics && metrics.queuedJobs >= alertConfig.queueDepthLimit) {
      const id = 'alert-queue-depth';
      if (!dismissedAlertIds.has(id)) {
        detectedAlerts.push({
          id,
          metricType: 'queue_depth',
          title: `Queue Backlog Exceeded Threshold`,
          message: `Cluster backlog has accumulated ${metrics.queuedJobs} pending tasks (threshold: ${alertConfig.queueDepthLimit} tasks). Ingress exceeds throughput.`,
          currentValue: metrics.queuedJobs,
          thresholdValue: alertConfig.queueDepthLimit,
          unit: ' jobs',
          severity: metrics.queuedJobs >= alertConfig.queueDepthLimit * 1.5 ? 'critical' : 'warning',
          timestamp,
          acknowledged: false
        });
      }
    }

    // 4. Evaluate Cluster Concurrency Utilization
    if (metrics && metrics.clusterUtilizationPct >= alertConfig.clusterUtilizationLimitPct) {
      const id = 'alert-cluster-utilization';
      if (!dismissedAlertIds.has(id)) {
        detectedAlerts.push({
          id,
          metricType: 'cluster_utilization',
          title: `Cluster Concurrency Saturation`,
          message: `Active worker fleet concurrency capacity is at ${metrics.clusterUtilizationPct}% (limit: ${alertConfig.clusterUtilizationLimitPct}%).`,
          currentValue: metrics.clusterUtilizationPct,
          thresholdValue: alertConfig.clusterUtilizationLimitPct,
          unit: '%',
          severity: metrics.clusterUtilizationPct >= 95 ? 'critical' : 'warning',
          timestamp,
          acknowledged: false
        });
      }
    }

    setActiveAlerts(detectedAlerts);

    // Audio & Toast cue on new breach
    if (detectedAlerts.length > prevAlertCountRef.current && detectedAlerts.length > 0) {
      if (alertConfig.soundEnabled) {
        playAlertSound();
      }
      showToast(`⚠️ KPI Alert: ${detectedAlerts[0].title}`);
    }
    prevAlertCountRef.current = detectedAlerts.length;
  }, [workers, metrics, alertConfig, dismissedAlertIds, playAlertSound]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlertIds(prev => new Set(prev).add(id));
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleDismissAllAlerts = () => {
    setDismissedAlertIds(prev => {
      const updated = new Set(prev);
      activeAlerts.forEach(a => updated.add(a.id));
      return updated;
    });
    setActiveAlerts([]);
    showToast('All active alerts acknowledged');
  };

  const handleTriggerTestAlert = () => {
    const testId = `alert-test-${Date.now()}`;
    const syntheticAlert: ActiveAlertNotification = {
      id: testId,
      metricType: 'cpu',
      title: 'Simulated High CPU Spike Alert',
      message: 'Worker node node-worker-1 exceeded CPU threshold: currently at 89.2% (configured limit: ' + alertConfig.cpuLimitPct + '%).',
      currentValue: 89.2,
      thresholdValue: alertConfig.cpuLimitPct,
      unit: '%',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    setDismissedAlertIds(prev => {
      const next = new Set(prev);
      next.delete(testId);
      return next;
    });

    setActiveAlerts(prev => [syntheticAlert, ...prev.filter(a => a.id !== testId)]);
    if (alertConfig.soundEnabled) {
      playAlertSound();
    }
    showToast('Simulated KPI alert triggered');
    setIsAlertModalOpen(false);
  };

  const handleLogin = useCallback((token: string, loggedUser: User) => {
    try {
      localStorage.setItem('hyperplane_token', token);
      localStorage.setItem('hyperplane_user', JSON.stringify(loggedUser));
    } catch {}
    setAuthToken(token);
    setCurrentUser(loggedUser);
    showToast(`Welcome back, ${loggedUser.name}`);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('hyperplane_token');
      localStorage.removeItem('hyperplane_user');
    } catch {}
    setAuthToken(null);
    setCurrentUser(null);
    showToast('Signed out of cluster');
  }, []);

  // Helper safe fetch for JSON endpoints
  const safeFetchJson = async (url: string, init?: RequestInit) => {
    try {
      const headers = {
        ...(init?.headers || {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(url, { ...init, headers });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
        }
        return null;
      }
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  // 1. Initial State Fetch
  const fetchData = useCallback(async () => {
    if (!authToken) return;
    try {
      const [
        authRes,
        projRes,
        queueRes,
        jobsRes,
        workersRes,
        dlqRes,
        wfRes,
        metricsRes
      ] = await Promise.all([
        safeFetchJson('/api/auth/me'),
        safeFetchJson('/api/projects'),
        safeFetchJson(`/api/queues?projectId=${selectedProjectId}`),
        safeFetchJson('/api/jobs?limit=100'),
        safeFetchJson('/api/workers'),
        safeFetchJson('/api/dlq'),
        safeFetchJson('/api/workflows'),
        safeFetchJson('/api/metrics')
      ]);

      if (authRes?.user) setCurrentUser(authRes.user);
      if (Array.isArray(projRes)) setProjects(projRes);
      if (Array.isArray(queueRes)) setQueues(queueRes);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (Array.isArray(workersRes)) setWorkers(workersRes);
      if (Array.isArray(dlqRes)) setDlqItems(dlqRes);
      if (Array.isArray(wfRes)) setWorkflows(wfRes);
      if (metricsRes) setMetrics(metricsRes);
    } catch (err) {
      console.warn('[Client] Initial data fetch warning:', err);
    }
  }, [selectedProjectId, authToken]);

  useEffect(() => {
    if (authToken) {
      fetchData();
    }
  }, [fetchData, authToken]);

  // 2. Real-Time SSE Stream with Polling Fallback
  useEffect(() => {
    if (!authToken) return;

    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsSseConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'event' && payload.event) {
            setEvents(prev => [payload.event, ...prev.slice(0, 150)]);
          }
          // Debounced state refresh
          fetchData();
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        setIsSseConnected(false);
      };
    } catch {
      setIsSseConnected(false);
    }

    // Polling interval as reliable backup
    fallbackInterval = setInterval(() => {
      fetchData();
    }, 2000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchData, authToken]);

  // 3. User Role Switcher
  const setCurrentUserRole = (role: Role) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, role });
    showToast(`Active RBAC role switched to ${role.toUpperCase()}`);
  };

  // 4. Job Management Handlers
  const handleSelectJob = async (job: Job) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`);
      const fullJob = await res.json();
      setSelectedJob(fullJob);
      setSelectedJobLogs(fullJob.logs || []);
    } catch {
      setSelectedJob(job);
      setSelectedJobLogs([]);
    }
  };

  const handleCreateJob = async (jobData: any) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...jobData, projectId: selectedProjectId })
      });
      const created = await res.json();
      showToast(`Job "${created.name}" successfully enqueued`);
      fetchData();
    } catch (err: any) {
      showToast(`Failed to enqueue job: ${err?.message}`);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
      showToast(`Job ${jobId} scheduled for retry`);
      fetchData();
      if (selectedJob?.id === jobId) {
        handleSelectJob(selectedJob);
      }
    } catch (err: any) {
      showToast(`Retry failed: ${err?.message}`);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      showToast(`Job ${jobId} cancelled`);
      fetchData();
      if (selectedJob?.id === jobId) {
        handleSelectJob(selectedJob);
      }
    } catch (err: any) {
      showToast(`Cancel failed: ${err?.message}`);
    }
  };

  // 5. Queue Management Handlers
  const handleToggleQueuePause = async (queueId: string, isPaused: boolean) => {
    try {
      await fetch(`/api/queues/${queueId}/pause`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused })
      });
      showToast(`Queue ${isPaused ? 'paused' : 'resumed'}`);
      fetchData();
    } catch (err: any) {
      showToast(`Action failed: ${err?.message}`);
    }
  };

  const handlePurgeQueue = async (queueId: string) => {
    try {
      const res = await fetch(`/api/queues/${queueId}/purge`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Queue purged');
      fetchData();
    } catch (err: any) {
      showToast(`Purge failed: ${err?.message}`);
    }
  };

  const handleUpdateQueue = async (queueId: string, updates: Partial<Queue>) => {
    try {
      await fetch(`/api/queues/${queueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      showToast('Queue configuration updated');
      fetchData();
    } catch (err: any) {
      showToast(`Update failed: ${err?.message}`);
    }
  };

  const handleCreateQueue = async (data: any) => {
    try {
      await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: selectedProjectId })
      });
      showToast(`Queue "${data.name}" provisioned`);
      fetchData();
    } catch (err: any) {
      showToast(`Creation failed: ${err?.message}`);
    }
  };

  // 6. Worker Fleet Handlers
  const handleScaleFleet = async (targetCount: number) => {
    try {
      const res = await fetch('/api/workers/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCount })
      });
      const data = await res.json();
      showToast(data.message || `Scaled worker cluster to ${targetCount} nodes`);
      fetchData();
    } catch (err: any) {
      showToast(`Scale failed: ${err?.message}`);
    }
  };

  const handleShutdownWorker = async (workerId: string) => {
    try {
      await fetch(`/api/workers/${workerId}/shutdown`, { method: 'POST' });
      showToast(`Worker node ${workerId} received shutdown signal`);
      fetchData();
    } catch (err: any) {
      showToast(`Shutdown failed: ${err?.message}`);
    }
  };

  const handlePauseWorker = async (workerId: string) => {
    try {
      await fetch(`/api/workers/${workerId}/pause`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      showToast(`Action failed: ${err?.message}`);
    }
  };

  // 7. Dead Letter Queue (DLQ) Handlers
  const handleReplayDlq = async (dlqId: string) => {
    try {
      const res = await fetch(`/api/dlq/${dlqId}/replay`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Job replayed to queue');
      fetchData();
    } catch (err: any) {
      showToast(`Replay failed: ${err?.message}`);
    }
  };

  const handleBulkReplayDlq = async () => {
    try {
      const res = await fetch('/api/dlq/bulk-replay', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Bulk replayed jobs');
      fetchData();
    } catch (err: any) {
      showToast(`Bulk replay failed: ${err?.message}`);
    }
  };

  const handlePurgeDlqItem = async (dlqId: string) => {
    try {
      await fetch(`/api/dlq/${dlqId}`, { method: 'DELETE' });
      showToast('Item purged from Dead Letter Queue');
      fetchData();
    } catch (err: any) {
      showToast(`Purge failed: ${err?.message}`);
    }
  };

  // 8. Gemini AI Failure Triage
  const handleDiagnoseWithAi = async (job: Job | DeadLetterJob) => {
    setIsDiagnosingAi(true);
    try {
      const res = await fetch('/api/ai/diagnose-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: 'id' in job ? job.id : undefined,
          jobName: 'name' in job ? job.name : (job as DeadLetterJob).jobName,
          errorMessage: 'errorMessage' in job ? job.errorMessage : (job as DeadLetterJob).failedReason,
          errorStack: 'errorStack' in job ? job.errorStack : (job as DeadLetterJob).errorStack,
          payload: job.payload
        })
      });
      const diagnosis = await res.json();
      showToast('Gemini AI Diagnostic generated successfully');
      
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob({ ...selectedJob, aiDiagnosis: diagnosis });
      }
      fetchData();
    } catch (err: any) {
      showToast(`AI Diagnosis failed: ${err?.message}`);
    } finally {
      setIsDiagnosingAi(false);
    }
  };

  // 9. Workflows Handlers
  const handleCreateWorkflow = async (data: any) => {
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: selectedProjectId })
      });
      showToast(`DAG Pipeline "${data.name}" launched`);
      fetchData();
    } catch (err: any) {
      showToast(`Workflow creation failed: ${err?.message}`);
    }
  };

  // 10. Traffic Simulator
  const handleSpawnTraffic = async (burstFailures: boolean = false) => {
    try {
      const res = await fetch('/api/simulation/spawn-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10, burstFailures })
      });
      const data = await res.json();
      showToast(data.message || 'Spawned 10 background jobs');
      fetchData();
    } catch (err: any) {
      showToast(`Traffic simulation failed: ${err?.message}`);
    }
  };

  if (!authToken || !currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen font-sans pb-16 theme-${theme}`}>
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        currentUser={currentUser}
        setCurrentUserRole={setCurrentUserRole}
        onSpawnTraffic={handleSpawnTraffic}
        isSseConnected={isSseConnected}
        dlqCount={dlqItems.filter(d => !d.resolvedAt).length}
        activeAlertCount={activeAlerts.length}
        onOpenAlertSettings={() => setIsAlertModalOpen(true)}
        currentTheme={theme}
        onSelectTheme={setTheme}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Real-time KPI Threshold Breach Alert Banner */}
        <AlertBanner
          alerts={activeAlerts}
          onDismissAlert={handleDismissAlert}
          onDismissAll={handleDismissAllAlerts}
          onOpenThresholdModal={() => setIsAlertModalOpen(true)}
          onNavigateToTab={(tab) => setActiveTab(tab)}
          onScaleWorkers={(count) => handleScaleFleet(count)}
        />

        {/* Tab Views Router */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Metrics Strip for Dashboard */}
            <MetricCards
              metrics={metrics}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenAlertSettings={() => setIsAlertModalOpen(true)}
              activeAlerts={activeAlerts}
            />

            <DashboardView
              metrics={metrics}
              queues={queues}
              recentJobs={jobs}
              workers={workers}
              recentEvents={events}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectJob={handleSelectJob}
              onSpawnTraffic={handleSpawnTraffic}
            />
          </>
        )}

        {activeTab === 'queues' && (
          <QueueManager
            queues={queues}
            onTogglePause={handleToggleQueuePause}
            onPurgeQueue={handlePurgeQueue}
            onUpdateQueue={handleUpdateQueue}
            onCreateQueue={handleCreateQueue}
            onSelectQueueForFilter={(qId) => {
              setSelectedQueueFilter(qId);
              setActiveTab('jobs');
            }}
          />
        )}

        {activeTab === 'jobs' && (
          <JobExplorer
            jobs={jobs}
            queues={queues}
            selectedQueueFilter={selectedQueueFilter}
            setSelectedQueueFilter={setSelectedQueueFilter}
            onSelectJob={handleSelectJob}
            onRetryJob={handleRetryJob}
            onCancelJob={handleCancelJob}
            onCreateJob={handleCreateJob}
          />
        )}

        {activeTab === 'schedules' && (
          <RecurringSchedulesView
            queues={queues}
            currentUserRole={currentUser?.role || 'ADMIN'}
            onEnqueueJob={handleCreateJob}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'timeline' && (
          <ExecutionTimelineView
            jobs={jobs}
            workers={workers}
            metrics={metrics}
            onSelectJob={handleSelectJob}
          />
        )}

        {activeTab === 'webhooks' && (
          <WebhooksView
            currentUserRole={currentUser?.role || 'ADMIN'}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'workers' && (
          <WorkerFleet
            workers={workers}
            onScaleFleet={handleScaleFleet}
            onShutdownWorker={handleShutdownWorker}
            onPauseWorker={handlePauseWorker}
          />
        )}

        {activeTab === 'dlq' && (
          <DeadLetterQueueView
            dlqItems={dlqItems}
            onReplayJob={handleReplayDlq}
            onBulkReplay={handleBulkReplayDlq}
            onPurgeDlqItem={handlePurgeDlqItem}
            onDiagnoseDlqWithAi={handleDiagnoseWithAi}
            isDiagnosingAi={isDiagnosingAi}
          />
        )}

        {activeTab === 'workflows' && (
          <WorkflowVisualizer
            workflows={workflows}
            onCreateWorkflow={handleCreateWorkflow}
          />
        )}

        {activeTab === 'logs' && (
          <LiveLogStream
            events={events}
            onClearEvents={() => setEvents([])}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}

        {activeTab === 'schema' && (
          <DatabaseSchemaView />
        )}

        {activeTab === 'api-docs' && (
          <ApiDocsView />
        )}

        {activeTab === 'design-decisions' && (
          <DesignDecisionsView />
        )}

        {activeTab === 'tests' && (
          <AutomatedTestRunner />
        )}

      </main>

      {/* Detailed Job Inspection Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          logs={selectedJobLogs}
          onClose={() => setSelectedJob(null)}
          onRetry={handleRetryJob}
          onCancel={handleCancelJob}
          onDiagnoseWithAi={handleDiagnoseWithAi}
          isDiagnosingAi={isDiagnosingAi}
        />
      )}

      {/* KPI Alert Thresholds Configuration Modal */}
      {isAlertModalOpen && (
        <AlertThresholdModal
          config={alertConfig}
          onSave={handleSaveAlertConfig}
          onClose={() => setIsAlertModalOpen(false)}
          onTriggerTestAlert={handleTriggerTestAlert}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 text-xs flex items-center space-x-2 animate-bounce shadow-amber-900/30">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
export default App;
