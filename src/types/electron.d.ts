/**
 * Histórico de uma quest executada
 */
export interface QuestHistory {
  /** ID único da quest (Discord quest ID) */
  id: string;
  /** Nome da quest */
  questName: string;
  /** Nome da aplicação/game relacionada */
  applicationName: string;
  /** Timestamp de quando a quest foi executada */
  timestamp: number;
  /** Duração em segundos que a quest levou para completar */
  duration: number;
  /** Status da execução */
  status: 'success' | 'failure';
  /** Tipo de tarefa da quest */
  taskType: string;
  /** ID da aplicação no Discord */
  applicationId?: string;
  /** ID da imagem da quest */
  questImageId?: string;
  /** ID da imagem da aplicação */
  appImageId?: string;
  /** URLs das imagens relacionadas */
  imageUrls?: string[];
  /** IDs das imagens para cache */
  imageIds?: string[];
}

/**
 * Configurações da aplicação
 */
export interface AppSettings {
  /** Idioma da interface */
  language: 'pt-BR' | 'en';
  /** Se deve executar automaticamente quando Discord é detectado */
  autoExecute: boolean;
  /** Se deve mostrar notificações */
  notifications: boolean;
  /** Tema da interface */
  theme: 'light' | 'dark';
  /** Se é a primeira execução */
  firstRun: boolean;
  /** Cor personalizada do usuário (formato hexadecimal) */
  accentColor?: string;
  /** Se o tema high contrast está ativado */
  highContrast?: boolean;
  /** Forçar uso de injeção de código (sempre usa conta logada no Discord) */
  forceInjectionMode?: boolean;
}

/**
 * Estatísticas da aplicação
 */
export interface Stats {
  /** Total de quests completadas com sucesso */
  totalCompleted: number;
  /** Total de tempo economizado em minutos */
  totalTimeSaved: number;
  /** Taxa de sucesso em porcentagem */
  successRate: number;
  /** Nome da última quest completada */
  lastQuestCompleted: string | null;
}

/**
 * Informações sobre o processo do Discord
 */
export interface DiscordProcess {
  /** ID do processo */
  pid: number;
  /** Nome do processo */
  name: string;
  /** Caminho do executável */
  path: string;
}

/**
 * Mensagem de log
 */
export interface LogMessage {
  /** Timestamp da mensagem */
  timestamp: number;
  /** Conteúdo da mensagem */
  message: string;
  /** Nível de severidade do log */
  level: 'info' | 'warning' | 'error' | 'success';
}

export interface DiscordUser {
  id: string | null;
  username: string;
  globalName: string;
  discriminator: string;
  avatar: string | null;
  avatarUrl: string | null;
  banner?: string | null;
  bannerUrl?: string | null;
  bannerColor?: string | null;
  displayName: string;
}

export interface UserData {
  id: string;
  username: string;
  displayName: string;
  globalName: string;
  discriminator: string;
  avatar: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  lastUpdated: number;
}

export interface Account {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  globalName?: string;
  avatarUrl: string | null;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}

export interface AccountData {
  accountId: string;
  history: QuestHistory[];
  stats: Stats;
  settings: Partial<AppSettings>;
}

export interface UpdateInfoPayload {
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | string[];
}

export interface UpdateProgressPayload {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getHistory: () => Promise<QuestHistory[]>;
  clearHistory: () => Promise<boolean>;
  getStats: () => Promise<Stats>;
  getDiscordStatus: () => Promise<{ isRunning: boolean; process: DiscordProcess | null }>;
  getAllQuests: () => Promise<{
    success: boolean;
    quests: any[];
    message?: string;
    warning?: string;
    accountMismatch?: boolean;
  }>;
  executeQuestAutomation: (
    questId?: string
  ) => Promise<{ success: boolean; message: string; data?: any }>;
  getDiscordUser: () => Promise<{ success: boolean; user: DiscordUser | null; message?: string }>;
  getSavedUser: () => Promise<UserData | null>;
  extractDiscordToken: () => Promise<{ success: boolean; token?: string; message?: string }>;
  getQuestImagesFromCache: (
    questIds: string[],
    historyData?: Array<{
      id: string;
      appImageId?: string;
      applicationId?: string;
      imageIds?: string[];
    }>
  ) => Promise<{ success: boolean; imageMap: Record<string, string>; message?: string }>;
  openExternal: (url: string) => Promise<boolean>;
  onDiscordStatusChanged: (
    callback: (data: { isRunning: boolean; process: DiscordProcess | null }) => void
  ) => () => void;
  onQuestLog: (callback: (data: LogMessage) => void) => () => void;
  sendWebSocketMessage: (message: any) => void;
  onWebSocketMessage: (callback: (data: any) => void) => () => void;
  onSystemInitProgress: (
    subscription: (progress: {
      stepIndex: number;
      stepName: string;
      progress: number;
      status: 'loading' | 'complete' | 'error';
    }) => void
  ) => () => void;
  // Account Management
  getAllAccounts: () => Promise<Account[]>;
  getActiveAccount: () => Promise<Account | null>;
  switchAccount: (accountId: string) => Promise<boolean>;
  removeAccount: (accountId: string) => Promise<boolean>;
  getAccountData: (accountId: string) => Promise<AccountData>;
  detectCurrentAccount: () => Promise<Account | null>;
  executeForAllAccounts: (questId?: string) => Promise<{ success: boolean; results: any[] }>;
  initializeSystem: () => Promise<{
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
  }>;
  checkForUpdates: () => Promise<{
    success: boolean;
    message?: string;
    updateInfo?: UpdateInfoPayload | null;
  }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: UpdateInfoPayload) => void) => () => void;
  onUpdateNotAvailable: (callback: (info: UpdateInfoPayload | null) => void) => () => void;
  onUpdateDownloadProgress: (callback: (info: UpdateProgressPayload) => void) => () => void;
  onUpdateDownloaded: (callback: (info: UpdateInfoPayload) => void) => () => void;
  onUpdateError: (callback: (info: { message?: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
