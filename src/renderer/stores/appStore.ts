import { create } from 'zustand';
import {
  AppSettings,
  Stats,
  QuestHistory,
  DiscordProcess,
  LogMessage,
  Account,
} from '../../types/electron';
import { WebSocketClient } from '../utils/websocket-client';
import { applyAccentColorToDOM } from '../utils/color-utils';

// Constantes locais para o renderer (valores em milissegundos)
const AUTO_EXECUTE_DELAY = 2000;
const QUEST_PROGRESS_INTERVAL = 3000;

interface AppState {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Stats
  stats: Stats;
  refreshStats: () => Promise<void>;

  // History
  history: QuestHistory[];
  refreshHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;

  // Discord Status
  discordStatus: {
    isRunning: boolean;
    process: DiscordProcess | null;
  };
  setDiscordStatus: (status: { isRunning: boolean; process: DiscordProcess | null }) => void;

  // Logs
  logs: LogMessage[];
  addLog: (log: LogMessage) => void;
  clearLogs: () => void;

  // UI State
  currentView: 'dashboard' | 'quests' | 'library' | 'stats' | 'history' | 'settings';
  setCurrentView: (
    view: 'dashboard' | 'quests' | 'library' | 'stats' | 'history' | 'settings'
  ) => void;

  isExecuting: boolean;
  setIsExecuting: (isExecuting: boolean) => void;

  showFirstRunModal: boolean;
  setShowFirstRunModal: (show: boolean) => void;

  // WebSocket
  wsClient: WebSocketClient | null;
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // Account Management
  accounts: Account[];
  activeAccount: Account | null;
  refreshAccounts: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  detectCurrentAccount: () => Promise<void>;

  // Quest Progress Tracking
  questProgress: Map<string, QuestProgress>;
  updateQuestProgress: (questId: string, progress: QuestProgress | null) => void;
  getQuestProgress: (questId: string) => QuestProgress | null;

  // Initialize
  initialize: () => Promise<void>;
}

export interface QuestProgress {
  questId: string;
  questName: string;
  secondsNeeded: number;
  secondsDone: number;
  startTime: number;
  estimatedEndTime: number;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  settings: {
    language: 'en',
    autoExecute: false,
    notifications: true,
    theme: 'dark',
    firstRun: true,
    accentColor: '#5865F2',
    highContrast: true,
  },
  stats: {
    totalCompleted: 0,
    totalTimeSaved: 0,
    successRate: 100,
    lastQuestCompleted: null,
  },
  history: [],
  discordStatus: {
    isRunning: false,
    process: null,
  },
  logs: [],
  currentView: 'dashboard',
  isExecuting: false,
  showFirstRunModal: false,
  wsClient: null,
  wsConnected: false,
  accounts: [],
  activeAccount: null,
  questProgress: new Map<string, QuestProgress>(),

  // Actions
  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const updated = await window.electronAPI.updateSettings(newSettings);
    set({ settings: updated });

    // Update theme
    if (newSettings.theme) {
      document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    }

    // Update high contrast
    if (newSettings.highContrast !== undefined) {
      document.documentElement.classList.toggle('high-contrast', newSettings.highContrast);
    }

    // Update accent color dynamically using utility function
    if (newSettings.accentColor) {
      applyAccentColorToDOM(newSettings.accentColor);
    }

    // Update language
    if (newSettings.language) {
      localStorage.setItem('language', newSettings.language);
      window.location.reload();
    }
  },

  refreshStats: async () => {
    const stats = await window.electronAPI.getStats();
    set({ stats });
  },

  refreshHistory: async () => {
    const history = await window.electronAPI.getHistory();
    set({ history });
  },

  clearHistory: async () => {
    await window.electronAPI.clearHistory();
    set({ history: [] });
    await get().refreshStats();
  },

  setDiscordStatus: (status) => {
    set({ discordStatus: status });
  },

  addLog: (log) => {
    set((state) => {
      // Keep only last 500 logs to prevent memory issues
      const newLogs = [...state.logs, log];
      if (newLogs.length > 500) {
        newLogs.shift();
      }
      return { logs: newLogs };
    });
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  setCurrentView: (view) => {
    set({ currentView: view });
  },

  setIsExecuting: (isExecuting) => {
    set({ isExecuting });
  },

  setShowFirstRunModal: (show) => {
    set({ showFirstRunModal: show });
  },

  setWsConnected: (connected) => {
    set({ wsConnected: connected });
  },

  refreshAccounts: async () => {
    const accounts = await window.electronAPI.getAllAccounts();
    const activeAccount = await window.electronAPI.getActiveAccount();
    set({ accounts, activeAccount });
  },

  switchAccount: async (accountId: string) => {
    await window.electronAPI.switchAccount(accountId);
    await get().refreshAccounts();
    // Refresh stats and history for new account
    await get().refreshStats();
    await get().refreshHistory();
  },

  removeAccount: async (accountId: string) => {
    await window.electronAPI.removeAccount(accountId);
    await get().refreshAccounts();
    // Refresh stats and history
    await get().refreshStats();
    await get().refreshHistory();
  },

  detectCurrentAccount: async () => {
    const account = await window.electronAPI.detectCurrentAccount();
    if (account) {
      await get().refreshAccounts();
    }
  },

  updateQuestProgress: (questId, progress) => {
    const current = get().questProgress;
    const newMap = new Map(current);
    if (progress === null) {
      newMap.delete(questId);
    } else {
      newMap.set(questId, progress);
    }
    set({ questProgress: newMap });
  },

  getQuestProgress: (questId) => {
    return get().questProgress.get(questId) || null;
  },

  initialize: async () => {
    // Load settings
    const settings = await window.electronAPI.getSettings();
    set({ settings });

    // Apply theme
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');

    // Apply high contrast
    document.documentElement.classList.toggle('high-contrast', settings.highContrast ?? true);

    // Apply accent color using utility function
    if (settings.accentColor) {
      applyAccentColorToDOM(settings.accentColor);
    }

    // Show first run modal if needed
    if (settings.firstRun) {
      set({ showFirstRunModal: true });
    }

    // Load stats and history
    await get().refreshStats();
    await get().refreshHistory();

    // Get initial Discord status
    const discordStatus = await window.electronAPI.getDiscordStatus();
    set({ discordStatus });

    // Load accounts and detect current account
    await get().refreshAccounts();
    await get().detectCurrentAccount();

    // Setup event listeners
    window.electronAPI.onDiscordStatusChanged((status) => {
      get().setDiscordStatus(status);

      // Auto-execute if enabled
      if (status.isRunning && settings.autoExecute && !get().isExecuting) {
        // Small delay to ensure Discord is ready
        setTimeout(() => {
          executeQuestAutomation();
        }, AUTO_EXECUTE_DELAY);
      }
    });

    window.electronAPI.onQuestLog((log) => {
      get().addLog(log);
    });

    // Initialize WebSocket client
    const wsClient = new WebSocketClient(8765);
    set({ wsClient });

    // Setup WebSocket event handlers
    wsClient.on('connected', () => {
      get().setWsConnected(true);
      get().addLog({
        timestamp: Date.now(),
        message: 'WebSocket connected',
        level: 'success',
      });
    });

    wsClient.on('disconnected', () => {
      get().setWsConnected(false);
      get().addLog({
        timestamp: Date.now(),
        message: 'WebSocket disconnected',
        level: 'warning',
      });
    });

    wsClient.on('quest-update', (data) => {
      // Handle quest updates in real-time
      get().addLog({
        timestamp: Date.now(),
        message: `Quest update: ${JSON.stringify(data)}`,
        level: 'info',
      });
    });

    wsClient.on('log', (data) => {
      // Handle logs from Discord
      get().addLog({
        timestamp: Date.now(),
        message: data.message || JSON.stringify(data),
        level: data.level || 'info',
      });
    });

    wsClient.on('status-update', (data) => {
      // Handle status updates
      if (data.discordStatus) {
        get().setDiscordStatus(data.discordStatus);
      }
    });

    // Connect WebSocket
    wsClient.connect();

    // Also listen to IPC messages (fallback)
    window.electronAPI.onWebSocketMessage((message: any) => {
      // Handle messages from main process
      if (message.type === 'quest-update') {
        wsClient.emit('quest-update', message.data);
      } else if (message.type === 'log') {
        wsClient.emit('log', message.data);
      } else if (message.type === 'status-update') {
        wsClient.emit('status-update', message.data);
      }
    });
  },
}));

// Promise-based lock to prevent multiple simultaneous executions
let executionLock: Promise<void> | null = null;

// Helper function for executing quest automation
export const executeQuestAutomation = async (questId?: string) => {
  const store = useAppStore.getState();

  // If already executing, wait for current execution to finish
  if (executionLock) {
    store.addLog({
      timestamp: Date.now(),
      message: 'Automation already in progress. Please wait...',
      level: 'warning',
    });
    await executionLock;
    return;
  }

  // Create execution lock
  executionLock = (async () => {
    store.setIsExecuting(true);
    store.addLog({
      timestamp: Date.now(),
      message: questId
        ? `Starting quest automation for quest ${questId}...`
        : 'Starting quest automation...',
      level: 'info',
    });

    try {
      const result = await window.electronAPI.executeQuestAutomation(questId);

      if (result.success && result.data && questId) {
        // Iniciar monitoramento de progresso
        const secondsNeeded = result.data.secondsNeeded || result.data.questSecondsNeeded || 0;

        if (secondsNeeded > 0) {
          const startTime = Date.now();

          // Buscar progresso atualizado imediatamente do Discord
          // Porque o result.data pode ter secondsDone = 0 mesmo que a quest já esteja em progresso
          const immediateUpdate = async () => {
            try {
              const questsResult = await window.electronAPI.getAllQuests();
              if (questsResult.success && questsResult.quests) {
                const quest = questsResult.quests.find(
                  (q: any) => (q.questId || q.questImageId || q.id) === questId
                );

                if (quest) {
                  const currentSecondsDone = quest.secondsDone || 0;
                  const currentSecondsNeeded = quest.secondsNeeded || secondsNeeded;

                  const remainingSeconds = Math.max(0, currentSecondsNeeded - currentSecondsDone);
                  const estimatedEndTime = Date.now() + remainingSeconds * 1000;

                  store.updateQuestProgress(questId, {
                    questId,
                    questName: quest.questName || result.data.questName || 'Unknown Quest',
                    secondsNeeded: currentSecondsNeeded,
                    secondsDone: currentSecondsDone,
                    startTime:
                      currentSecondsDone > 0 ? Date.now() - currentSecondsDone * 1000 : startTime,
                    estimatedEndTime,
                  });

                  console.log(
                    `[Progress] Initial quest progress: ${currentSecondsDone}/${currentSecondsNeeded}s (${Math.round(
                      (currentSecondsDone / currentSecondsNeeded) * 100
                    )}%)`
                  );
                }
              }
            } catch (error: any) {
              console.error('[Progress] Error fetching initial progress:', error);
            }
          };

          // Atualizar imediatamente e depois iniciar monitoramento
          await immediateUpdate();

          // Iniciar monitoramento periódico
          startQuestProgressMonitoring(questId);
        } else {
          // Se não há tempo necessário, completar imediatamente
          store.addLog({
            timestamp: Date.now(),
            message: result.message,
            level: 'success',
          });

          if (store.settings.notifications && 'Notification' in window) {
            new Notification('Quest Automation', {
              body: result.message,
            });
          }

          await store.refreshStats();
          await store.refreshHistory();
        }
      } else if (result.success) {
        // Sucesso sem dados de progresso
        store.addLog({
          timestamp: Date.now(),
          message: result.message,
          level: 'success',
        });

        if (store.settings.notifications && 'Notification' in window) {
          new Notification('Quest Automation', {
            body: result.message,
          });
        }

        await store.refreshStats();
        await store.refreshHistory();
      } else {
        store.addLog({
          timestamp: Date.now(),
          message: result.message,
          level: 'error',
        });

        if (questId) {
          store.updateQuestProgress(questId, null);
        }
      }
    } catch (error: any) {
      store.addLog({
        timestamp: Date.now(),
        message: `Error: ${error.message}`,
        level: 'error',
      });

      if (questId) {
        store.updateQuestProgress(questId, null);
      }
    } finally {
      store.setIsExecuting(false);
      executionLock = null; // Release lock
    }
  })();

  await executionLock;
};

// Função para monitorar o progresso da quest
let progressMonitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

const startQuestProgressMonitoring = async (questId: string) => {
  // Limpar intervalo anterior se existir
  const existingInterval = progressMonitoringIntervals.get(questId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  const interval = setInterval(async () => {
    const store = useAppStore.getState();
    const progress = store.getQuestProgress(questId);
    if (!progress) {
      clearInterval(interval);
      progressMonitoringIntervals.delete(questId);
      return;
    }

    // Buscar informações atualizadas da quest
    try {
      const questsResult = await window.electronAPI.getAllQuests();
      if (questsResult.success && questsResult.quests) {
        // Tentar encontrar a quest por múltiplos campos possíveis
        const quest = questsResult.quests.find((q: any) => {
          const qId = q.questId || q.questImageId || q.id;
          return qId === questId || qId?.toString() === questId?.toString();
        });

        if (quest) {
          // Usar dados reais do Discord, não estimativas
          const currentSecondsDone = quest.secondsDone || 0;
          const secondsNeeded = quest.secondsNeeded || progress.secondsNeeded;

          // SEMPRE usar o valor atual do Discord, não manter o anterior
          // O Discord atualiza o progresso em tempo real
          const newSecondsDone = currentSecondsDone;

          // Recalcular startTime se o progresso mudou significativamente
          let startTime = progress.startTime;
          if (currentSecondsDone > progress.secondsDone + 5) {
            // Se o progresso aumentou muito, recalcular o startTime
            startTime = Date.now() - currentSecondsDone * 1000;
          }

          // Calcular tempo restante baseado no progresso real e velocidade média
          const elapsed = (Date.now() - startTime) / 1000;
          const progressRate = newSecondsDone > 0 && elapsed > 0 ? newSecondsDone / elapsed : 0;

          // Se houver progresso, estimar baseado na velocidade
          // Caso contrário, usar o tempo restante linear
          let estimatedEndTime: number;
          if (progressRate > 0 && newSecondsDone < secondsNeeded && newSecondsDone > 0) {
            const remainingSeconds = (secondsNeeded - newSecondsDone) / progressRate;
            estimatedEndTime = Date.now() + remainingSeconds * 1000;
          } else {
            // Fallback: tempo linear baseado no restante
            const remainingSeconds = Math.max(0, secondsNeeded - newSecondsDone);
            estimatedEndTime = Date.now() + remainingSeconds * 1000;
          }

          // Atualizar progresso com dados reais do Discord
          store.updateQuestProgress(questId, {
            questId,
            questName: quest.questName || progress.questName,
            secondsDone: Math.min(newSecondsDone, secondsNeeded),
            secondsNeeded, // Atualizar também caso mude
            startTime,
            estimatedEndTime,
          });

          console.log(
            `[Progress] Quest ${questId}: ${newSecondsDone}/${secondsNeeded}s (${Math.round(
              (newSecondsDone / secondsNeeded) * 100
            )}%) - ${Math.ceil((estimatedEndTime - Date.now()) / 1000 / 60)} min restantes`
          );

          // Verificar se completou
          if (quest.isCompleted || newSecondsDone >= secondsNeeded) {
            clearInterval(interval);
            progressMonitoringIntervals.delete(questId);
            store.updateQuestProgress(questId, null);

            store.addLog({
              timestamp: Date.now(),
              message: `Quest "${progress.questName}" completed!`,
              level: 'success',
            });

            if (store.settings.notifications && 'Notification' in window) {
              new Notification('Quest Completed', {
                body: `Quest "${progress.questName}" has been completed!`,
              });
            }

            // Atualizar stats e history
            await store.refreshStats();
            await store.refreshHistory();
          }
        } else {
          // Quest não encontrada, pode ter sido removida ou completada
          clearInterval(interval);
          progressMonitoringIntervals.delete(questId);
          store.updateQuestProgress(questId, null);
        }
      }
    } catch (error: any) {
      console.error('Error monitoring quest progress:', error);
    }
  }, QUEST_PROGRESS_INTERVAL); // Verificar a cada N segundos conforme constante

  progressMonitoringIntervals.set(questId, interval);
};
