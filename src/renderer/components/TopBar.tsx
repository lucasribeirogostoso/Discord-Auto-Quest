import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Search, Settings, HelpCircle, Circle } from 'lucide-react';

const TopBar: React.FC = () => {
  const { t } = useTranslation();
  const { currentView, discordStatus } = useAppStore();

  const getBreadcrumb = () => {
    const breadcrumbs: Record<string, string> = {
      dashboard: t('nav.dashboard'),
      quests: t('nav.quests'),
      library: t('nav.library'),
      stats: t('nav.stats'),
      history: t('nav.history'),
      settings: t('nav.settings'),
    };
    return breadcrumbs[currentView] || t('nav.dashboard');
  };

  return (
    <div className="ide-topbar">
      <div className="flex items-center flex-1">
        <h1 className="text-sm font-semibold text-text-primary mr-4">
          Discord Auto Quest
        </h1>
        <div className="h-4 w-px bg-border-color mx-2" />
        <span className="text-xs text-text-secondary">
          {getBreadcrumb()}
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Discord Status Mini */}
        <div className="flex items-center space-x-2 px-2 py-1 rounded">
          <Circle 
            size={8} 
            className={discordStatus.isRunning ? 'text-green-500' : 'text-red-500'}
            fill="currentColor"
          />
          <span className="text-xs text-text-secondary">
            {discordStatus.isRunning ? t('common.online') : t('common.offline')}
          </span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={t('dashboard.searchGames')}
            className="neo-input pl-8 pr-3 py-1 text-xs w-48"
          />
        </div>
        
        {/* Actions */}
        <button className="p-2 hover:bg-bg-surface rounded transition-colors">
          <HelpCircle size={16} className="text-text-secondary" />
        </button>
        <button className="p-2 hover:bg-bg-surface rounded transition-colors">
          <Settings size={16} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;

