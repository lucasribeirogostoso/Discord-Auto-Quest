import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';
import { 
  Terminal, AlertCircle, Trash2, Download, Filter, 
  TrendingUp, Clock, CheckCircle2, 
  Activity, Zap, Rocket
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { discordStatus, isExecuting, logs, settings, stats } = useAppStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'error' | 'warning'>('all');
  const [showLogFilters, setShowLogFilters] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    totalCompleted: 0,
    totalTimeSaved: 0,
    successRate: 0,
  });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        totalCompleted: Math.floor(stats.totalCompleted * easeOut),
        totalTimeSaved: Math.floor(stats.totalTimeSaved * easeOut),
        successRate: Math.floor(stats.successRate * easeOut),
      });

      if (step >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          totalCompleted: stats.totalCompleted,
          totalTimeSaved: stats.totalTimeSaved,
          successRate: stats.successRate,
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  const handleExecute = () => {
    executeQuestAutomation();
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs;
    return logs.filter(log => log.level === logFilter);
  }, [logs, logFilter]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-cyan-500';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-500/10 border-green-500/50';
      case 'error':
        return 'bg-red-500/10 border-red-500/50';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50';
      default:
        return 'bg-cyan-500/10 border-cyan-500/50';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handleClearLogs = () => {
    useAppStore.getState().clearLogs();
  };

  const handleExportLogs = () => {
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

  const quickStats = [
    {
      icon: CheckCircle2,
      label: t('stats.totalCompleted'),
      value: animatedStats.totalCompleted,
      suffix: ` ${t('stats.quests')}`,
      color: '#39FF14',
      delay: 0,
    },
    {
      icon: Clock,
      label: t('stats.timeSaved'),
      value: Math.floor(animatedStats.totalTimeSaved / 60),
      suffix: ` ${t('stats.minutes')}`,
      color: '#00F5FF',
      delay: 100,
    },
    {
      icon: TrendingUp,
      label: t('stats.successRate'),
      value: animatedStats.successRate,
      suffix: '%',
      color: '#B026FF',
      delay: 200,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2 flex items-center space-x-3">
            <div className="relative">
              <Zap size={40} className="text-cyan-500 animate-neon-pulse" />
              <div className="absolute inset-0 text-cyan-500 blur-xl opacity-50 animate-neon-pulse" />
            </div>
            <span className="gradient-neon">{t('dashboard.title')}</span>
          </h2>
          <p className="text-sm text-text-secondary">
            {t('dashboard.quickStats')}
          </p>
        </div>
      </div>

      {/* Stats Grid - Neon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="floating-card animate-float-3d"
            style={{ animationDelay: `${stat.delay}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                  border: `1px solid ${stat.color}40`,
                  boxShadow: `0 0 20px ${stat.color}30`
                }}
              >
                <stat.icon
                  size={32}
                  style={{ color: stat.color }}
                />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-text-primary">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-lg text-text-secondary ml-1">
                      {stat.suffix}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Discord Status - Hologram Card */}
      <div className="hologram-card p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`status-indicator ${discordStatus.isRunning ? 'online' : 'offline'}`} />
              <h3 className="text-xl font-bold text-text-primary">
                {t('dashboard.discordStatus')}
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span
                  className={`font-semibold text-lg ${
                    discordStatus.isRunning
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                  style={discordStatus.isRunning ? {
                    textShadow: '0 0 10px #39FF14'
                  } : {}}
                >
                  {discordStatus.isRunning
                    ? t('dashboard.discordOnline')
                    : t('dashboard.discordOffline')}
                </span>
                {discordStatus.isRunning && (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: 'rgba(57, 255, 20, 0.1)',
                      borderColor: '#39FF14',
                      color: '#39FF14',
                      boxShadow: '0 0 10px rgba(57, 255, 20, 0.3)'
                    }}
                  >
                    <Activity size={12} className="inline mr-1" />
                    {t('common.online')}
                  </span>
                )}
              </div>
              {discordStatus.process && (
                <div className="p-3 rounded-lg border border-neon bg-bg-deep">
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div>
                      <span className="text-text-secondary">PID:</span>
                      <span className="ml-2 text-text-primary">
                        {discordStatus.process.pid}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">{t('common.path')}:</span>
                      <p className="text-text-primary text-xs truncate">
                        {discordStatus.process.path}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {!settings.firstRun && (
        <div className="hologram-card p-5 rounded-xl border-l-4" style={{ borderLeftColor: '#FFD60A' }}>
          <div className="flex items-start space-x-4">
            <AlertCircle className="text-yellow-500 mt-1 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="text-base font-bold text-yellow-500 mb-2">
                {t('dashboard.disclaimer')}
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('dashboard.disclaimerText')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execute Button - Neon */}
      <div className="flex justify-center">
        <button
          onClick={handleExecute}
          disabled={isExecuting || !discordStatus.isRunning}
          className={`neon-button relative overflow-hidden ${
            isExecuting || !discordStatus.isRunning
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          style={{
            borderColor: discordStatus.isRunning ? '#00F5FF' : '#606070',
            color: discordStatus.isRunning ? '#00F5FF' : '#606070',
          }}
        >
          {isExecuting ? (
            <>
              <div className="spinner-neon inline-block mr-3" style={{ width: 20, height: 20, borderWidth: 2 }} />
              <span>{t('dashboard.executing')}</span>
            </>
          ) : (
            <>
              <Rocket size={20} className="inline mr-2" />
              <span>{t('dashboard.executeButton')}</span>
            </>
          )}
          {!discordStatus.isRunning && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {t('common.offline')}
            </span>
          )}
        </button>
      </div>

      {/* Console Logs - Neon */}
      <div className="hologram-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neon">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal size={20} className="text-cyan-500" />
              <h3 className="text-lg font-bold text-text-primary">
                {t('dashboard.console')}
              </h3>
              <span className="px-2 py-1 bg-bg-deep text-text-secondary rounded text-xs font-medium border border-neon">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowLogFilters(!showLogFilters)}
                  className="flex items-center space-x-2 px-3 py-2 bg-bg-deep hover:bg-bg-surface text-text-secondary rounded-lg transition-colors text-sm border border-neon"
                >
                  <Filter size={16} />
                  <span>{t(`dashboard.${logFilter}Logs`)}</span>
                </button>
                {showLogFilters && (
                  <div className="absolute right-0 mt-2 w-40 hologram-card rounded-lg shadow-xl border border-neon z-10">
                    {(['all', 'info', 'success', 'error', 'warning'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setLogFilter(level);
                          setShowLogFilters(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-surface transition-colors ${
                          logFilter === level
                            ? 'text-cyan-500'
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
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                className="flex items-center space-x-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-bg-deep disabled:cursor-not-allowed text-cyan-500 rounded-lg transition-colors text-sm border border-cyan-500/50"
                title={t('dashboard.exportLogs')}
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-bg-deep disabled:cursor-not-allowed text-red-500 rounded-lg transition-colors text-sm border border-red-500/50"
                title={t('dashboard.clearLogs')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-bg-deep h-96 overflow-y-auto font-mono text-sm border-t border-neon">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
              <Terminal size={48} className="mb-4 opacity-50" />
              <p>{t('dashboard.noLogs')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getLevelBgColor(log.level)} transition-all hover:shadow-lg`}
                >
                  <span className="text-text-tertiary text-xs font-medium min-w-[80px]">
                    [{formatTime(log.timestamp)}]
                  </span>
                  <span className={`${getLevelColor(log.level)} font-bold text-xs min-w-[60px]`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-text-primary flex-1 break-words">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
