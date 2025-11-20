import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { ProcessMonitor } from './process-monitor';
import { DiscordInjector } from './discord-injector';
import { DiscordWebSocketServer } from './discord-websocket';
import { getSettings } from './store';
import { accountManager } from './account-manager';
import { scheduler } from './scheduler';
import { logger } from './utils/logger';
import { formatError } from './utils/error-handler';
import { WEBSOCKET_PORT, DISCORD_DETECTION_DELAY } from './constants';
import { envConfig, windowConfig } from './config';
import { registerIpcHandlers } from './ipc/register-handlers';

let mainWindow: BrowserWindow | null = null;
let processMonitor: ProcessMonitor | null = null;
let discordInjector: DiscordInjector | null = null;
let wsServer: DiscordWebSocketServer | null = null;
let autoUpdateInterval: NodeJS.Timeout | null = null;
let autoUpdaterInitialized = false;

const AUTO_UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 6; // 6 horas

registerIpcHandlers({
  getProcessMonitor: () => processMonitor,
  getDiscordInjector: () => discordInjector,
  getWebSocketServer: () => wsServer,
});

// Garantir que apenas uma instância do app esteja rodando
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Se outra instância já estiver rodando, focar nela e sair
  app.quit();
} else {
  // Listener para quando outra instância tentar abrir
  app.on('second-instance', () => {
    // Focar na janela principal se existir
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

const resolvePath = (...segments: string[]) => path.join(...segments);

/**
 * Obtém o caminho do preload script baseado no ambiente
 */
const getPreloadPath = (): string => {
  if (envConfig.isDev) {
    return resolvePath(__dirname, '../../dist-electron/preload/index.js');
  }
  return resolvePath(__dirname, '../preload/index.js');
};

/**
 * Obtém o caminho do arquivo HTML de produção
 */
const getProductionHtmlPath = (): string => resolvePath(__dirname, '../../dist/index.html');

/**
 * Verifica se a janela principal está válida e não destruída
 */
const isWindowValid = (window: BrowserWindow | null): window is BrowserWindow => {
  return window !== null && !window.isDestroyed();
};

const sendAutoUpdateEvent = (channel: string, payload?: unknown) => {
  if (isWindowValid(mainWindow)) {
    mainWindow.webContents.send(channel, payload);
  }
};

const setupAutoUpdater = (): void => {
  if (envConfig.isDev || autoUpdaterInitialized) {
    if (envConfig.isDev) {
      logger.info('Auto-updater desativado em ambiente de desenvolvimento', 'AutoUpdater');
    }
    return;
  }

  autoUpdaterInitialized = true;
  autoUpdater.autoDownload = true;

  autoUpdater.on('checking-for-update', () => {
    logger.info('Verificando atualizações...', 'AutoUpdater');
    sendAutoUpdateEvent('auto-update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    logger.info(`Atualização disponível: ${info.version}`, 'AutoUpdater');
    sendAutoUpdateEvent('auto-update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Nenhuma atualização disponível no momento', 'AutoUpdater');
    sendAutoUpdateEvent('auto-update-not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    sendAutoUpdateEvent('auto-update-download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Atualização baixada e pronta para instalar', 'AutoUpdater');
    sendAutoUpdateEvent('auto-update-downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    const formattedError = formatError(error, 'AutoUpdater');
    logger.error(`Erro no auto-updater: ${formattedError.message}`, 'AutoUpdater');
    sendAutoUpdateEvent('auto-update-error', { message: formattedError.userFriendlyMessage });
  });

  const performAutoUpdateCheck = () => {
    autoUpdater.checkForUpdates().catch((error) => {
      const formattedError = formatError(error, 'AutoUpdaterCheck');
      logger.error(`Falha ao verificar atualizações: ${formattedError.message}`, 'AutoUpdater');
      sendAutoUpdateEvent('auto-update-error', { message: formattedError.userFriendlyMessage });
    });
  };

  // Pequena espera para garantir que a janela esteja pronta
  setTimeout(performAutoUpdateCheck, 5000);
  autoUpdateInterval = setInterval(performAutoUpdateCheck, AUTO_UPDATE_CHECK_INTERVAL);
};

/**
 * Cria a janela principal da aplicação
 */
const createWindow = (): void => {
  const preloadPath = getPreloadPath();

  mainWindow = new BrowserWindow({
    width: windowConfig.defaultWidth,
    height: windowConfig.defaultHeight,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    backgroundColor: windowConfig.backgroundColor,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (envConfig.isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    logger.info('Application started in development mode', 'Main');
  } else {
    mainWindow.loadFile(getProductionHtmlPath());
    logger.info('Application started in production mode', 'Main');
  }

  // Initialize monitors and injector
  processMonitor = new ProcessMonitor(mainWindow);
  discordInjector = new DiscordInjector(mainWindow);
  // Initialize scheduler with injector
  scheduler.setDiscordInjector(discordInjector);
  scheduler.loadSchedules();

  // Initialize WebSocket server
  try {
    wsServer = new DiscordWebSocketServer(WEBSOCKET_PORT);
    wsServer.start();
    logger.info(`WebSocket server started on port ${WEBSOCKET_PORT}`, 'Main');
  } catch (error) {
    const formattedError = formatError(error, 'WebSocket');
    logger.error(`Failed to start WebSocket server: ${formattedError.message}`, 'Main');
  }

  // Forward WebSocket messages to renderer via IPC
  if (wsServer) {
    wsServer.on('discord-message', (message) => {
      if (isWindowValid(mainWindow)) {
        mainWindow.webContents.send('websocket-message', message);
      }
    });
  }

  processMonitor.start();
  logger.info('Process monitor started', 'Main');

  // Inject WebSocket client into Discord when it's detected
  processMonitor.on('discord-detected', async () => {
    logger.info('Discord detected, waiting before injection', 'Main');
    // Wait a bit for Discord to be ready
    setTimeout(async () => {
      if (discordInjector) {
        try {
          await discordInjector.injectWebSocket();
          logger.info('WebSocket client injected into Discord', 'Main');
        } catch (error) {
          const formattedError = formatError(error, 'DiscordInjection');
          logger.error(`Failed to inject WebSocket: ${formattedError.message}`, 'Main');
        }
      }
    }, DISCORD_DETECTION_DELAY);
  });

  mainWindow.on('closed', () => {
    if (processMonitor) {
      processMonitor.stop();
    }
    if (discordInjector) {
      discordInjector.cleanup();
    }
    if (wsServer) {
      wsServer.stop();
      wsServer = null;
    }
    mainWindow = null;
  });

  // Open links in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  setupAutoUpdater();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Verificar se há janelas abertas e focar a principal
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// IPC Handler para inicialização do sistema com progresso
ipcMain.handle('initialize-system', async () => {
  const sendProgress = (
    stepIndex: number,
    stepName: string,
    progress: number,
    status: 'loading' | 'complete' | 'error' = 'loading'
  ) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('system-init-progress', {
        stepIndex,
        stepName,
        progress,
        status,
      });
    }
  };

  try {
    // Step 1: Storage já está inicializado (store.ts)
    sendProgress(0, 'Inicializando armazenamento...', 10, 'loading');
    // Storage já está inicializado no início do app, apenas verificamos
    await new Promise((resolve) => setTimeout(resolve, 50));
    sendProgress(0, 'Inicializando armazenamento...', 14, 'complete');

    // Step 2: Carregar configurações
    sendProgress(1, 'Carregando configurações...', 20, 'loading');
    getSettings(); // Configurações já carregadas, apenas verificamos

    await new Promise((resolve) => setTimeout(resolve, 50));
    sendProgress(1, 'Carregando configurações...', 28, 'complete');

    // Step 3: Verificar contas
    sendProgress(2, 'Verificando contas...', 30, 'loading');
    const accounts = await accountManager.getAllAccounts();
    await new Promise((resolve) => setTimeout(resolve, 50));
    sendProgress(2, 'Verificando contas...', 40, 'complete');

    // Step 4: Verificar Discord Injector
    sendProgress(3, 'Inicializando Discord Injector...', 50, 'loading');
    // Discord Injector geralmente já está inicializado no createWindow
    // Se não existe e temos mainWindow, tentar criar
    let injectorReady = discordInjector !== null;
    if (!injectorReady && mainWindow) {
      try {
        discordInjector = new DiscordInjector(mainWindow);
        scheduler.setDiscordInjector(discordInjector);
        injectorReady = true;
      } catch (error: unknown) {
        const formattedError = formatError(error, 'InitializeDiscordInjector');
        logger.error(`Failed to create Discord Injector: ${formattedError.message}`, 'Main');
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    sendProgress(3, 'Inicializando Discord Injector...', 60, injectorReady ? 'complete' : 'error');

    // Step 5: Verificar WebSocket Server
    sendProgress(4, 'Inicializando WebSocket Server...', 70, 'loading');
    // WebSocket Server geralmente já está inicializado no createWindow
    let wsReady = wsServer !== null && wsServer.isServerRunning();
    if (!wsReady) {
      // Se não está rodando, tentar iniciar
      if (!wsServer) {
        try {
          wsServer = new DiscordWebSocketServer(8765);
        } catch (error: unknown) {
          const formattedError = formatError(error, 'InitializeWebSocketServer');
          logger.error(`Failed to create WebSocket Server: ${formattedError.message}`, 'Main');
        }
      }
      if (wsServer && !wsServer.isServerRunning()) {
        try {
          wsServer.start();
          // Aguardar um pouco para o servidor iniciar
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error: unknown) {
          const formattedError = formatError(error, 'StartWebSocketServer');
          logger.error(`Failed to start WebSocket Server: ${formattedError.message}`, 'Main');
        }
      }
      wsReady = wsServer !== null && wsServer.isServerRunning();

      // Forward WebSocket messages to renderer via IPC (só se ainda não estiver configurado)
      if (wsServer && !wsServer.listenerCount('discord-message')) {
        wsServer.on('discord-message', (message) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('websocket-message', message);
          }
        });
      }
    }
    sendProgress(4, 'Inicializando WebSocket Server...', 85, wsReady ? 'complete' : 'error');

    // Step 6: Verificar processo do Discord
    sendProgress(5, 'Verificando processo do Discord...', 90, 'loading');
    // Process Monitor geralmente já está inicializado no createWindow
    if (!processMonitor && mainWindow) {
      try {
        processMonitor = new ProcessMonitor(mainWindow);
        processMonitor.start();

        // Inject WebSocket client into Discord when it's detected (só se ainda não estiver configurado)
        if (!processMonitor.listenerCount('discord-detected')) {
          processMonitor.on('discord-detected', async () => {
            setTimeout(async () => {
              if (discordInjector) {
                try {
                  await discordInjector.injectWebSocket();
                  logger.info('WebSocket client injected into Discord', 'Main');
                } catch (error) {
                  const formattedError = formatError(error, 'DiscordWebSocketInjection');
                  logger.error(`Failed to inject WebSocket: ${formattedError.message}`, 'Main');
                }
              }
            }, DISCORD_DETECTION_DELAY);
          });
        }
      } catch (error: unknown) {
        const formattedError = formatError(error, 'InitializeProcessMonitor');
        logger.error(`Failed to create Process Monitor: ${formattedError.message}`, 'Main');
      }
    }
    const discordRunning = processMonitor ? processMonitor.isDiscordRunning() : false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    sendProgress(5, 'Verificando processo do Discord...', 95, 'complete');

    // Step 7: Concluir
    sendProgress(6, 'Sistema pronto!', 100, 'complete');
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
      initialized: true,
      modules: {
        storage: true,
        settings: true,
        accounts: accounts.length,
        discordInjector: discordInjector !== null,
        websocketServer: wsReady,
        discordDetected: discordRunning,
      },
    };
  } catch (error: unknown) {
    const formattedError = formatError(error, 'InitializeSystem');
    logger.error(`Failed to initialize system: ${formattedError.message}`, 'Main');
    sendProgress(6, 'Erro ao inicializar sistema', 100, 'error');
    return {
      success: false,
      initialized: false,
      error: formattedError.message,
    };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
});

// Demais handlers IPC são registrados via registerIpcHandlers em ./ipc/register-handlers.

// Export for testing
export { mainWindow };
