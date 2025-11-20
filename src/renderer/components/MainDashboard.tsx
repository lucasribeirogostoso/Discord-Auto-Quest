import React from 'react';
import { useAppStore } from '../stores/appStore';
import HeroUserCard from './HeroUserCard';
import OrbitalCards from './OrbitalCards';
import LogStream from './LogStream';
import RadialNavigation from './RadialNavigation';
import DashboardView from './views/DashboardView';
import QuestsView from './views/QuestsView';
import LibraryView from './views/LibraryView';
import StatsView from './views/StatsView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';

const MainDashboard: React.FC = () => {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'quests':
        return <QuestsView />;
      case 'library':
        return <LibraryView />;
      case 'stats':
        return <StatsView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Se não estiver no dashboard, mostrar overlay
  if (currentView !== 'dashboard') {
    return (
      <>
        <div className="view-overlay">
          <div className="view-content">
            {renderView()}
          </div>
        </div>
        {/* Keep hero and orbitals visible but dimmed */}
        <div className="opacity-30 pointer-events-none">
          <HeroUserCard />
          <OrbitalCards />
        </div>
        <LogStream />
        <RadialNavigation />
      </>
    );
  }

  return (
    <>
      <HeroUserCard />
      <OrbitalCards />
      <LogStream />
      <RadialNavigation />
    </>
  );
};

export default MainDashboard;

