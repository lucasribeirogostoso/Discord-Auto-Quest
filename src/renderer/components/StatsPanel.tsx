import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Trophy, Clock, TrendingUp, Award, Calendar, BarChart3, PieChart, Zap, Target } from 'lucide-react';
import AnimatedCard from './AnimatedCard';

const StatsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { stats, history, settings } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#8B5CF6';
  const [animatedStats, setAnimatedStats] = useState({
    totalCompleted: 0,
    totalTimeSaved: 0,
    successRate: 0,
  });

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

  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekHistory = history.filter(h => h.timestamp >= weekAgo);
    
    return {
      completed: weekHistory.filter(h => h.status === 'success').length,
      total: weekHistory.length,
      timeSaved: weekHistory.reduce((acc, h) => acc + h.duration, 0),
    };
  }, [history]);

  const taskTypeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    history.forEach(h => {
      distribution[h.taskType] = (distribution[h.taskType] || 0) + 1;
    });
    return distribution;
  }, [history]);

  const successFailureRatio = useMemo(() => {
    const success = history.filter(h => h.status === 'success').length;
    const failure = history.filter(h => h.status === 'failure').length;
    const total = history.length || 1;
    return {
      success: (success / total) * 100,
      failure: (failure / total) * 100,
    };
  }, [history]);

  const statCards = [
    {
      icon: Trophy,
      label: t('stats.totalCompleted'),
      value: animatedStats.totalCompleted,
      suffix: ` ${t('stats.quests')}`,
      gradient: 'from-yellow-400 to-orange-500',
      delay: 0,
    },
    {
      icon: Clock,
      label: t('stats.timeSaved'),
      value: Math.floor(animatedStats.totalTimeSaved / 60),
      suffix: ` ${t('stats.minutes')}`,
      gradient: 'from-cyan-400 to-blue-500',
      delay: 100,
    },
    {
      icon: TrendingUp,
      label: t('stats.successRate'),
      value: animatedStats.successRate,
      suffix: '%',
      gradient: 'from-green-400 to-emerald-500',
      delay: 200,
    },
    {
      icon: Award,
      label: t('stats.lastCompleted'),
      value: stats.lastQuestCompleted || t('stats.none'),
      suffix: '',
      gradient: 'from-purple-400 to-pink-500',
      delay: 300,
      isText: true,
    },
  ];

  const taskTypeColors: Record<string, string> = {
    WATCH_VIDEO: 'from-blue-400 to-cyan-500',
    PLAY_ON_DESKTOP: 'from-green-400 to-emerald-500',
    STREAM_ON_DESKTOP: 'from-purple-400 to-pink-500',
    PLAY_ACTIVITY: 'from-orange-400 to-red-500',
    WATCH_VIDEO_ON_MOBILE: 'from-indigo-400 to-purple-500',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className={`text-4xl font-bold flex items-center space-x-3 mb-2 ${isHighContrast ? 'text-hc-primary' : 'text-white'}`}>
          <BarChart3 size={40} style={{ color: isHighContrast ? accentColor : '#8B5CF6' }} className="animate-float" />
          <span className="gradient-text">{t('stats.title')}</span>
        </h2>
        <p className={`text-sm ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
          {t('stats.description')}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <AnimatedCard
            key={index}
            hover3D={true}
            glowOnHover={true}
            className="animate-scale-in"
            style={{ animationDelay: `${card.delay}ms` }}
          >
            <div className="p-6">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${card.gradient} bg-opacity-20 inline-block mb-4`}>
                <card.icon
                  size={32}
                  className={`text-transparent bg-gradient-to-br ${card.gradient} bg-clip-text`}
                />
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                {card.label}
              </h3>
              <p className="text-3xl font-bold text-white">
                {card.isText ? (
                  <span className="text-lg break-words">{card.value}</span>
                ) : (
                  <>
                    {card.value}
                    <span className="text-lg text-gray-400 ml-1">
                      {card.suffix}
                    </span>
                  </>
                )}
              </p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <AnimatedCard hover3D={true}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="text-purple-500" size={20} />
                <span>{t('stats.weeklyProgress')}</span>
              </h3>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/50">
                {weeklyStats.completed}/{weeklyStats.total}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 font-medium">{t('stats.thisWeek')}</span>
                  <span className="text-white font-bold">
                    {weeklyStats.completed} {t('stats.completed')}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.min((weeklyStats.completed / Math.max(weeklyStats.total, 1)) * 100, 100)}%`,
                    }}
                  >
                    {weeklyStats.completed > 0 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round((weeklyStats.completed / Math.max(weeklyStats.total, 1)) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {weeklyStats.completed}
                  </p>
                  <p className="text-xs text-gray-400">{t('stats.completed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {Math.floor(weeklyStats.timeSaved / 60)}
                  </p>
                  <p className="text-xs text-gray-400">{t('stats.minutes')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {weeklyStats.total > 0 ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-400">{t('stats.rate')}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Success Rate Indicator */}
        <AnimatedCard hover3D={true}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Target className="text-purple-500" size={20} />
                <span>{t('stats.successRate')}</span>
              </h3>
            </div>
            <div className="flex items-center justify-center h-48">
              <div className="relative">
                <svg className="transform -rotate-90" width="160" height="160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-800"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#successGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(animatedStats.successRate / 100) * 440} 440`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {animatedStats.successRate}%
                  </span>
                  <span className="text-sm text-gray-400 mt-1">
                    {t('stats.successRate')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Task Type Distribution */}
        <AnimatedCard hover3D={true}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <PieChart className="text-purple-500" size={20} />
                <span>{t('stats.typeDistribution')}</span>
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(taskTypeDistribution).length > 0 ? (
                Object.entries(taskTypeDistribution).map(([type, count]) => {
                  const total = Object.values(taskTypeDistribution).reduce((a, b) => a + b, 0);
                  const percentage = (count / total) * 100;
                  const color = taskTypeColors[type] || 'from-gray-400 to-gray-500';
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">
                          {type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white font-bold">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('stats.noData')}</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Success/Failure Ratio */}
        <AnimatedCard hover3D={true}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Zap className="text-purple-500" size={20} />
                <span>{t('stats.successVsFailure')}</span>
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-medium flex items-center space-x-2">
                    <Trophy size={16} />
                    <span>{t('history.status.success')}</span>
                  </span>
                  <span className="text-white font-bold">
                    {Math.round(successFailureRatio.success)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                    style={{ width: `${successFailureRatio.success}%` }}
                  >
                    {successFailureRatio.success > 10 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round(successFailureRatio.success)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium flex items-center space-x-2">
                    <Target size={16} />
                    <span>{t('history.status.failure')}</span>
                  </span>
                  <span className="text-white font-bold">
                    {Math.round(successFailureRatio.failure)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                    style={{ width: `${successFailureRatio.failure}%` }}
                  >
                    {successFailureRatio.failure > 10 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round(successFailureRatio.failure)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default StatsPanel;
