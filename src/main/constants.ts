/**
 * Constantes da aplicação
 */

// Portas
export const WEBSOCKET_PORT = 8765;
export const DISCORD_DEBUG_PORT = 9222;

// Timeouts e Delays (em milissegundos)
export const DISCORD_DETECTION_DELAY = 3000;
export const AUTO_EXECUTE_DELAY = 2000;
export const INJECTION_TIMEOUT = 30000;
export const QUEST_PROGRESS_INTERVAL = 3000;
export const WINDOW_FOCUS_DELAY = 500;

// Limites
export const MAX_HISTORY_ENTRIES = 100;
export const MAX_LOG_ENTRIES = 500;
export const MAX_PROCESS_CHECK_TRIES = 120;
export const PROCESS_CHECK_INTERVAL = 500;
export const DUPLICATE_QUEST_WINDOW = 5 * 60 * 1000; // 5 minutos

// Intervalos de Polling
export const DISCORD_STATUS_POLL_INTERVAL = 5000;
export const QUEST_UPDATE_POLL_INTERVAL = 3000;

// Configurações de Retry
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;

// Configurações de Cache
export const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Quest IDs Especiais
export const IGNORED_QUEST_IDS = ['1412491570820812933'];

// Configurações de UI
export const STATS_ANIMATION_DURATION = 2000;
export const STATS_ANIMATION_STEPS = 60;
