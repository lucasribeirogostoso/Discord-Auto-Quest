import CDP, { Client } from 'chrome-remote-interface';
import { DISCORD_DEBUG_PORT } from './discord-controller';

const EXTRACT_TOKEN_CODE = `
(async function() {
  try {
    delete window.$;

    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    // Método 1: Tentar extrair do módulo de autenticação
    const AuthModule = Object.values(wpRequire.c).find(x => {
      if (!x?.exports) return false;
      const exports = x.exports;
      // Procurar por métodos de token conhecidos
      if (typeof exports.getToken === 'function') return true;
      if (exports.token) return true;
      if (exports.default?.token) return true;
      if (Object.keys(exports).some(k => k.toLowerCase().includes('token'))) return true;
      return false;
    });

    if (AuthModule?.exports) {
      const exports = AuthModule.exports;
      // Tentar diferentes métodos
      if (typeof exports.getToken === 'function') {
        try {
          const token = exports.getToken();
          if (token && typeof token === 'string') {
            return { success: true, token };
          }
        } catch (e) {
          // Ignorar erro
        }
      }
      if (exports.token && typeof exports.token === 'string') {
        return { success: true, token: exports.token };
      }
      if (exports.default?.token && typeof exports.default.token === 'string') {
        return { success: true, token: exports.default.token };
      }
    }

    // Método 2: Tentar extrair via módulo de API (mais confiável)
    const APIModule = Object.values(wpRequire.c).find(x => 
      x?.exports?.tn || x?.exports?.default?.request || x?.exports?.request
    );
    
    if (APIModule?.exports?.tn) {
      const api = APIModule.exports.tn;
      // Tentar acessar headers internos do axios/fetch
      if (api.request?.defaults?.headers) {
        const authHeader = api.request.defaults.headers.Authorization || 
                          api.request.defaults.headers.authorization;
        if (authHeader && typeof authHeader === 'string') {
          // Token pode vir com "Bearer " prefix
          const token = authHeader.replace(/^Bearer\\s+/i, '');
          if (token) return { success: true, token };
        }
      }
      
      // Tentar interceptar próxima requisição
      if (api.request && typeof api.request === 'function') {
        const originalRequest = api.request;
        let capturedToken = null;
        
        // Interceptar uma requisição para capturar token
        api.request = function(...args) {
          if (args[0]?.headers?.Authorization || args[0]?.headers?.authorization) {
            const authHeader = args[0].headers.Authorization || args[0].headers.authorization;
            capturedToken = authHeader.replace(/^Bearer\\s+/i, '');
          }
          return originalRequest.apply(this, args);
        };
        
        // Fazer uma requisição de teste
        try {
          await api.get({url: '/users/@me'});
        } catch (e) {
          // Ignorar erro, só queremos capturar o token
        }
        
        // Restaurar função original
        api.request = originalRequest;
        
        if (capturedToken) {
          return { success: true, token: capturedToken };
        }
      }
    }

    // Método 3: Tentar extrair do localStorage via iframe (pode não funcionar por CORS)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (iframe.contentWindow?.localStorage) {
        const token = iframe.contentWindow.localStorage.token?.replace(/"/g, '') ||
                     iframe.contentWindow.localStorage.getItem('token')?.replace(/"/g, '');
        document.body.removeChild(iframe);
        if (token && token.length > 50) {
          return { success: true, token };
        }
      }
      document.body.removeChild(iframe);
    } catch (e) {
      // Ignorar erros de CORS
    }

    // Método 4: Tentar via módulo de conexão WebSocket
    const ConnectionModule = Object.values(wpRequire.c).find(x => {
      const exports = x?.exports;
      return exports?.token || exports?.getToken || 
             (typeof exports === 'object' && exports !== null && 'token' in exports);
    });

    if (ConnectionModule?.exports) {
      const exports = ConnectionModule.exports;
      if (exports.token && typeof exports.token === 'string') {
        return { success: true, token: exports.token };
      }
      if (typeof exports.getToken === 'function') {
        try {
          const token = exports.getToken();
          if (token && typeof token === 'string') {
            return { success: true, token };
          }
        } catch (e) {
          // Ignorar
        }
      }
    }

    return { success: false, message: 'Token not found - tried all methods' };
  } catch (error) {
    return { success: false, message: error?.message || 'Unknown error during token extraction' };
  }
})();
`;

export async function extractDiscordToken(): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> {
  let client: Client | null = null;
  try {
    client = await CDP({ port: DISCORD_DEBUG_PORT });
    const { Runtime, Page } = client;

    await Page.enable();
    await Runtime.enable();

    // Aguardar um pouco para garantir que o Discord carregou
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await Runtime.evaluate({
      expression: EXTRACT_TOKEN_CODE,
      returnByValue: true,
      awaitPromise: true,
    });

    if (result.result?.value) {
      return result.result.value;
    }

    return { success: false, message: 'No result from token extraction' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to extract token' };
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignorar erro ao fechar
      }
    }
  }
}
