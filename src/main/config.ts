/**
 * Configurações centralizadas da aplicação
 */

export const isDev = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Configurações do ambiente
 */
export const envConfig = {
  isDev,
  isProduction,
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * Configurações de feature flags
 */
export const featureFlags = {
  enableVerboseLogging: isDev,
  enableFileLogging: isProduction,
  enableErrorReporting: false,
  enablePerformanceMonitoring: isDev,
};

/**
 * Configurações de segurança
 */
export const securityConfig = {
  maxUrlLength: 2048,
  allowedUrlProtocols: ['http:', 'https:'],
  maxQuestIdLength: 50,
  maxAccountIdLength: 100,
};

/**
 * Configurações de performance
 */
export const performanceConfig = {
  maxConcurrentOperations: 5,
  debounceDelay: 300,
  throttleDelay: 1000,
};

/**
 * Configurações de janela
 */
export const windowConfig = {
  defaultWidth: 1400,
  defaultHeight: 900,
  minWidth: 1000,
  minHeight: 700,
  backgroundColor: '#1E2124',
};
