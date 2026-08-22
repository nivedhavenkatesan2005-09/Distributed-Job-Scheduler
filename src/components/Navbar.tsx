import React, { useState } from 'react';
import {
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
  Play,
  UserCheck,
  Radio,
  FileCode2,
  BellRing,
  Timer,
  Webhook,
  GanttChartSquare,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
  LogOut,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Project, Role, User, ThemeMode } from '../types';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  currentUser: User | null;
  setCurrentUserRole: (role: Role) => void;
  onSpawnTraffic: (burstFailures?: boolean) => void;
  isSseConnected: boolean;
  dlqCount: number;
  activeAlertCount?: number;
  onOpenAlertSettings?: () => void;
  onOpenCommandPalette?: () => void;
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onLogout?: () => void;
}

export type NavCategory = 'all' | 'operations' | 'automation' | 'observability' | 'docs';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  currentUser,
  setCurrentUserRole,
  onSpawnTraffic,
  isSseConnected,
  dlqCount,
  activeAlertCount = 0,
  onOpenAlertSettings,
  onOpenCommandPalette,
  currentTheme = 'light',
  onSelectTheme = () => {},
  onLogout
}) => {
  const [selectedCategory, setSelectedCategory] = useState<NavCategory>('all');
  const [isTrafficDropdownOpen, setIsTrafficDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const categories = [
    { id: 'all' as NavCategory, label: 'All Modules' },
    { id: 'operations' as NavCategory, label: 'Core Ops' },
    { id: 'automation' as NavCategory, label: 'Automation' },
    { id: 'observability' as NavCategory, label: 'Observability' },
    { id: 'docs' as NavCategory, label: 'Specs & Docs' }
  ];

  const allTabs = [
    // Operations
    { id: 'dashboard', label: 'Dashboard', icon: Activity, category: 'operations' as NavCategory, primary: true },
    { id: 'queues', label: 'Queues & Rate Limits', icon: Layers, category: 'operations' as NavCategory, primary: true },
    { id: 'jobs', label: 'Job Explorer', icon: Zap, category: 'operations' as NavCategory, primary: true },
    { id: 'dlq', label: 'Dead Letter Queue', icon: AlertOctagon, category: 'operations' as NavCategory, badge: dlqCount, primary: true },
    
    // Distributed Engines
    { id: 'locks', label: 'Distributed Locks', icon: ShieldCheck, category: 'operations' as NavCategory, primary: true },
    { id: 'shards', label: 'Queue Sharding', icon: Database, category: 'operations' as NavCategory, primary: true },

    // Automation & Events
    { id: 'events', label: 'Event-Driven Bus', icon: Radio, category: 'automation' as NavCategory, primary: true },
    { id: 'schedules', label: 'Cron Schedules', icon: Timer, category: 'automation' as NavCategory, primary: true },
    { id: 'workflows', label: 'Workflows (DAG)', icon: GitMerge, category: 'automation' as NavCategory, primary: true },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, category: 'automation' as NavCategory, primary: false },

    // Observability
    { id: 'timeline', label: 'Execution Gantt', icon: GanttChartSquare, category: 'observability' as NavCategory, primary: true },
    { id: 'workers', label: 'Worker Fleet', icon: Server, category: 'observability' as NavCategory, primary: true },
    { id: 'logs', label: 'Live Logs', icon: Terminal, category: 'observability' as NavCategory, primary: false },

    // Docs & Architecture
    { id: 'schema', label: 'ER Schema', icon: Database, category: 'docs' as NavCategory, primary: false },
    { id: 'architecture', label: 'Architecture', icon: Radio, category: 'docs' as NavCategory, primary: false },
    { id: 'api-docs', label: 'API Specs', icon: FileCode2, category: 'docs' as NavCategory, primary: false },
    { id: 'design-decisions', label: 'Whitepaper', icon: BookOpen, category: 'docs' as NavCategory, primary: false },
    { id: 'tests', label: 'Test Suite', icon: CheckCircle2, category: 'docs' as NavCategory, primary: false }
  ];

  const visibleTabs = selectedCategory === 'all' 
    ? allTabs 
    : allTabs.filter(t => t.category === selectedCategory);

  const getThemeAccentClasses = () => {
    switch (currentTheme) {
      case 'cyber':
        return {
          logo: 'from-cyan-600 via-blue-500 to-cyan-400 shadow-cyan-500/20 ring-cyan-400/30',
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          activeTab: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
          activeTabIcon: 'text-cyan-400',
          primaryBtn: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-900/20',
          primaryBtnSplit: 'bg-blue-700 hover:bg-blue-600 border-cyan-600/50',
          filterActive: 'bg-stone-800 text-cyan-300 border-stone-700'
        };
      case 'violet':
        return {
          logo: 'from-purple-600 via-violet-500 to-fuchsia-400 shadow-purple-500/20 ring-purple-400/30',
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          activeTab: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          activeTabIcon: 'text-purple-400',
          primaryBtn: 'from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white shadow-purple-900/20',
          primaryBtnSplit: 'bg-violet-700 hover:bg-violet-600 border-purple-600/50',
          filterActive: 'bg-stone-800 text-purple-300 border-stone-700'
        };
      case 'emerald':
        return {
          logo: 'from-emerald-600 via-teal-500 to-green-400 shadow-emerald-500/20 ring-emerald-400/30',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          activeTab: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          activeTabIcon: 'text-emerald-400',
          primaryBtn: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-900/20',
          primaryBtnSplit: 'bg-teal-700 hover:bg-teal-600 border-emerald-600/50',
          filterActive: 'bg-stone-800 text-emerald-300 border-stone-700'
        };
      case 'crimson':
        return {
          logo: 'from-rose-600 via-red-500 to-amber-500 shadow-rose-500/20 ring-rose-400/30',
          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          activeTab: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          activeTabIcon: 'text-rose-400',
          primaryBtn: 'from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-900/20',
          primaryBtnSplit: 'bg-red-700 hover:bg-red-600 border-rose-600/50',
          filterActive: 'bg-stone-800 text-rose-300 border-stone-700'
        };
      case 'warm':
        return {
          logo: 'from-amber-600 via-orange-500 to-amber-400 shadow-amber-500/20 ring-amber-400/30',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          activeTab: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          activeTabIcon: 'text-amber-400',
          primaryBtn: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-amber-900/20',
          primaryBtnSplit: 'bg-orange-600 hover:bg-orange-500 border-amber-600/50',
          filterActive: 'bg-stone-800 text-amber-300 border-stone-700'
        };
      case 'light':
      default:
        return {
          logo: 'from-blue-600 via-indigo-500 to-blue-400 shadow-blue-500/20 ring-blue-400/30',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          activeTab: 'bg-blue-50 text-blue-700 border-blue-300',
          activeTabIcon: 'text-blue-600',
          primaryBtn: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20',
          primaryBtnSplit: 'bg-indigo-700 hover:bg-indigo-600 border-blue-600/50',
          filterActive: 'bg-slate-200 text-blue-700 border-slate-300'
        };
    }
  };

  const themeStyles = getThemeAccentClasses();

  return (
    <header className="bg-[#141210]/95 backdrop-blur border-b border-stone-800/90 text-stone-100 sticky top-0 z-40 shadow-md">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${themeStyles.logo} flex items-center justify-center shadow-md`}>
              <Layers className="w-4.5 h-4.5 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-stone-100">
                  HyperPlane
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${themeStyles.badge}`}>
                  Distributed Scheduler v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls Bar */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Command & Tab Switcher (Cmd+K / Ctrl+K) */}
            {onOpenCommandPalette && (
              <button
                id="btn-quick-command-palette"
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700 transition-all text-xs cursor-pointer shadow-sm group"
                title="Quick Tab Switcher & Command Palette (Ctrl+K or ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-stone-400 group-hover:text-stone-200 font-medium text-[11px]">Quick Switch</span>
                <kbd className="flex items-center space-x-0.5 px-1 py-0.2 rounded bg-stone-950/90 border border-stone-700 text-[10px] font-mono text-cyan-300">
                  <span>⌘K</span>
                </kbd>
              </button>
            )}

            {/* Live SSE Status */}
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-stone-900/80 border border-stone-800 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${isSseConnected ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30' : 'bg-amber-400'}`} />
              <span className="text-stone-300 font-mono text-[11px]">
                {isSseConnected ? 'SSE Live' : 'Polling'}
              </span>
            </div>

            {/* Alert Thresholds Bell */}
            {onOpenAlertSettings && (
              <button
                id="btn-navbar-alert-bell"
                onClick={onOpenAlertSettings}
                className={`relative p-1.5 rounded-md border transition-colors cursor-pointer ${
                  activeAlertCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                    : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 border-stone-800 hover:bg-stone-800'
                }`}
                title={`Configure KPI Alert Thresholds (${activeAlertCount} active alerts)`}
              >
                <BellRing className="w-4 h-4" />
                {activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* Unified Traffic Simulator Split Button */}
            <div className="relative">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  id="btn-spawn-traffic"
                  onClick={() => onSpawnTraffic(false)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r ${themeStyles.primaryBtn} rounded-l-md transition-all shadow-sm`}
                  title="Enqueue 10 normal test jobs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Simulate Traffic</span>
                </button>
                <button
                  id="btn-traffic-dropdown-toggle"
                  onClick={() => setIsTrafficDropdownOpen(!isTrafficDropdownOpen)}
                  className={`px-1.5 py-1.5 text-xs ${themeStyles.primaryBtnSplit} text-white rounded-r-md border-l transition-colors cursor-pointer`}
                  title="Traffic simulation options"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {isTrafficDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-52 bg-stone-900 border border-stone-750 rounded-lg shadow-2xl z-50 py-1 ring-1 ring-stone-800"
                  onMouseLeave={() => setIsTrafficDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      onSpawnTraffic(false);
                      setIsTrafficDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:bg-stone-800 flex items-center space-x-2"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <div>
                      <div className="font-medium text-stone-100">Normal Traffic</div>
                      <div className="text-[10px] text-stone-400">10 balanced priority tasks</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSpawnTraffic(true);
                      setIsTrafficDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 flex items-center space-x-2 border-t border-stone-800"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    <div>
                      <div className="font-medium">Traffic + Downstream Failures</div>
                      <div className="text-[10px] text-rose-400/80">Triggers retries, backoff & DLQ</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Project Selector */}
            <div className="flex items-center space-x-1 bg-stone-900/80 border border-stone-800 px-2 py-1 rounded-md">
              <span className="text-[11px] text-stone-400">Project:</span>
              <select
                id="select-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-stone-200 font-medium focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-stone-900 text-stone-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center space-x-1 bg-stone-900/80 border border-stone-800 px-2 py-1 rounded-md">
              <UserCheck className="w-3.5 h-3.5 text-stone-400" />
              <select
                id="select-role"
                value={currentUser?.role || 'admin'}
                onChange={(e) => setCurrentUserRole(e.target.value as Role)}
                className="bg-transparent text-[11px] font-semibold uppercase text-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="admin" className="bg-stone-900 text-stone-200">ADMIN</option>
                <option value="operator" className="bg-stone-900 text-stone-200">OPERATOR</option>
                <option value="developer" className="bg-stone-900 text-stone-200">DEVELOPER</option>
                <option value="viewer" className="bg-stone-900 text-stone-200">VIEWER</option>
              </select>
            </div>

            {/* User Account & Logout */}
            <div className="flex items-center space-x-2 pl-1 border-l border-stone-800">
              <div className="hidden lg:flex items-center space-x-2 bg-stone-900/80 border border-stone-800 px-2 py-1 rounded-md">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  {currentUser?.name?.charAt(0) || 'A'}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-medium text-stone-200 leading-tight truncate max-w-[100px]">
                    {currentUser?.name || 'Alex Rivera'}
                  </div>
                  <div className="text-[9px] text-stone-400 font-mono leading-none">
                    {currentUser?.email || 'alex@hyperplane.io'}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Logout / Switch Account"
                  className="flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>

            {/* Theme Selector */}
            <ThemeSelector
              currentTheme={currentTheme}
              onSelectTheme={onSelectTheme}
            />

          </div>
        </div>
      </div>

      {/* Navigation & Category Bar */}
      <div className="border-t border-stone-800/80 bg-[#0c0a09]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5">
          
          {/* Scrollable Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? `${themeStyles.activeTab} shadow-sm font-semibold`
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? themeStyles.activeTabIcon : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Category Filter Pills */}
          <div className="hidden md:flex items-center space-x-1 pl-3 border-l border-stone-800 shrink-0">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mr-1 flex items-center space-x-1">
              <Filter className="w-2.5 h-2.5 text-stone-500" />
              <span>Filter:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? `${themeStyles.filterActive} font-medium`
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </header>
  );
};

