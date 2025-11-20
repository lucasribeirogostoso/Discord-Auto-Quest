export interface QuestHistory {
  id: string; // Discord quest ID (real ID from Discord)
  questName: string;
  applicationName: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'failure';
  taskType: string;
  applicationId?: string;
  questImageId?: string; // Same as id (Discord quest ID)
  appImageId?: string;
  imageUrls?: string[];
  imageIds?: string[];
}

export interface AppSettings {
  language: 'pt-BR' | 'en';
  autoExecute: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
  firstRun: boolean;
  accentColor?: string; // Cor personalizada do usuário (hex)
  highContrast?: boolean; // Tema high contrast preto
  forceInjectionMode?: boolean; // Forçar uso de injeção de código (sempre usa conta logada no Discord)
}

export interface Stats {
  totalCompleted: number;
  totalTimeSaved: number;
  successRate: number;
  lastQuestCompleted: string | null;
}

export interface DiscordProcess {
  pid: number;
  name: string;
  path: string;
}

export interface LogMessage {
  timestamp: number;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
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
  id: string; // UUID único
  userId: string; // Discord User ID
  username: string;
  displayName: string;
  globalName?: string;
  avatarUrl: string | null;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  encryptedToken?: string; // Token de autenticação encriptado
}

export interface AccountData {
  accountId: string;
  history: QuestHistory[];
  stats: Stats;
  settings: Partial<AppSettings>;
}

export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  cronExpression: string; // Cron expression (e.g., "0 */6 * * *" for every 6 hours)
  questId?: string; // Optional: specific quest ID, undefined = all quests
  accountId?: string; // Optional: specific account, undefined = active account
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
}