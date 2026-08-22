import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Layers,
  Activity,
  Server,
  AlertOctagon,
  GitMerge,
  Terminal,
  Database,
  BookOpen,
  CheckCircle2,
  Zap,
  Radio,
  FileCode2,
  Timer,
  Webhook,
  GanttChartSquare,
  ShieldCheck,
  Play,
  Flame,
  Palette,
  BellRing,
  Sliders,
  Users,
  CornerDownLeft,
  Command,
  X,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { Role, ThemeMode, User } from '../types';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onSpawnTraffic?: (burstFailures?: boolean) => void;
  onOpenAlertSettings?: () => void;
  onOpenRateLimitModal?: () => void;
  onOpenRbacModal?: () => void;
  onSelectTheme?: (theme: ThemeMode) => void;
  currentTheme?: ThemeMode;
  dlqCount?: number;
  currentUser?: User | null;
}

interface PaletteItem {
  id: string;
  type: 'tab' | 'action' | 'theme';
  title: string;
  description: string;
  category: 'Operations' | 'Automation' | 'Observability' | 'Docs' | 'Quick Actions' | 'Appearance';
  icon: React.ElementType;
  shortcut?: string;
  badge?: string | number;
  action: () => void;
  keywords?: string[];
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onSpawnTraffic,
  onOpenAlertSettings,
  onOpenRateLimitModal,
  onOpenRbacModal,
  onSelectTheme,
  currentTheme = 'cyber',
  dlqCount = 0
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // All actionable items
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [
      // Core Operations
      {
        id: 'dashboard',
        type: 'tab',
        title: 'System Dashboard',
        description: 'Real-time metrics, throughput charts, and system status overview',
        category: 'Operations',
        icon: Activity,
        keywords: ['overview', 'metrics', 'kpi', 'home', 'stats', 'analytics'],
        action: () => {
          onSelectTab('dashboard');
          onClose();
        }
      },
      {
        id: 'queues',
        type: 'tab',
        title: 'Queues & Rate Limits',
        description: 'Manage priority queues, concurrency limits, and token-bucket regulators',
        category: 'Operations',
        icon: Layers,
        keywords: ['queues', 'rate limiting', 'tokens', 'capacity', 'rpm', 'burst', 'backpressure'],
        action: () => {
          onSelectTab('queues');
          onClose();
        }
      },
      {
        id: 'jobs',
        type: 'tab',
        title: 'Job Explorer & Ingestion',
        description: 'Filter, inspect, enqueue, and inspect distributed jobs with payloads',
        category: 'Operations',
        icon: Zap,
        keywords: ['jobs', 'tasks', 'payload', 'enqueue', 'create', 'filter', 'search'],
        action: () => {
          onSelectTab('jobs');
          onClose();
        }
      },
      {
        id: 'dlq',
        type: 'tab',
        title: 'Dead Letter Queue (DLQ)',
        description: 'Isolate failed jobs, inspect stack traces, and run AI root-cause triage',
        category: 'Operations',
        icon: AlertOctagon,
        badge: dlqCount > 0 ? `${dlqCount} failed` : undefined,
        keywords: ['dead letter', 'dlq', 'failures', 'poison pill', 'retries', 'ai diagnosis', 'remediation'],
        action: () => {
          onSelectTab('dlq');
          onClose();
        }
      },
      {
        id: 'locks',
        type: 'tab',
        title: 'Distributed Locks (Redlock)',
        description: 'Mutual exclusion coordinator with TTL leases and fencing tokens',
        category: 'Operations',
        icon: ShieldCheck,
        keywords: ['locks', 'redlock', 'mutex', 'leases', 'fencing', 'concurrency', 'ttl'],
        action: () => {
          onSelectTab('locks');
          onClose();
        }
      },
      {
        id: 'shards',
        type: 'tab',
        title: 'Queue Sharding & Ring',
        description: 'Consistent hashing ring with 100 VNodes per shard partition',
        category: 'Operations',
        icon: Database,
        keywords: ['shards', 'hashing', 'partitions', 'virtual nodes', 'scale', 'cluster'],
        action: () => {
          onSelectTab('shards');
          onClose();
        }
      },

      // Automation & Workflows
      {
        id: 'events',
        type: 'tab',
        title: 'Event-Driven Bus (Pub/Sub)',
        description: 'Topic-based broker with wildcard regex matching and audit trails',
        category: 'Automation',
        icon: Radio,
        keywords: ['events', 'pubsub', 'broker', 'trigger', 'dispatch', 'topics'],
        action: () => {
          onSelectTab('events');
          onClose();
        }
      },
      {
        id: 'workflows',
        type: 'tab',
        title: 'Workflows (DAG Engine)',
        description: 'Topological DAG pipelines with step dependencies & branch execution',
        category: 'Automation',
        icon: GitMerge,
        keywords: ['dag', 'workflows', 'pipelines', 'dependencies', 'topological', 'kahn'],
        action: () => {
          onSelectTab('workflows');
          onClose();
        }
      },
      {
        id: 'schedules',
        type: 'tab',
        title: 'Recurring Cron Schedules',
        description: 'Cron syntax scheduling with timezone support and execution histories',
        category: 'Automation',
        icon: Timer,
        keywords: ['cron', 'recurring', 'schedule', 'periodic', 'timer'],
        action: () => {
          onSelectTab('schedules');
          onClose();
        }
      },
      {
        id: 'webhooks',
        type: 'tab',
        title: 'Webhooks & Endpoints',
        description: 'Automated HTTP event dispatching with HMAC signature verification',
        category: 'Automation',
        icon: Webhook,
        keywords: ['webhooks', 'http', 'callback', 'hmac', 'signature', 'endpoints'],
        action: () => {
          onSelectTab('webhooks');
          onClose();
        }
      },

      // Observability
      {
        id: 'timeline',
        type: 'tab',
        title: 'Execution Gantt Timeline',
        description: 'Live interactive timeline visualizing worker concurrency and latencies',
        category: 'Observability',
        icon: GanttChartSquare,
        keywords: ['timeline', 'gantt', 'latency', 'duration', 'execution', 'waterfall'],
        action: () => {
          onSelectTab('timeline');
          onClose();
        }
      },
      {
        id: 'workers',
        type: 'tab',
        title: 'Worker Fleet & Scaling',
        description: 'Inspect active worker nodes, CPU/RAM utilization, and heartbeat health',
        category: 'Observability',
        icon: Server,
        keywords: ['workers', 'fleet', 'nodes', 'heartbeat', 'scaling', 'cpu', 'memory'],
        action: () => {
          onSelectTab('workers');
          onClose();
        }
      },
      {
        id: 'logs',
        type: 'tab',
        title: 'Live Log Stream',
        description: 'Real-time structured system log stream with level filtering',
        category: 'Observability',
        icon: Terminal,
        keywords: ['logs', 'stream', 'stdout', 'telemetry', 'debug', 'console'],
        action: () => {
          onSelectTab('logs');
          onClose();
        }
      },

      // Docs & Specs
      {
        id: 'schema',
        type: 'tab',
        title: 'Entity Relationship Schema',
        description: 'Interactive visual database schema and ACID transactional models',
        category: 'Docs',
        icon: Database,
        keywords: ['schema', 'database', 'erd', 'tables', 'relations', 'sql'],
        action: () => {
          onSelectTab('schema');
          onClose();
        }
      },
      {
        id: 'architecture',
        type: 'tab',
        title: 'System Architecture Diagram',
        description: 'Multi-layer system diagram showing ingress, broker, workers, and storage',
        category: 'Docs',
        icon: Radio,
        keywords: ['architecture', 'diagram', 'topology', 'system', 'flow'],
        action: () => {
          onSelectTab('architecture');
          onClose();
        }
      },
      {
        id: 'api-docs',
        type: 'tab',
        title: 'REST API & WebSocket Specs',
        description: 'Full OpenAPI specifications, cURL examples, and payload schemas',
        category: 'Docs',
        icon: FileCode2,
        keywords: ['api', 'rest', 'endpoints', 'curl', 'openapi', 'websocket', 'docs'],
        action: () => {
          onSelectTab('api-docs');
          onClose();
        }
      },
      {
        id: 'design-decisions',
        type: 'tab',
        title: 'Architecture Whitepaper',
        description: 'In-depth distributed systems tradeoffs, CAP theorem, and benchmarks',
        category: 'Docs',
        icon: BookOpen,
        keywords: ['whitepaper', 'design', 'decisions', 'tradeoffs', 'cap theorem', 'benchmarks'],
        action: () => {
          onSelectTab('design-decisions');
          onClose();
        }
      },
      {
        id: 'tests',
        type: 'tab',
        title: 'Automated Concurrency Test Suite',
        description: 'Run 7 distributed invariant tests: CAS single-claim, DLQ routing, DAG cycles',
        category: 'Docs',
        icon: CheckCircle2,
        keywords: ['tests', 'verification', 'concurrency', 'invariants', 'cas', 'stress test'],
        action: () => {
          onSelectTab('tests');
          onClose();
        }
      },

      // Quick Actions
      {
        id: 'action-spawn-traffic',
        type: 'action',
        title: 'Simulate 10 Normal Jobs',
        description: 'Enqueue batch of distributed workloads across high/default/low queues',
        category: 'Quick Actions',
        icon: Play,
        shortcut: 'Ctrl+T',
        keywords: ['traffic', 'simulate', 'batch', 'enqueue', 'workload'],
        action: () => {
          onSpawnTraffic?.(false);
          onClose();
        }
      },
      {
        id: 'action-spawn-chaos',
        type: 'action',
        title: 'Simulate Chaos & Poison Bursts',
        description: 'Inject failing jobs and timeouts to test retry backoff and DLQ routing',
        category: 'Quick Actions',
        icon: Flame,
        keywords: ['chaos', 'fail', 'burst', 'poison pill', 'timeout', 'simulate'],
        action: () => {
          onSpawnTraffic?.(true);
          onClose();
        }
      },
      {
        id: 'action-rate-limits',
        type: 'action',
        title: 'Configure Token-Bucket Rate Limits',
        description: 'Tune RPM throughput ceilings and burst token replenishment',
        category: 'Quick Actions',
        icon: Sliders,
        keywords: ['rate limit', 'token bucket', 'rpm', 'burst', 'throttle'],
        action: () => {
          onOpenRateLimitModal?.();
          onClose();
        }
      },
      {
        id: 'action-rbac',
        type: 'action',
        title: 'Open RBAC Permissions Matrix',
        description: 'Inspect fine-grained role privileges across ADMIN, OPERATOR, DEVELOPER, VIEWER',
        category: 'Quick Actions',
        icon: Users,
        keywords: ['rbac', 'roles', 'permissions', 'admin', 'matrix', 'security'],
        action: () => {
          onOpenRbacModal?.();
          onClose();
        }
      },
      {
        id: 'action-alerts',
        type: 'action',
        title: 'Configure Alert Thresholds',
        description: 'Set KPI trigger rules for DLQ spikes, worker lag, and SLA breaches',
        category: 'Quick Actions',
        icon: BellRing,
        keywords: ['alerts', 'thresholds', 'notifications', 'sla', 'lag'],
        action: () => {
          onOpenAlertSettings?.();
          onClose();
        }
      }
    ];

    // Theme Switchers
    if (onSelectTheme) {
      const themes: { mode: ThemeMode; label: string; desc: string }[] = [
        { mode: 'cyber', label: 'Cyber Cyan (Default Dark)', desc: 'High-contrast neon cyan and deep space slate' },
        { mode: 'violet', label: 'Electric Violet', desc: 'Sleek purple-indigo dark theme for operations' },
        { mode: 'emerald', label: 'Matrix Emerald', desc: 'High-visibility telemetry green theme' },
        { mode: 'crimson', label: 'Crimson Ops', desc: 'Dark red alert styling for production monitoring' },
        { mode: 'light', label: 'Studio Light', desc: 'Clean, crisp high-contrast daylight aesthetic' },
        { mode: 'warm', label: 'Warm Sand', desc: 'Muted warm solarized palette for low eye strain' }
      ];

      themes.forEach(t => {
        items.push({
          id: `theme-${t.mode}`,
          type: 'theme',
          title: `Theme: ${t.label}`,
          description: t.desc,
          category: 'Appearance',
          icon: Palette,
          badge: currentTheme === t.mode ? 'Active' : undefined,
          keywords: ['theme', 'color', 'dark mode', 'light mode', 'style', t.mode],
          action: () => {
            onSelectTheme(t.mode);
            onClose();
          }
        });
      });
    }

    return items;
  }, [
    onSelectTab,
    onClose,
    dlqCount,
    onSpawnTraffic,
    onOpenRateLimitModal,
    onOpenRbacModal,
    onOpenAlertSettings,
    onSelectTheme,
    currentTheme
  ]);

  // Filtered items based on query & category
  const filteredItems = useMemo(() => {
    let list = allItems;

    if (selectedCategory !== 'ALL') {
      list = list.filter(item => item.category === selectedCategory);
    }

    if (!query.trim()) {
      return list;
    }

    const q = query.toLowerCase().trim();
    return list.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = item.description.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const kwMatch = item.keywords?.some(kw => kw.toLowerCase().includes(q));
      return titleMatch || descMatch || catMatch || kwMatch;
    });
  }, [allItems, query, selectedCategory]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Ensure active element is scrolled into view
  useEffect(() => {
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories = ['ALL', 'Operations', 'Automation', 'Observability', 'Docs', 'Quick Actions', 'Appearance'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-slate-900/95 text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a tab name, feature, or action (e.g. 'DAG', 'DLQ', 'Locks', 'Theme')..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors mr-2"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 text-[11px] text-slate-400 font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd>
            <span className="hidden sm:inline">to close</span>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center space-x-1 px-4 py-2 bg-slate-950/30 border-b border-slate-800/60 overflow-x-auto no-scrollbar text-xs">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {cat === 'ALL' ? 'All Items' : cat}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[420px] scrollbar-thin scrollbar-thumb-slate-700"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-300">No matching tabs or commands found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &quot;queues&quot;, &quot;dag&quot;, &quot;shards&quot;, &quot;workers&quot;, or &quot;theme&quot;</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isCurrentTab = item.type === 'tab' && item.id === activeTab;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                      : 'border-transparent text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/25 text-cyan-300'
                          : isCurrentTab
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm truncate text-slate-100">
                          {item.title}
                        </span>

                        {isCurrentTab && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Active Tab
                          </span>
                        )}

                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Meta / Category */}
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                      {item.category}
                    </span>

                    {isSelected && (
                      <span className="hidden sm:flex items-center text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        <CornerDownLeft className="w-3 h-3 mr-1" />
                        Jump
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400">Shortcut:</span>
            <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
              ⌘K / Ctrl+K
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
