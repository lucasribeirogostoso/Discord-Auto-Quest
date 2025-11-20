import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Terminal, X, Trash2, Download, Filter, ChevronLeft } from 'lucide-react';

const LogsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { logs, clearLogs } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'error' | 'warning'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs;
    return logs.filter(log => log.level === logFilter);
  }, [logs, logFilter]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handleExport = () => {
    const logText = logs.map(log => 
      `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord-auto-quest-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (collapsed) {
    return (
      <div className="w-8 bg-surface border-l border-border-color flex items-center justify-center">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-bg-surface rounded transition-colors"
        >
          <ChevronLeft size={16} className="text-text-secondary" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-surface border-l border-border-color flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border-color flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">Console</span>
          <span className="text-xs text-text-secondary">({filteredLogs.length})</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-bg-surface rounded transition-colors"
        >
          <X size={14} className="text-text-secondary" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-2 border-b border-border-color flex items-center space-x-2">
        <div className="relative flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-2 py-1 text-xs hover:bg-bg-surface rounded transition-colors text-text-secondary"
          >
            <Filter size={12} />
            <span>{t(`dashboard.${logFilter}Logs`)}</span>
          </button>
          {showFilters && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-border-color rounded shadow-lg z-10 min-w-[120px]">
              {(['all', 'info', 'success', 'error', 'warning'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setLogFilter(level);
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-surface transition-colors ${
                    logFilter === level
                      ? 'text-accent bg-accent/10'
                      : 'text-text-secondary'
                  }`}
                >
                  {t(`dashboard.${level}Logs`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-bg-surface rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('dashboard.exportLogs')}
        >
          <Download size={14} className="text-text-secondary" />
        </button>
        <button
          onClick={clearLogs}
          disabled={logs.length === 0}
          className="p-1.5 hover:bg-bg-surface rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('dashboard.clearLogs')}
        >
          <Trash2 size={14} className="text-text-secondary" />
        </button>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto neo-scrollbar p-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <Terminal size={32} className="mb-2 opacity-50" />
            <p className="text-xs">{t('dashboard.noLogs')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="p-2 rounded hover:bg-bg-surface transition-colors"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-text-tertiary min-w-[60px]">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`font-semibold min-w-[50px] ${getLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-text-primary flex-1 break-words">
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;

