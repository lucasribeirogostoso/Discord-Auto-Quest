const DISCORD_API_BASE = 'https://discord.com/api/v9';

interface DiscordAPIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

export class DiscordAPIClient {
  constructor(private token: string) {}

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<DiscordAPIResponse<T>> {
    try {
      const url = `${DISCORD_API_BASE}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Origin: 'https://discord.com',
          Referer: 'https://discord.com/',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      // Tentar parsear JSON, mas aceitar outros tipos também
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text || null;
        }
      }

      if (!response.ok) {
        return {
          success: false,
          message: data?.message || data?.error || `HTTP ${response.status}`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Network error',
      };
    }
  }

  /**
   * Obter informações do usuário atual
   */
  async getUserInfo(): Promise<DiscordAPIResponse<any>> {
    return this.request('GET', '/users/@me');
  }

  /**
   * Obter todas as quests disponíveis
   * Nota: O Discord pode não expor endpoint público de quests
   * Este método tenta buscar, mas pode falhar e precisar usar injeção como fallback
   */
  async getAllQuests(): Promise<DiscordAPIResponse<any[]>> {
    try {
      // Tentar diferentes endpoints possíveis
      const endpoints = ['/quests', '/users/@me/quests', '/activities/quests'];

      for (const endpoint of endpoints) {
        const result = await this.request<any>('GET', endpoint);
        if (result.success && result.data) {
          // Verificar se é um array ou objeto com array
          if (Array.isArray(result.data)) {
            return { success: true, data: result.data };
          }
          if (result.data.quests && Array.isArray(result.data.quests)) {
            return { success: true, data: result.data.quests };
          }
          if (result.data.data && Array.isArray(result.data.data)) {
            return { success: true, data: result.data.data };
          }
        }
      }

      return { success: false, message: 'Quests endpoint not found or not accessible' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to fetch quests' };
    }
  }

  /**
   * Inscrever-se em uma quest
   */
  async enrollQuest(questId: string): Promise<DiscordAPIResponse<any>> {
    return this.request('POST', `/quests/${questId}/enroll`, {});
  }

  /**
   * Atualizar progresso de vídeo
   */
  async updateVideoProgress(questId: string, timestamp: number): Promise<DiscordAPIResponse<any>> {
    return this.request('POST', `/quests/${questId}/video-progress`, { timestamp });
  }

  /**
   * Enviar heartbeat para PLAY_ACTIVITY
   */
  async sendHeartbeat(
    questId: string,
    streamKey: string,
    terminal: boolean
  ): Promise<DiscordAPIResponse<any>> {
    return this.request('POST', `/quests/${questId}/heartbeat`, {
      stream_key: streamKey,
      terminal,
    });
  }

  /**
   * Obter detalhes de uma quest específica
   */
  async getQuestDetails(questId: string): Promise<DiscordAPIResponse<any>> {
    return this.request('GET', `/quests/${questId}`);
  }
}
