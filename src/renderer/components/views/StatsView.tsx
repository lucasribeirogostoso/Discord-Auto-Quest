import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Trophy, Clock, TrendingUp, Award, PieChart, X } from 'lucide-react';

const StatsView: React.FC = () => {
  const { t } = useTranslation();
  const { stats, history, setCurrentView } = useAppStore();
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
    <div className="view-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="neon-title">{t('stats.title')}</h1>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="neon-card hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-white flex items-baseline gap-1">
                    {card.isText ? (
                      <span className="text-lg break-words">{card.value}</span>
                    ) : (
                      <>
                        {card.value}
                        {card.suffix && (
                          <span className="text-sm text-gray-500 font-normal">
                            {card.suffix}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-white/5">
                  <Icon size={20} className="text-cyan-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="neon-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <Clock size={20} className="text-[#00f0ff]" />
              {t('stats.weeklyProgress')}
            </h3>
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-gray-300 border border-white/10">
              {weeklyStats.completed}/{weeklyStats.total}
            </span>
          </div>
          <div className="bg-black/30 rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#00f0ff] to-[#0066ff] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              style={{
                width: `${Math.min((weeklyStats.completed / Math.max(weeklyStats.total, 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {Math.round((weeklyStats.completed / Math.max(weeklyStats.total, 1)) * 100)}% Completed
          </p>
        </div>

        {/* Type Distribution */}
        <div className="neon-card">
          <h3 className="font-semibold text-white text-lg mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-[#ff0055]" />
            {t('stats.typeDistribution')}
          </h3>
          <div className="space-y-4">
            {Object.entries(taskTypeDistribution).length > 0 ? (
              Object.entries(taskTypeDistribution).map(([type, count]) => {
                const total = Object.values(taskTypeDistribution).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{type.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-white">
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="bg-black/30 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff0055] to-[#ff5500] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,0,85,0.3)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart size={48} className="mx-auto mb-4 opacity-20" />
                <p>{t('stats.noData')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;

