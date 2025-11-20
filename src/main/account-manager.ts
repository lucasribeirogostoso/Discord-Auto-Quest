import { randomUUID } from 'crypto';
import { Account, AccountData, UserData, QuestHistory, Stats } from './types';
import { store } from './store';
import { encryptToken, decryptToken } from './crypto-utils';

const defaultStats: Stats = {
  totalCompleted: 0,
  totalTimeSaved: 0,
  successRate: 100,
  lastQuestCompleted: null,
};

export class AccountManager {
  /**
   * Detectar conta atual do Discord baseado no userData
   */
  async detectCurrentAccount(): Promise<Account | null> {
    const userData = store.get('userData', null);
    if (!userData) {
      return null;
    }

    const accounts = store.get('accounts', []);
    const existingAccount = accounts.find((acc) => acc.userId === userData.id);

    if (existingAccount) {
      // Atualizar lastUsed e dados se necessário
      const updatedAccount = {
        ...existingAccount,
        lastUsed: Date.now(),
        displayName: userData.displayName,
        globalName: userData.globalName,
        avatarUrl: userData.avatarUrl,
      };
      await this.updateAccount(updatedAccount);
      return updatedAccount;
    }

    // Criar nova conta se não existir
    return await this.createAccount(userData);
  }

  /**
   * Criar nova conta a partir de UserData
   */
  async createAccount(userData: UserData): Promise<Account> {
    const accountId = randomUUID();
    const now = Date.now();

    const newAccount: Account = {
      id: accountId,
      userId: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      globalName: userData.globalName,
      avatarUrl: userData.avatarUrl,
      createdAt: now,
      lastUsed: now,
      isActive: false,
    };

    const accounts = store.get('accounts', []);

    // Se for a primeira conta, torná-la ativa
    if (accounts.length === 0) {
      newAccount.isActive = true;
      store.set('currentAccountId', accountId);
    }

    accounts.push(newAccount);
    store.set('accounts', accounts);

    // Inicializar dados da conta
    await this.initializeAccountData(accountId);

    // Migrar dados legados se for a primeira conta
    if (accounts.length === 1) {
      await this.migrateLegacyData(accountId);
    }

    return newAccount;
  }

  /**
   * Inicializar dados vazios para uma conta
   */
  private async initializeAccountData(accountId: string): Promise<void> {
    const accountData: AccountData = {
      accountId,
      history: [],
      stats: { ...defaultStats },
      settings: {},
    };

    const allAccountData = store.get('accountData', {});
    allAccountData[accountId] = accountData;
    store.set('accountData', allAccountData);
  }

  /**
   * Salvar token encriptado para uma conta
   */
  async saveTokenForAccount(accountId: string, token: string): Promise<void> {
    const accounts = store.get('accounts', []);
    const accountIndex = accounts.findIndex((acc) => acc.id === accountId);

    if (accountIndex !== -1) {
      accounts[accountIndex].encryptedToken = encryptToken(token);
      store.set('accounts', accounts);
    } else {
      throw new Error(`Account ${accountId} not found`);
    }
  }

  /**
   * Obter token descriptografado para uma conta
   */
  getTokenForAccount(accountId: string): string | null {
    const accounts = store.get('accounts', []);
    const account = accounts.find((acc) => acc.id === accountId);

    if (account?.encryptedToken) {
      try {
        return decryptToken(account.encryptedToken);
      } catch (error) {
        console.error(`Failed to decrypt token for account ${accountId}:`, error);
        return null;
      }
    }

    return null;
  }

  /**
   * Verificar se uma conta tem token salvo
   */
  hasTokenForAccount(accountId: string): boolean {
    const accounts = store.get('accounts', []);
    const account = accounts.find((acc) => acc.id === accountId);
    return !!account?.encryptedToken;
  }

  /**
   * Remover token de uma conta
   */
  async removeTokenForAccount(accountId: string): Promise<void> {
    const accounts = store.get('accounts', []);
    const accountIndex = accounts.findIndex((acc) => acc.id === accountId);

    if (accountIndex !== -1) {
      delete accounts[accountIndex].encryptedToken;
      store.set('accounts', accounts);
    }
  }

  /**
   * Migrar dados legados para a primeira conta
   */
  private async migrateLegacyData(accountId: string): Promise<void> {
    const legacyHistory = store.get('history', []);
    const legacyStats = store.get('stats', defaultStats);

    if (legacyHistory.length > 0 || legacyStats.totalCompleted > 0) {
      const accountData = await this.getAccountData(accountId);
      accountData.history = legacyHistory;
      accountData.stats = legacyStats;
      await this.saveAccountData(accountId, accountData);
    }
  }

  /**
   * Alternar conta ativa
   */
  async switchAccount(accountId: string): Promise<void> {
    const accounts = store.get('accounts', []);
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) {
      throw new Error(`Account with id ${accountId} not found`);
    }

    // Desativar todas as contas
    accounts.forEach((acc) => {
      acc.isActive = false;
    });

    // Ativar conta selecionada
    account.isActive = true;
    account.lastUsed = Date.now();

    store.set('accounts', accounts);
    store.set('currentAccountId', accountId);
  }

  /**
   * Remover conta
   */
  async removeAccount(accountId: string): Promise<void> {
    const accounts = store.get('accounts', []);
    const filteredAccounts = accounts.filter((acc) => acc.id !== accountId);

    if (filteredAccounts.length === accounts.length) {
      throw new Error(`Account with id ${accountId} not found`);
    }

    // Se a conta removida era a ativa, ativar a primeira disponível
    const currentAccountId = store.get('currentAccountId', null);
    if (currentAccountId === accountId) {
      if (filteredAccounts.length > 0) {
        await this.switchAccount(filteredAccounts[0].id);
      } else {
        store.set('currentAccountId', null);
      }
    }

    store.set('accounts', filteredAccounts);

    // Remover dados da conta
    const allAccountData = store.get('accountData', {});
    delete allAccountData[accountId];
    store.set('accountData', allAccountData);
  }

  /**
   * Obter dados isolados da conta
   */
  async getAccountData(accountId: string): Promise<AccountData> {
    const allAccountData = store.get('accountData', {});
    const accountData = allAccountData[accountId];

    if (!accountData) {
      // Inicializar se não existir
      await this.initializeAccountData(accountId);
      return await this.getAccountData(accountId);
    }

    return { ...accountData };
  }

  /**
   * Salvar dados da conta
   */
  async saveAccountData(accountId: string, data: Partial<AccountData>): Promise<void> {
    const currentData = await this.getAccountData(accountId);
    const updatedData: AccountData = {
      ...currentData,
      ...data,
      accountId, // Garantir que accountId não seja sobrescrito
    };

    const allAccountData = store.get('accountData', {});
    allAccountData[accountId] = updatedData;
    store.set('accountData', allAccountData);
  }

  /**
   * Listar todas as contas
   */
  async getAllAccounts(): Promise<Account[]> {
    return store.get('accounts', []);
  }

  /**
   * Obter conta ativa
   */
  async getActiveAccount(): Promise<Account | null> {
    const currentAccountId = store.get('currentAccountId', null);
    if (!currentAccountId) {
      return null;
    }

    const accounts = store.get('accounts', []);
    return accounts.find((acc) => acc.id === currentAccountId) || null;
  }

  /**
   * Atualizar conta existente
   */
  async updateAccount(updatedAccount: Account): Promise<void> {
    const accounts = store.get('accounts', []);
    const index = accounts.findIndex((acc) => acc.id === updatedAccount.id);

    if (index === -1) {
      throw new Error(`Account with id ${updatedAccount.id} not found`);
    }

    accounts[index] = updatedAccount;
    store.set('accounts', accounts);
  }

  /**
   * Adicionar entrada de histórico para conta específica
   */
  async addHistoryEntryForAccount(accountId: string, entry: QuestHistory): Promise<void> {
    const accountData = await this.getAccountData(accountId);

    // Check for duplicates: same questId within the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = accountData.history.some((h) => {
      if (h.id === entry.id && h.timestamp > fiveMinutesAgo) {
        return true;
      }
      if (
        entry.questImageId &&
        h.questImageId === entry.questImageId &&
        h.timestamp > fiveMinutesAgo
      ) {
        return true;
      }
      return false;
    });

    if (isDuplicate) {
      return;
    }

    accountData.history.unshift(entry);

    // Keep only last 100 entries
    if (accountData.history.length > 100) {
      accountData.history.splice(100);
    }

    // Update stats
    this.updateStatsForAccount(accountId, entry);

    await this.saveAccountData(accountId, { history: accountData.history });
  }

  /**
   * Atualizar estatísticas para conta específica
   */
  private updateStatsForAccount(accountId: string, entry: QuestHistory): void {
    const accountData = this.getAccountDataSync(accountId);
    if (!accountData) return;

    const stats = accountData.stats;
    const history = accountData.history;

    stats.totalCompleted = history.filter((h) => h.status === 'success').length;
    stats.totalTimeSaved = history.reduce((sum, h) => sum + (h.duration || 0), 0);

    const totalQuests = history.length;
    const successfulQuests = history.filter((h) => h.status === 'success').length;
    stats.successRate = totalQuests > 0 ? Math.round((successfulQuests / totalQuests) * 100) : 100;

    if (entry.status === 'success') {
      stats.lastQuestCompleted = entry.questName;
    }

    this.saveAccountDataSync(accountId, { stats });
  }

  /**
   * Versão síncrona para uso interno
   */
  private getAccountDataSync(accountId: string): AccountData | null {
    const allAccountData = store.get('accountData', {});
    return allAccountData[accountId] || null;
  }

  /**
   * Versão síncrona para uso interno
   */
  private saveAccountDataSync(accountId: string, data: Partial<AccountData>): void {
    const allAccountData = store.get('accountData', {});
    const currentData = allAccountData[accountId] || {
      accountId,
      history: [],
      stats: { ...defaultStats },
      settings: {},
    };
    const updatedData = { ...currentData, ...data, accountId };
    allAccountData[accountId] = updatedData;
    store.set('accountData', allAccountData);
  }
}

export const accountManager = new AccountManager();
