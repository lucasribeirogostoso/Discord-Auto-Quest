import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Search, Settings, History, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';

interface FABAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

const FloatingActionButton: React.FC = () => {
  const { t } = useTranslation();
  const { setCurrentView, discordStatus } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const actions: FABAction[] = [
    {
      id: 'execute',
      icon: <Play size={20} />,
      label: t('dashboard.executeButton'),
      onClick: () => {
        executeQuestAutomation();
        setIsOpen(false);
      },
      color: '#39FF14',
    },
    {
      id: 'quests',
      icon: <Search size={20} />,
      label: t('nav.quests'),
      onClick: () => {
        setCurrentView('quests');
        setIsOpen(false);
      },
      color: '#B026FF',
    },
    {
      id: 'history',
      icon: <History size={20} />,
      label: t('nav.history'),
      onClick: () => {
        setCurrentView('history');
        setIsOpen(false);
      },
      color: '#00F5FF',
    },
    {
      id: 'settings',
      icon: <Settings size={20} />,
      label: t('nav.settings'),
      onClick: () => {
        setCurrentView('settings');
        setIsOpen(false);
      },
      color: '#FFD60A',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={fabRef} className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-4">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={`flex items-center gap-3 transition-all duration-300 ${
              isOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : `${(actions.length - index) * 50}ms`,
            }}
          >
            <span 
              className="hologram-card px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border"
              style={{ borderColor: `${action.color}40` }}
            >
              {action.label}
            </span>
            <button
              onClick={action.onClick}
              disabled={action.id === 'execute' && !discordStatus.isRunning}
              className="w-14 h-14 rounded-full hologram-card flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2"
              style={{
                borderColor: action.color,
                boxShadow: `0 0 20px ${action.color}40`,
                color: action.color,
              }}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00F5FF, #B026FF)',
          borderColor: '#00F5FF',
          boxShadow: '0 0 30px rgba(0, 245, 255, 0.5), 0 0 60px rgba(176, 38, 255, 0.3)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        {isOpen ? (
          <X size={24} className="text-white relative z-10" />
        ) : (
          <Zap size={24} className="text-white relative z-10" />
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
