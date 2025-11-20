import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from './stores/appStore';
import Layout from './components/Layout';
import MinimalDashboard from './components/MinimalDashboard';
import FirstRunModal from './components/FirstRunModal';
import LoadingScreen from './components/LoadingScreen';
import CommandPalette from './components/CommandPalette';
import NotificationSystem from './components/NotificationSystem';
import { Notification } from './components/NotificationSystem';
import QuestsView from './components/views/QuestsView';
import LibraryView from './components/views/LibraryView';
import StatsView from './components/views/StatsView';
import HistoryView from './components/views/HistoryView';
import SettingsView from './components/views/SettingsView';

const App: React.FC = () => {
  const { initialize, currentView } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const updateNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    initialize().catch((error) => {
      console.error('Error initializing app:', error);
    });
  }, [initialize]);

  const handleLoadingComplete = React.useCallback(() => {
    console.log('Loading complete callback called');
    setIsLoading(false);
  }, []);

  const generateNotificationId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random()}`;
  };

  const pushNotification = useCallback(
    (notification: Omit<Notification, 'id'> & { id?: string }) => {
      const id = notification.id ?? generateNotificationId();
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        return [...filtered, { ...notification, id }];
      });
      return id;
    },
    []
  );

  const updateNotificationEntry = useCallback((id: string, changes: Partial<Notification>) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...changes } : n)));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable((info) => {
      updateNotificationIdRef.current = pushNotification({
        type: 'info',
        title: 'Atualização disponível',
        message: info?.version
          ? `Baixando a versão ${info.version}...`
          : 'Baixando a nova atualização...',
        duration: 0,
      });
    });

    const unsubscribeProgress = window.electronAPI.onUpdateDownloadProgress((progress) => {
      if (!updateNotificationIdRef.current) return;
      const percent = Number.isFinite(progress?.percent)
        ? Math.max(0, Math.min(100, Math.round(progress.percent)))
        : null;
      updateNotificationEntry(updateNotificationIdRef.current, {
        message: percent
          ? `Baixando atualização (${percent}%)`
          : 'Baixando atualização...',
      });
    });

    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      const id = pushNotification({
        id: updateNotificationIdRef.current ?? undefined,
        type: 'success',
        title: 'Atualização pronta',
        message: 'Clique para instalar agora.',
        duration: 0,
        actionLabel: 'Atualizar agora',
        onAction: () => {
          window.electronAPI.installUpdate().catch((error) => {
            console.error('Failed to install update:', error);
          });
        },
      });
      updateNotificationIdRef.current = id;
    });

    const unsubscribeError = window.electronAPI.onUpdateError((error) => {
      pushNotification({
        type: 'error',
        title: 'Erro ao atualizar',
        message: error?.message || 'Não foi possível concluir a atualização.',
        duration: 8000,
      });
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeProgress();
      unsubscribeDownloaded();
      unsubscribeError();
    };
  }, [pushNotification, updateNotificationEntry]);

  // Fallback: force complete after 3 seconds if still loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Fallback: forcing loading to complete');
        setIsLoading(false);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimeout);
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MinimalDashboard />;
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
        return <MinimalDashboard />;
    }
  };

  return (
    <Layout>
      {renderContent()}
      
      {/* Modals and Overlays */}
      <FirstRunModal />
      <CommandPalette />
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
    </Layout>
  );
};

export default App;
