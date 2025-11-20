// WebSocket Client Injection Code for Discord
export const WEBSOCKET_INJECTION_CODE = `
(function() {
  if (window.__discordAutoQuestWS) {
    console.log('[WebSocket] Already injected');
    return;
  }

  const WS_PORTS = [8765, 8766, 8767, 8768, 8769, 8770, 8771, 8772, 8773, 8774, 8775];
  let currentPortIndex = 0;
  
  let ws = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 10;
  let reconnectDelay = 1000;
  let reconnectTimeout = null;

  function connect() {
    if (currentPortIndex >= WS_PORTS.length) {
      console.error('[WebSocket] All ports exhausted. Resetting to first port.');
      currentPortIndex = 0;
      reconnectAttempts = 0;
      return;
    }

    const port = WS_PORTS[currentPortIndex];
    const WS_URL = \`ws://localhost:\${port}\`;
    
    try {
      console.log(\`[WebSocket] Attempting to connect to port \${port}...\`);
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log(\`[WebSocket] Connected to Discord Auto Quest on port \${port}\`);
        reconnectAttempts = 0;
        currentPortIndex = 0; // Reset para começar da primeira porta na próxima reconexão
        
        // Send initial status
        sendMessage({
          type: 'status-update',
          data: {
            connected: true,
            timestamp: Date.now()
          }
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(\`[WebSocket] Error on port \${port}:\`, error);
        // Se falhar na conexão, tentar próxima porta imediatamente
        ws.close();
      };

      ws.onclose = (event) => {
        console.log(\`[WebSocket] Disconnected from port \${port}\`);
        ws = null;
        
        // Se foi um erro de conexão (porta não disponível), tentar próxima porta
        if (event.code === 1006 || event.code === 1002) {
          currentPortIndex++;
          if (currentPortIndex < WS_PORTS.length) {
            console.log(\`[WebSocket] Trying next port...\`);
            setTimeout(() => connect(), 500);
            return;
          }
        }
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
          console.log(\`[WebSocket] Reconnecting in \${delay}ms (attempt \${reconnectAttempts})\`);
          
          reconnectTimeout = setTimeout(() => {
            currentPortIndex = 0; // Reset para começar da primeira porta
            connect();
          }, delay);
        } else {
          // Reset após esgotar tentativas
          currentPortIndex = 0;
          reconnectAttempts = 0;
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }

  function sendMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
      }
    }
  }

  function handleMessage(message) {
    switch (message.type) {
      case 'get-quests':
        // Request quests update
        if (window.__discordAutoQuestGetQuests) {
          window.__discordAutoQuestGetQuests().then(quests => {
            sendMessage({
              type: 'quest-update',
              data: { quests }
            });
          });
        }
        break;
      case 'execute-quest':
        // Execute quest
        if (window.__discordAutoQuestExecute) {
          window.__discordAutoQuestExecute(message.questId).then(result => {
            sendMessage({
              type: 'log',
              data: {
                level: result.success ? 'success' : 'error',
                message: result.message || 'Quest execution completed'
              }
            });
          });
        }
        break;
      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }

  // Monitor quests store for changes
  function setupQuestMonitor() {
    try {
      let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
      webpackChunkdiscord_app.pop();
      
      let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
      
      if (QuestsStore && QuestsStore.quests) {
        // Monitor quests changes
        const originalSet = QuestsStore.quests.set;
        if (originalSet) {
          QuestsStore.quests.set = function(...args) {
            const result = originalSet.apply(this, args);
            
            // Send quest update
            setTimeout(() => {
              const allQuests = [...QuestsStore.quests.values()];
              sendMessage({
                type: 'quest-update',
                data: { quests: allQuests }
              });
            }, 100);
            
            return result;
          };
        }
        
        console.log('[WebSocket] Quest monitor setup complete');
      }
    } catch (error) {
      console.error('[WebSocket] Error setting up quest monitor:', error);
    }
  }

  // Initialize
  connect();
  setupQuestMonitor();

  // Expose functions for manual calls
  window.__discordAutoQuestWS = {
    connect,
    sendMessage,
    isConnected: () => ws && ws.readyState === WebSocket.OPEN
  };

  console.log('[WebSocket] Injection complete');
})();
`;

