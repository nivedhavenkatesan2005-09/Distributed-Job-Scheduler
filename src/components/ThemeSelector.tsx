import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Flame,
  TreePine,
  Check,
  ChevronDown,
  Zap,
  Radio,
  Palette
} from 'lucide-react';
import { ThemeMode, ThemeConfig } from '../types';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'cyber',
    name: 'Cyber Cyan',
    description: 'Electric cyan & cobalt on deep obsidian',
    accent: '#06b6d4',
    bgPreview: 'bg-cyan-950',
    borderPreview: 'border-cyan-500/40',
    isDark: true
  },
  {
    id: 'violet',
    name: 'Eclipse Violet',
    description: 'Neon purple & royal violet on midnight velvet',
    accent: '#a855f7',
    bgPreview: 'bg-purple-950',
    borderPreview: 'border-purple-500/40',
    isDark: true
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    description: 'Cyber matrix mint & neon green on carbon',
    accent: '#10b981',
    bgPreview: 'bg-emerald-950',
    borderPreview: 'border-emerald-500/40',
    isDark: true
  },
  {
    id: 'crimson',
    name: 'Crimson Titan',
    description: 'Blood ruby & fiery coral on dark titanium',
    accent: '#f43f5e',
    bgPreview: 'bg-rose-950',
    borderPreview: 'border-rose-500/40',
    isDark: true
  },
  {
    id: 'warm',
    name: 'Warm Obsidian',
    description: 'Espresso stone foundation with golden amber',
    accent: '#f59e0b',
    bgPreview: 'bg-stone-900',
    borderPreview: 'border-amber-500/40',
    isDark: true
  },
  {
    id: 'light',
    name: 'Daylight Studio',
    description: 'Crisp high-contrast enterprise light console',
    accent: '#3b82f6',
    bgPreview: 'bg-slate-100',
    borderPreview: 'border-slate-300',
    isDark: false
  }
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = THEME_PRESETS.find(t => t.id === currentTheme) || THEME_PRESETS[0];

  const getThemeIcon = (id: ThemeMode) => {
    switch (id) {
      case 'cyber':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'violet':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'crimson':
        return <Radio className="w-3.5 h-3.5 text-rose-400" />;
      case 'emerald':
        return <TreePine className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warm':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  // Quick 1-click cycle between dark themes and light
  const handleQuickToggle = () => {
    const order: ThemeMode[] = ['cyber', 'violet', 'emerald', 'crimson', 'warm', 'light'];
    const currentIndex = order.indexOf(currentTheme);
    const nextTheme = order[(currentIndex + 1) % order.length];
    onSelectTheme(nextTheme);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center space-x-0.5 bg-stone-900/80 border border-stone-800 rounded-md p-0.5 shadow-sm">
        {/* Quick Icon Button */}
        <button
          id="btn-theme-quick-toggle"
          onClick={handleQuickToggle}
          className="p-1 rounded text-stone-300 hover:text-white hover:bg-stone-800/80 transition-colors cursor-pointer"
          title={`Active: ${currentConfig.name} (Click to cycle theme colors)`}
        >
          {getThemeIcon(currentTheme)}
        </button>

        {/* Theme Picker Dropdown Trigger */}
        <button
          id="btn-theme-dropdown-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-2 py-0.5 text-xs text-stone-200 hover:text-white rounded hover:bg-stone-800/80 transition-colors cursor-pointer"
          title="Choose Color Palette"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentConfig.accent }} />
          <span className="text-[11px] font-medium hidden sm:inline">{currentConfig.name}</span>
          <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Theme Presets Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-68 bg-stone-900/95 backdrop-blur-md border border-stone-750 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 ring-1 ring-stone-800 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between border-b border-stone-800">
            <span className="flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Color Themes</span>
            </span>
            <span className="font-mono text-[9px] text-stone-400 font-bold">5 DARK • 1 LIGHT</span>
          </div>

          <div className="space-y-1 pt-1 max-h-[320px] overflow-y-auto">
            {THEME_PRESETS.map((preset) => {
              const isSelected = preset.id === currentTheme;
              return (
                <button
                  key={preset.id}
                  id={`theme-option-${preset.id}`}
                  onClick={() => {
                    onSelectTheme(preset.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-800/90 border border-stone-650 text-white shadow-sm'
                      : 'hover:bg-stone-800/60 text-stone-300 hover:text-stone-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {/* Visual Color Preview Chip */}
                    <div
                      className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0 shadow-inner"
                      style={{
                        backgroundColor: preset.isDark ? '#0c0e14' : '#f8fafc',
                        borderColor: preset.accent
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                    </div>

                    <div>
                      <div className="text-xs font-semibold flex items-center space-x-1.5">
                        <span className={isSelected ? 'text-white font-bold' : ''}>{preset.name}</span>
                        {preset.isDark ? (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-stone-800 text-stone-300 font-mono">DARK</span>
                        ) : (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">LIGHT</span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 leading-tight truncate max-w-[160px]">
                        {preset.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0 ml-1" style={{ color: preset.accent }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
