import Store from 'electron-store';
import {
  QuestHistory,
  AppSettings,
  Stats,
  UserData,
  Account,
  AccountData,
  Schedule,
} from './types';
import { MAX_HISTORY_ENTRIES, DUPLICATE_QUEST_WINDOW } from './constants';

interface StoreSchema {
  settings: AppSettings;
  history: QuestHistory[]; // Legacy - manter para migração
  stats: Stats; // Legacy - manter para migração
  userData: UserData | null; // Legacy - manter para migração
  accounts: Account[];
  currentAccountId: string | null;
  accountData: { [accountId: string]: AccountData };
  schedules: Schedule[];
}

const defaultSettings: AppSettings = {
  language: 'en',
  autoExecute: false,
  notifications: true,
  theme: 'dark',
  firstRun: true,
  accentColor: '#5865F2', // Discord Blurple padrão
  highContrast: true, // High contrast ativado por padrão
  forceInjectionMode: false, // Por padrão, tenta usar API direta quando possível
};

const defaultStats: Stats = {
  totalCompleted: 0,
  totalTimeSaved: 0,
  successRate: 100,
  lastQuestCompleted: null,
};

export const store = new Store<StoreSchema>({
  defaults: {
    settings: defaultSettings,
    history: [],
    stats: defaultStats,
    userData: null,
    accounts: [],
    currentAccountId: null,
    accountData: {},
    schedules: [],
  },
});

/**
 * Obtém as configurações da aplicação
 */
export function getSettings(): AppSettings {
  return store.get('settings', defaultSettings);
}

/**
 * Atualiza as configurações da aplicação
 */
export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  store.set('settings', updated);
  return updated;
}

/**
 * Obtém o histórico de quests
 */
export function getHistory(): QuestHistory[] {
  return store.get('history', []);
}

/**
 * Adiciona uma entrada ao histórico de quests
 * Verifica duplicatas dentro da janela de tempo configurada
 */
export function addHistoryEntry(entry: QuestHistory): void {
  const history = getHistory();

  // Check for duplicates: same questId within the duplicate window
  const duplicateWindowStart = Date.now() - DUPLICATE_QUEST_WINDOW;
  const isDuplicate = history.some((h) => {
    // Check if same quest ID and within duplicate window
    if (h.id === entry.id && h.timestamp > duplicateWindowStart) {
      return true;
    }
    // Also check by questImageId if available
    if (
      entry.questImageId &&
      h.questImageId === entry.questImageId &&
      h.timestamp > duplicateWindowStart
    ) {
      return true;
    }
    return false;
  });

  if (isDuplicate) {
    // If duplicate found, don't add but update stats to reflect current state
    // This prevents counting the same quest multiple times
    return;
  }

  history.unshift(entry); // Add to beginning

  // Keep only last N entries (from constants)
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.splice(MAX_HISTORY_ENTRIES);
  }

  store.set('history', history);
  updateStatsAfterQuest(entry);
}

/**
 * Limpa todo o histórico de quests
 */
export function clearHistory(): void {
  store.set('history', []);
}

/**
 * Obtém as estatísticas da aplicação
 */
export function getStats(): Stats {
  return store.get('stats', defaultStats);
}

/**
 * Atualiza as estatísticas após uma quest ser adicionada ao histórico
 */
function updateStatsAfterQuest(entry: QuestHistory): void {
  const stats = getStats();
  const history = getHistory();

  stats.totalCompleted = history.filter((h) => h.status === 'success').length;
  stats.totalTimeSaved = history.reduce((sum, h) => sum + (h.duration || 0), 0);

  const totalQuests = history.length;
  const successfulQuests = history.filter((h) => h.status === 'success').length;
  stats.successRate = totalQuests > 0 ? Math.round((successfulQuests / totalQuests) * 100) : 100;

  if (entry.status === 'success') {
    stats.lastQuestCompleted = entry.questName;
  }

  store.set('stats', stats);
}

/**
 * Reseta as estatísticas para os valores padrão
 */
export function resetStats(): void {
  store.set('stats', defaultStats);
}

/**
 * Obtém os dados do usuário salvos
 */
export function getUserData(): UserData | null {
  return store.get('userData', null);
}

/**
 * Salva os dados do usuário
 */
export function saveUserData(userData: UserData): void {
  store.set('userData', {
    ...userData,
    lastUpdated: Date.now(),
  });
}
