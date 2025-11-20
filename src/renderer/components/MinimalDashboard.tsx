import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';
import { Play, CheckCircle2, Clock, TrendingUp, AlertCircle, User } from 'lucide-react';

const MinimalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { discordStatus, isExecuting, stats } = useAppStore();
  const [discordUser, setDiscordUser] = useState<{
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
  } | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    totalCompleted: 0,
    totalTimeSaved: 0,
    successRate: 0,
  });

  useEffect(() => {
    const loadUserInfo = async () => {
      if (discordStatus.isRunning) {
        try {
          const result = await window.electronAPI.getDiscordUser();
          if (result.success && result.user) {
            setDiscordUser({
              displayName: result.user.displayName || result.user.username || t('common.user'),
              avatarUrl: result.user.avatarUrl,
              bannerUrl: result.user.bannerUrl || null,
            });
            setAvatarError(false);
          }
        } catch (error) {
          console.error('Failed to load Discord user info:', error);
        }
      } else {
        setDiscordUser(null);
        setAvatarError(false);
      }
    };

    loadUserInfo();
    const interval = setInterval(loadUserInfo, 10000);
    return () => clearInterval(interval);
  }, [discordStatus.isRunning, t]);

  useEffect(() => {
    const duration = 1500;
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
    if (discordStatus.isRunning && !isExecuting) {
      executeQuestAutomation();
    }
  };

  const statCards = [
    {
      icon: CheckCircle2,
      label: t('stats.totalCompleted'),
      value: animatedStats.totalCompleted,
      suffix: ` ${t('stats.quests')}`,
    },
    {
      icon: Clock,
      label: t('stats.timeSaved'),
      value: Math.floor(animatedStats.totalTimeSaved / 60),
      suffix: ` ${t('stats.minutes')}`,
    },
    {
      icon: TrendingUp,
      label: t('stats.successRate'),
      value: animatedStats.successRate,
      suffix: '%',
    },
  ];

    
  return (
    <div className="view-container">
      <div className="mb-8">
        <h1 className="neon-title">{t('dashboard.title')}</h1>
        <p className="neon-subtitle mt-2">
          {t('dashboard.description')}
        </p>
      </div>

      {/* User Profile Card */}
      {discordUser && (
        <div className="neon-card mb-8 animate-float">
          <div className="relative overflow-hidden rounded-xl">
            {discordUser.bannerUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(9,9,11,0.9), rgba(9,9,11,0.4)), url(${discordUser.bannerUrl})`,
                }}
              />
            )}
            <div className="relative flex items-center gap-4 p-6">
              <div className="relative">
                {discordUser.avatarUrl && !avatarError ? (
                  <img
                    src={discordUser.avatarUrl}
                    alt={discordUser.displayName}
                    onError={() => setAvatarError(true)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                    <User size={32} className="text-cyan-400" />
                  </div>
                )}
                <div
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#09090b] ${
                    discordStatus.isRunning ? 'bg-[#0aff60] shadow-[0_0_10px_#0aff60]' : 'bg-[#ff0055] shadow-[0_0_10px_#ff0055]'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-white">
                  {discordUser.displayName}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {discordStatus.isRunning
                    ? t('dashboard.discordOnline')
                    : t('dashboard.discordOffline')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="neon-card hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-white flex items-baseline gap-1">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-sm text-gray-500 font-normal">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/5">
                  <Icon size={24} className="text-cyan-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discord Status */}
      <div className="neon-card mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${discordStatus.isRunning ? 'bg-[#0aff60] shadow-[0_0_10px_#0aff60]' : 'bg-gray-600'}`} />
          <div>
            <p className="font-medium text-white">
              {t('dashboard.discordStatus')}
            </p>
            <p className="text-xs text-gray-400">
              {discordStatus.isRunning
                ? t('dashboard.discordOnline')
                : t('dashboard.discordOffline')}
            </p>
          </div>
        </div>
        {discordStatus.isRunning && discordStatus.process && (
          <div className="text-right">
            <p className="text-xs text-gray-500 font-mono">
              PID: {discordStatus.process.pid}
            </p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="neon-card border-l-4 border-l-[#fcee0a] mb-8 bg-yellow-900/10">
        <div className="flex gap-3">
          <AlertCircle
            size={20}
            className="text-[#fcee0a] flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="font-medium text-white mb-1">
              {t('dashboard.disclaimer')}
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('dashboard.disclaimerText')}
            </p>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <div className="flex justify-center py-4">
        <button
          onClick={handleExecute}
          disabled={isExecuting || !discordStatus.isRunning}
          className={`neon-button neon-button-primary text-lg px-8 py-4 flex items-center gap-3 ${
            isExecuting || !discordStatus.isRunning ? 'opacity-50 cursor-not-allowed grayscale' : 'animate-pulse-glow'
          }`}
        >
          {isExecuting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={24} fill="currentColor" />
          )}
          <span>{isExecuting ? t('dashboard.executing') : t('dashboard.executeButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default MinimalDashboard;
