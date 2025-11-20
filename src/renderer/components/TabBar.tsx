import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { 
  LayoutDashboard, Target, BookOpen, 
  BarChart3, History, Settings, Circle
} from 'lucide-react';

const TabBar: React.FC = () => {
  const { t } = useTranslation();
  const { currentView, setCurrentView, discordStatus } = useAppStore();

  const tabs = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'quests', label: t('nav.quests'), icon: Target },
    { id: 'library', label: t('nav.library'), icon: BookOpen },
    { id: 'stats', label: t('nav.stats'), icon: BarChart3 },
    { id: 'history', label: t('nav.history'), icon: History },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="ide-bottombar">
      <div className="flex items-center space-x-1 flex-1 justify-center">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all relative ${
                isActive
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-accent rounded-full" />
              )}
              <tab.icon size={20} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Status Indicator */}
      <div className="flex items-center space-x-2 px-4">
        <Circle 
          size={8} 
          className={discordStatus.isRunning ? 'text-green-500' : 'text-red-500'}
          fill="currentColor"
        />
        <span className="text-xs text-text-secondary">
          {discordStatus.isRunning ? t('common.online') : t('common.offline')}
        </span>
      </div>
    </div>
  );
};

export default TabBar;

