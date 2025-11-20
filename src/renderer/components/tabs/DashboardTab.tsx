import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../../stores/appStore';
import { 
  CheckCircle2, Clock, TrendingUp, Rocket, AlertCircle
} from 'lucide-react';

const DashboardTab: React.FC = () => {
  const { t } = useTranslation();
  const { stats, settings, discordStatus, isExecuting } = useAppStore();
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

  const statCards = [
    {
      icon: CheckCircle2,
      label: t('stats.totalCompleted'),
      value: animatedStats.totalCompleted,
      suffix: ` ${t('stats.quests')}`,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Clock,
      label: t('stats.timeSaved'),
      value: Math.floor(animatedStats.totalTimeSaved / 60),
      suffix: ` ${t('stats.minutes')}`,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: TrendingUp,
      label: t('stats.successRate'),
      value: animatedStats.successRate,
      suffix: '%',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6 neo-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('dashboard.title')}
        </h2>
        <p className="text-sm text-text-secondary">
          {t('dashboard.quickStats')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="neo-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">
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

      {/* Execute Button */}
      <div className="flex justify-center">
        <button
          onClick={() => executeQuestAutomation()}
          disabled={isExecuting || !discordStatus.isRunning}
          className={`neo-button primary text-lg px-8 py-4 flex items-center space-x-3 ${
            isExecuting || !discordStatus.isRunning
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          <Rocket size={20} />
          <span>
            {isExecuting ? t('dashboard.executing') : t('dashboard.executeButton')}
          </span>
        </button>
      </div>

      {/* Disclaimer */}
      {!settings.firstRun && (
        <div className="neo-card p-5 border-l-4" style={{ borderLeftColor: '#DCDCAA' }}>
          <div className="flex items-start space-x-4">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="text-base font-bold text-text-primary mb-2">
                {t('dashboard.disclaimer')}
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('dashboard.disclaimerText')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;

