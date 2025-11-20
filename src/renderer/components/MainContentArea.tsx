import React from 'react';
import { useAppStore } from '../stores/appStore';
import DashboardTab from './tabs/DashboardTab';
import QuestsTab from './tabs/QuestsTab';
import LibraryTab from './tabs/LibraryTab';
import StatsTab from './tabs/StatsTab';
import HistoryTab from './tabs/HistoryTab';
import SettingsTab from './tabs/SettingsTab';

const MainContentArea: React.FC = () => {
  const { currentView } = useAppStore();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardTab />;
      case 'quests':
        return <QuestsTab />;
      case 'library':
        return <LibraryTab />;
      case 'stats':
        return <StatsTab />;
      case 'history':
        return <HistoryTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="ide-content">
      <div className="ide-tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContentArea;

