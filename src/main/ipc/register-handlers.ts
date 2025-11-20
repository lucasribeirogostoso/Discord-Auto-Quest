import { ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { accountManager } from '../account-manager';
import {
  getSettings,
  updateSettings,
  getHistory,
  clearHistory,
  getStats,
  addHistoryEntry,
  getUserData,
  saveUserData,
} from '../store';
import { scheduler } from '../scheduler';
import { QuestHistory, Schedule } from '../types';
import {
  validateAccountId,
  validateQuestId,
  validateSettings,
  validateUrl,
  sanitizeUrl,
} from '../utils/validators';
import { logger } from '../utils/logger';
import { formatError } from '../utils/error-handler';
import { ProcessMonitor } from '../process-monitor';
import { DiscordInjector } from '../discord-injector';
import { DiscordWebSocketServer } from '../discord-websocket';
import { DUPLICATE_QUEST_WINDOW } from '../constants';
import { envConfig } from '../config';

interface IpcHandlerContext {
  getProcessMonitor: () => ProcessMonitor | null;
  getDiscordInjector: () => DiscordInjector | null;
  getWebSocketServer: () => DiscordWebSocketServer | null;
}

/**
 * Organiza o registro de todos os handlers IPC em um único ponto.
 * Mantém o arquivo principal (`index.ts`) enxuto e facilita testes isolados.
 */
export function registerIpcHandlers(context: IpcHandlerContext): void {
  const { getProcessMonitor, getDiscordInjector, getWebSocketServer } = context;

  ipcMain.handle('get-settings', async () => {
    try {
      const settings = getSettings();
      logger.debug('Settings retrieved', 'IPC');
      return settings;
    } catch (error) {
      const formattedError = formatError(error, 'GetSettings');
      logger.error(`Failed to get settings: ${formattedError.message}`, 'IPC');
      throw formattedError.originalError || new Error(formattedError.message);
    }
  });

  ipcMain.handle('update-settings', async (_, settings) => {
    try {
      if (!validateSettings(settings)) {
        const error = new Error('Invalid settings provided');
        logger.warn('Invalid settings validation failed', 'IPC', { settings });
        throw error;
      }

      const updated = updateSettings(settings);
      logger.info('Settings updated', 'IPC');
      return updated;
    } catch (error) {
      const formattedError = formatError(error, 'UpdateSettings');
      logger.error(`Failed to update settings: ${formattedError.message}`, 'IPC');
      throw formattedError.originalError || new Error(formattedError.message);
    }
  });

  ipcMain.handle('get-history', async () => {
    const activeAccount = await accountManager.getActiveAccount();
    if (activeAccount) {
      const accountData = await accountManager.getAccountData(activeAccount.id);
      return accountData.history;
    }
    return getHistory();
  });

  ipcMain.handle('clear-history', async () => {
    clearHistory();
    return true;
  });

  ipcMain.handle('get-stats', async () => {
    const activeAccount = await accountManager.getActiveAccount();
    if (activeAccount) {
      const accountData = await accountManager.getAccountData(activeAccount.id);
      return accountData.stats;
    }
    return getStats();
  });

  ipcMain.handle('get-discord-status', async () => {
    const monitor = getProcessMonitor();
    if (monitor) {
      const process = monitor.getCurrentProcess();
      return {
        isRunning: process !== null,
        process,
      };
    }
    return { isRunning: false, process: null };
  });

  ipcMain.handle('get-all-quests', async () => {
    try {
      const injector = getDiscordInjector();
      const activeAccount = await accountManager.getActiveAccount();
      if (!activeAccount) {
        logger.warn('No active account selected when fetching quests', 'IPC');
        return { success: false, quests: [], message: 'No active account selected' };
      }

      if (!injector) {
        logger.warn('Discord injector not initialized', 'IPC');
        return {
          success: false,
          quests: [],
          message:
            'Discord injector not initialized. Please ensure Discord is running and logged in.',
          warning: `Note: This will show quests from the Discord logged-in account, not from "${activeAccount.displayName}".`,
        };
      }

      logger.debug('Fetching quests via injection', 'IPC', { accountId: activeAccount.id });
      const result = await injector.getAllQuests();

      if (result.success && result.quests) {
        const accountData = await accountManager.getAccountData(activeAccount.id);
        const completedQuestIds = new Set(
          accountData.history
            .filter((h) => h.status === 'success')
            .map((h) => h.id || h.questImageId)
            .filter((id): id is string => Boolean(id))
        );

        const filteredQuests = result.quests.filter((quest: any) => {
          const questId = quest.questId || quest.questImageId || quest.id;
          if (!questId) return true;
          return true;
        });

        logger.debug(
          `Total quests: ${result.quests.length}, Filtered: ${filteredQuests.length}`,
          'IPC',
          { completedIds: Array.from(completedQuestIds) }
        );

        const currentDiscordAccount = await accountManager.detectCurrentAccount();
        const accountMismatch =
          currentDiscordAccount && currentDiscordAccount.userId !== activeAccount.userId;

        return {
          ...result,
          quests: filteredQuests,
          totalQuests: result.quests.length,
          filteredQuests: filteredQuests.length,
          accountFilter: activeAccount.displayName,
          source: 'injection',
          accountMismatch,
          warning: accountMismatch
            ? `Showing quests from Discord logged-in account "${currentDiscordAccount?.displayName}", filtered by history of selected account "${activeAccount.displayName}".`
            : undefined,
        };
      }

      return result;
    } catch (error) {
      const formattedError = formatError(error, 'GetAllQuests');
      logger.error(`Failed to get all quests: ${formattedError.message}`, 'IPC');
      return {
        success: false,
        quests: [],
        message: formattedError.userFriendlyMessage,
      };
    }
  });

  ipcMain.handle('get-discord-user', async () => {
    const injector = getDiscordInjector();
    if (!injector) {
      return { success: false, user: null, message: 'Discord injector not initialized' };
    }

    const result = await injector.getUserInfo();
    if (result.success && result.user) {
      const defaultUsername = 'User';
      saveUserData({
        id: result.user.id,
        username: result.user.username || defaultUsername,
        displayName: result.user.displayName || result.user.username || defaultUsername,
        globalName:
          result.user.globalName ||
          result.user.displayName ||
          result.user.username ||
          defaultUsername,
        discriminator: result.user.discriminator || '0000',
        avatar: result.user.avatar || null,
        avatarUrl: result.user.avatarUrl || null,
        bannerUrl: result.user.bannerUrl || null,
        lastUpdated: Date.now(),
      });
    }

    return result;
  });

  ipcMain.handle('get-all-accounts', async () => {
    return accountManager.getAllAccounts();
  });

  ipcMain.handle('get-active-account', async () => {
    return accountManager.getActiveAccount();
  });

  ipcMain.handle('switch-account', async (_, accountId: string) => {
    try {
      if (!validateAccountId(accountId)) {
        const error = new Error('Invalid account ID provided');
        logger.warn('Invalid account ID validation failed', 'IPC', { accountId });
        throw error;
      }

      await accountManager.switchAccount(accountId);
      logger.info(`Switched to account: ${accountId}`, 'IPC');
      return true;
    } catch (error) {
      const formattedError = formatError(error, 'SwitchAccount');
      logger.error(`Failed to switch account: ${formattedError.message}`, 'IPC', { accountId });
      throw formattedError.originalError || new Error(formattedError.message);
    }
  });

  ipcMain.handle('remove-account', async (_, accountId: string) => {
    try {
      if (!validateAccountId(accountId)) {
        const error = new Error('Invalid account ID provided');
        logger.warn('Invalid account ID validation failed', 'IPC', { accountId });
        throw error;
      }

      await accountManager.removeAccount(accountId);
      logger.info(`Removed account: ${accountId}`, 'IPC');
      return true;
    } catch (error) {
      const formattedError = formatError(error, 'RemoveAccount');
      logger.error(`Failed to remove account: ${formattedError.message}`, 'IPC', { accountId });
      throw formattedError.originalError || new Error(formattedError.message);
    }
  });

  ipcMain.handle('get-account-data', async (_, accountId: string) => {
    return accountManager.getAccountData(accountId);
  });

  ipcMain.handle('detect-current-account', async () => {
    return accountManager.detectCurrentAccount();
  });

  ipcMain.handle('execute-for-all-accounts', async (_, questId?: string) => {
    const injector = getDiscordInjector();
    if (!injector) {
      return { success: false, message: 'Discord injector not initialized' };
    }

    const accounts = await accountManager.getAllAccounts();
    const results = [];

    for (const account of accounts) {
      await accountManager.switchAccount(account.id);
      const result = await injector.injectCode(questId);
      results.push({
        accountId: account.id,
        accountName: account.displayName,
        result,
      });
    }

    return { success: true, results };
  });

  ipcMain.handle('get-saved-user', async () => {
    return getUserData();
  });

  ipcMain.handle(
    'get-quest-images-from-cache',
    async (
      _,
      questIds: string[],
      historyData?: Array<{
        id: string;
        appImageId?: string;
        applicationId?: string;
        imageIds?: string[];
      }>
    ) => {
      const injector = getDiscordInjector();
      if (!injector) {
        return { success: false, imageMap: {}, message: 'Discord injector not initialized' };
      }

      return injector.getQuestImagesFromCache(questIds, historyData);
    }
  );

  ipcMain.handle('check-for-updates', async () => {
    if (envConfig.isDev) {
      return {
        success: false,
        message: 'Auto-update só está disponível nas versões instaladas.',
      };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateInfo: result?.updateInfo ?? null,
      };
    } catch (error) {
      const formattedError = formatError(error, 'CheckForUpdates');
      logger.error(`Failed to check for updates: ${formattedError.message}`, 'AutoUpdater');
      return {
        success: false,
        message: formattedError.userFriendlyMessage,
      };
    }
  });

  ipcMain.handle('install-update', async () => {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      const formattedError = formatError(error, 'InstallUpdate');
      logger.error(`Failed to install update: ${formattedError.message}`, 'AutoUpdater');
      return {
        success: false,
        message: formattedError.userFriendlyMessage,
      };
    }
  });

  ipcMain.on('websocket-send', (_, message) => {
    const server = getWebSocketServer();
    if (server) {
      server.sendToDiscord(message);
    }
  });

  ipcMain.handle('extract-discord-token', async () => {
    const injector = getDiscordInjector();
    if (!injector) {
      return { success: false, message: 'Discord injector not initialized' };
    }

    try {
      const { extractDiscordToken } = await import('../token-extractor');
      const result = await extractDiscordToken();

      if (result.success && result.token) {
        const currentAccount = await accountManager.detectCurrentAccount();
        if (currentAccount) {
          await accountManager.saveTokenForAccount(currentAccount.id, result.token);
          logger.info(`Token saved for account: ${currentAccount.displayName}`, 'Token');
        } else {
          const userData = getUserData();
          if (userData) {
            const newAccount = await accountManager.createAccount(userData);
            await accountManager.saveTokenForAccount(newAccount.id, result.token);
            logger.info(`Token saved for new account: ${newAccount.displayName}`, 'Token');
          }
        }
      }

      return result;
    } catch (error: unknown) {
      const formattedError = formatError(error, 'ExtractToken');
      logger.error(`Failed to extract token: ${formattedError.message}`, 'Token');
      return { success: false, message: formattedError.userFriendlyMessage };
    }
  });

  ipcMain.handle('execute-quest-automation', async (_, questId?: string) => {
    try {
      if (questId && !validateQuestId(questId)) {
        const error = new Error('Invalid quest ID provided');
        logger.warn('Invalid quest ID validation failed', 'IPC', { questId });
        return { success: false, message: error.message };
      }

      const injector = getDiscordInjector();
      if (!injector) {
        logger.warn('Discord injector not initialized when executing quest', 'IPC');
        return { success: false, message: 'Discord injector not initialized' };
      }

      const currentAccount = await accountManager.detectCurrentAccount();
      if (!currentAccount) {
        const userData = getUserData();
        if (userData) {
          await accountManager.createAccount(userData);
          logger.info('Created new account from user data', 'IPC');
        }
      }

      const activeAccount = await accountManager.getActiveAccount();
      if (!activeAccount) {
        logger.warn('No active account found when executing quest', 'IPC');
        return {
          success: false,
          message: 'No active account found. Please ensure Discord is logged in.',
        };
      }

      const startTime = Date.now();
      logger.info(`Executing quest automation${questId ? ` for quest ${questId}` : ''}`, 'IPC', {
        questId,
        accountId: activeAccount.id,
      });

      const result = await injector.injectCode(questId);

      if (result.success && result.data) {
        const discordQuestId =
          result.data.questId || result.data.questImageId || Date.now().toString();
        const accountData = await accountManager.getAccountData(activeAccount.id);
        const duplicateWindowStart = Date.now() - DUPLICATE_QUEST_WINDOW;
        const recentDuplicate = accountData.history.find((h) => {
          if (h.id === discordQuestId && h.timestamp > duplicateWindowStart) {
            return true;
          }
          const questImageId = result.data.questImageId || discordQuestId;
          if (h.questImageId === questImageId && h.timestamp > duplicateWindowStart) {
            return true;
          }
          return false;
        });

        if (recentDuplicate) {
          logger.warn('Quest already completed recently, skipping duplicate', 'IPC', {
            questId: discordQuestId,
          });
          return {
            success: false,
            message:
              'This quest was already completed recently. Please wait before executing again.',
          };
        }

        const historyEntry: QuestHistory = {
          id: discordQuestId,
          questName: result.data.questName || 'Unknown Quest',
          applicationName: result.data.applicationName || 'Unknown App',
          timestamp: startTime,
          duration: result.data.secondsNeeded || 0,
          status: 'success',
          taskType: result.data.taskType || 'Unknown',
          applicationId: result.data.applicationId,
          questImageId: result.data.questImageId || discordQuestId,
          appImageId: result.data.appImageId,
          imageUrls: result.data.imageUrls || [],
          imageIds: result.data.imageIds || [],
        };

        await accountManager.addHistoryEntryForAccount(activeAccount.id, historyEntry);
        addHistoryEntry(historyEntry);
        logger.info(`Quest completed successfully: ${historyEntry.questName}`, 'IPC', {
          questId: discordQuestId,
        });
      } else {
        const failureEntry: QuestHistory = {
          id: Date.now().toString(),
          questName: 'Failed Quest',
          applicationName: 'N/A',
          timestamp: startTime,
          duration: 0,
          status: 'failure',
          taskType: 'Unknown',
        };

        await accountManager.addHistoryEntryForAccount(activeAccount.id, failureEntry);
        addHistoryEntry(failureEntry);
        logger.warn('Quest execution failed', 'IPC', { questId });
      }

      return result;
    } catch (error) {
      const formattedError = formatError(error, 'ExecuteQuestAutomation');
      logger.error(`Failed to execute quest automation: ${formattedError.message}`, 'IPC', {
        questId,
      });
      return {
        success: false,
        message: formattedError.userFriendlyMessage,
      };
    }
  });

  ipcMain.handle('open-external', async (_, url: string) => {
    try {
      if (!validateUrl(url)) {
        const error = new Error('Invalid URL provided');
        logger.warn('Invalid URL validation failed', 'IPC', { url });
        throw error;
      }

      const sanitizedUrl = sanitizeUrl(url);
      await shell.openExternal(sanitizedUrl);
      logger.info(`Opened external URL: ${sanitizedUrl}`, 'IPC');
      return true;
    } catch (error) {
      const formattedError = formatError(error, 'OpenExternal');
      logger.error(`Failed to open external URL: ${formattedError.message}`, 'IPC', { url });
      throw formattedError.originalError || new Error(formattedError.message);
    }
  });

  ipcMain.handle('get-schedules', async () => {
    return scheduler.getSchedules();
  });

  ipcMain.handle(
    'create-schedule',
    async (_, schedule: Omit<Schedule, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>) => {
      return scheduler.createSchedule(schedule);
    }
  );

  ipcMain.handle('update-schedule', async (_, scheduleId: string, updates: Partial<Schedule>) => {
    return scheduler.updateSchedule(scheduleId, updates);
  });

  ipcMain.handle('remove-schedule', async (_, scheduleId: string) => {
    return scheduler.removeSchedule(scheduleId);
  });

  ipcMain.handle('get-schedule', async (_, scheduleId: string) => {
    return scheduler.getSchedule(scheduleId);
  });
}

export type { IpcHandlerContext };


