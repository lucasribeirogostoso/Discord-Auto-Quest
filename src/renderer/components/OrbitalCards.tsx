import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { CheckCircle2, Clock, TrendingUp, Target, BookOpen, History } from 'lucide-react';

const OrbitalCards: React.FC = () => {
  const { t } = useTranslation();
  const { stats, setCurrentView } = useAppStore();

  const cards = [
    {
      id: 'stats',
      icon: CheckCircle2,
      label: t('stats.totalCompleted'),
      value: stats.totalCompleted,
      suffix: ` ${t('stats.quests')}`,
      color: 'text-green-400',
      onClick: () => setCurrentView('stats'),
    },
    {
      id: 'time',
      icon: Clock,
      label: t('stats.timeSaved'),
      value: Math.floor(stats.totalTimeSaved / 60),
      suffix: ` ${t('stats.minutes')}`,
      color: 'text-blue-400',
      onClick: () => setCurrentView('stats'),
    },
    {
      id: 'rate',
      icon: TrendingUp,
      label: t('stats.successRate'),
      value: stats.successRate,
      suffix: '%',
      color: 'text-purple-400',
      onClick: () => setCurrentView('stats'),
    },
    {
      id: 'quests',
      icon: Target,
      label: t('nav.quests'),
      value: null,
      color: 'text-pink-400',
      onClick: () => setCurrentView('quests'),
    },
    {
      id: 'library',
      icon: BookOpen,
      label: t('nav.library'),
      value: null,
      color: 'text-cyan-400',
      onClick: () => setCurrentView('library'),
    },
    {
      id: 'history',
      icon: History,
      label: t('nav.history'),
      value: null,
      color: 'text-yellow-400',
      onClick: () => setCurrentView('history'),
    },
  ];

  return (
    <div className="orbital-container">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="orbital-card animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={card.onClick}
          >
            <div className={`${card.color} mb-3`}>
              <Icon size={32} />
            </div>
            {card.value !== null ? (
              <>
                <div className="text-3xl font-bold text-white mb-1">
                  {card.value}
                  {card.suffix && (
                    <span className="text-lg text-white/60 ml-1">
                      {card.suffix}
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/60 text-center">
                  {card.label}
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-white text-center">
                {card.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrbitalCards;

