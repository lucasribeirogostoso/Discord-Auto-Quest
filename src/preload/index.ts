import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  QuestHistory,
  Stats,
  DiscordProcess,
  LogMessage,
  Account,
  AccountData,
  DiscordUser,
  UserData,
} from '../types/electron';
import { QuestResult, QuestImageData } from '../types/quest';

const subscribeToChannel = <T = any>(channel: string, callback: (data: T) => void) => {
  const handler = (_: unknown, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings') as Promise<AppSettings>,
  updateSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke('update-settings', settings) as Promise<AppSettings>,

  // History
  getHistory: () => ipcRenderer.invoke('get-history') as Promise<QuestHistory[]>,
  clearHistory: () => ipcRenderer.invoke('clear-history') as Promise<boolean>,

  // Stats
  getStats: () => ipcRenderer.invoke('get-stats') as Promise<Stats>,

  // Discord
  getDiscordStatus: () =>
    ipcRenderer.invoke('get-discord-status') as Promise<{
      isRunning: boolean;
      process: DiscordProcess | null;
    }>,
  getAllQuests: () => ipcRenderer.invoke('get-all-quests') as Promise<QuestResult>,
  executeQuestAutomation: (questId?: string) =>
    ipcRenderer.invoke('execute-quest-automation', questId) as Promise<{
      success: boolean;
      message: string;
      data?: unknown;
    }>,
  getDiscordUser: () =>
    ipcRenderer.invoke('get-discord-user') as Promise<{
      success: boolean;
      user: DiscordUser | null;
      message?: string;
    }>,
  getSavedUser: () => ipcRenderer.invoke('get-saved-user') as Promise<UserData | null>,
  extractDiscordToken: () =>
    ipcRenderer.invoke('extract-discord-token') as Promise<{
      success: boolean;
      token?: string;
      message?: string;
    }>,
  getQuestImagesFromCache: (questIds: string[], historyData?: QuestImageData[]) =>
    ipcRenderer.invoke('get-quest-images-from-cache', questIds, historyData) as Promise<{
      success: boolean;
      imageMap: Record<string, string>;
      message?: string;
    }>,

  // Auto Update
  checkForUpdates: () =>
    ipcRenderer.invoke('check-for-updates') as Promise<{
      success: boolean;
      message?: string;
      updateInfo?: unknown;
    }>,
  installUpdate: () => ipcRenderer.invoke('install-update') as Promise<{ success: boolean }>,
  onUpdateChecking: (callback: () => void) => subscribeToChannel('auto-update-checking', callback),
  onUpdateAvailable: (callback: (info: any) => void) =>
    subscribeToChannel('auto-update-available', callback),
  onUpdateNotAvailable: (callback: (info: any) => void) =>
    subscribeToChannel('auto-update-not-available', callback),
  onUpdateDownloadProgress: (callback: (info: any) => void) =>
    subscribeToChannel('auto-update-download-progress', callback),
  onUpdateDownloaded: (callback: (info: any) => void) =>
    subscribeToChannel('auto-update-downloaded', callback),
  onUpdateError: (callback: (info: any) => void) =>
    subscribeToChannel('auto-update-error', callback),

  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url) as Promise<boolean>,

  // Event listeners
  onDiscordStatusChanged: (
    callback: (data: { isRunning: boolean; process: DiscordProcess | null }) => void
  ) => {
    const subscription = (
      _: unknown,
      data: { isRunning: boolean; process: DiscordProcess | null }
    ) => callback(data);
    ipcRenderer.on('discord-status-changed', subscription);
    return () => ipcRenderer.removeListener('discord-status-changed', subscription);
  },

  onQuestLog: (callback: (data: LogMessage) => void) => {
    const subscription = (_: unknown, data: LogMessage) => callback(data);
    ipcRenderer.on('quest-log', subscription);
    return () => ipcRenderer.removeListener('quest-log', subscription);
  },

  // WebSocket
  sendWebSocketMessage: (message: Record<string, unknown>) => {
    ipcRenderer.send('websocket-send', message);
  },

  onWebSocketMessage: (callback: (data: Record<string, unknown>) => void) => {
    const subscription = (_: unknown, data: Record<string, unknown>) => callback(data);
    ipcRenderer.on('websocket-message', subscription);
    return () => ipcRenderer.removeListener('websocket-message', subscription);
  },
  onSystemInitProgress: (
    subscription: (progress: {
      stepIndex: number;
      stepName: string;
      progress: number;
      status: 'loading' | 'complete' | 'error';
    }) => void
  ) => {
    const handler = (_: any, data: any) => subscription(data);
    ipcRenderer.on('system-init-progress', handler);
    return () => ipcRenderer.removeListener('system-init-progress', handler);
  },
  // Account Management
  getAllAccounts: () => ipcRenderer.invoke('get-all-accounts') as Promise<Account[]>,
  getActiveAccount: () => ipcRenderer.invoke('get-active-account') as Promise<Account | null>,
  switchAccount: (accountId: string) =>
    ipcRenderer.invoke('switch-account', accountId) as Promise<boolean>,
  removeAccount: (accountId: string) =>
    ipcRenderer.invoke('remove-account', accountId) as Promise<boolean>,
  getAccountData: (accountId: string) =>
    ipcRenderer.invoke('get-account-data', accountId) as Promise<AccountData>,
  detectCurrentAccount: () =>
    ipcRenderer.invoke('detect-current-account') as Promise<Account | null>,
  executeForAllAccounts: (questId?: string) =>
    ipcRenderer.invoke('execute-for-all-accounts', questId) as Promise<{
      success: boolean;
      results: unknown[];
    }>,
  initializeSystem: () =>
    ipcRenderer.invoke('initialize-system') as Promise<{
      success: boolean;
      initialized?: boolean;
      modules?: {
        storage: boolean;
        settings: boolean;
        accounts: number;
        discordInjector: boolean;
        websocketServer: boolean;
        discordDetected: boolean;
      };
      error?: string;
    }>,
});
