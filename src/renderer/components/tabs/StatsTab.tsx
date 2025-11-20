import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Trophy, Clock, TrendingUp, Award, Calendar, PieChart } from 'lucide-react';

const StatsTab: React.FC = () => {
  const { t } = useTranslation();
  const { stats, history } = useAppStore();
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

  const statCards = [
    {
      icon: Trophy,
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
    {
      icon: Award,
      label: t('stats.lastCompleted'),
      value: stats.lastQuestCompleted || t('stats.none'),
      suffix: '',
      isText: true,
    },
  ];

  return (
    <div className="space-y-6 neo-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('stats.title')}
        </h2>
        <p className="text-sm text-text-secondary">
          {t('stats.description')}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="neo-card p-6">
            <div className="p-3 rounded-lg bg-accent/10 inline-block mb-4">
              <card.icon size={24} className="text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-text-secondary mb-2">
              {card.label}
            </h3>
            <p className="text-2xl font-bold text-text-primary">
              {card.isText ? (
                <span className="text-lg break-words">{card.value}</span>
              ) : (
                <>
                  {card.value}
                  <span className="text-lg text-text-secondary ml-1">
                    {card.suffix}
                  </span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly Progress */}
      <div className="neo-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
            <Calendar className="text-accent" size={20} />
            <span>{t('stats.weeklyProgress')}</span>
          </h3>
          <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
            {weeklyStats.completed}/{weeklyStats.total}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary font-medium">{t('stats.thisWeek')}</span>
              <span className="text-text-primary font-bold">
                {weeklyStats.completed} {t('stats.completed')}
              </span>
            </div>
            <div className="w-full bg-surface rounded-full h-4 overflow-hidden">
              <div
                className="bg-accent h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
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
        </div>
      </div>

      {/* Task Type Distribution */}
      <div className="neo-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
            <PieChart className="text-accent" size={20} />
            <span>{t('stats.typeDistribution')}</span>
          </h3>
        </div>
        <div className="space-y-4">
          {Object.entries(taskTypeDistribution).length > 0 ? (
            Object.entries(taskTypeDistribution).map(([type, count]) => {
              const total = Object.values(taskTypeDistribution).reduce((a, b) => a + b, 0);
              const percentage = (count / total) * 100;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-primary font-medium">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-primary font-bold">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-accent h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-text-tertiary">
              <PieChart size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('stats.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsTab;

