/**
 * Utilitários de validação
 */

import { securityConfig } from '../config';

/**
 * Valida se uma string é um ID válido (não vazio e dentro do limite de tamanho)
 */
export function validateId(id: string | undefined | null, maxLength: number = 100): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return id.trim().length > 0 && id.length <= maxLength;
}

/**
 * Valida um Quest ID
 */
export function validateQuestId(questId: string | undefined | null): boolean {
  return validateId(questId, securityConfig.maxQuestIdLength);
}

/**
 * Valida um Account ID
 */
export function validateAccountId(accountId: string | undefined | null): boolean {
  return validateId(accountId, securityConfig.maxAccountIdLength);
}

/**
 * Valida uma URL
 */
export function validateUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  if (url.length > securityConfig.maxUrlLength) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return securityConfig.allowedUrlProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitiza uma URL removendo caracteres perigosos
 */
export function sanitizeUrl(url: string): string {
  return url.trim().replace(/[\r\n\t]/g, '');
}

/**
 * Valida um objeto de settings parcial
 */
export function validateSettings(settings: any): boolean {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // Validar tipos de propriedades conhecidas
  if ('language' in settings && !['en', 'pt-BR'].includes(settings.language)) {
    return false;
  }

  if ('theme' in settings && !['light', 'dark'].includes(settings.theme)) {
    return false;
  }

  if ('accentColor' in settings && typeof settings.accentColor === 'string') {
    if (!/^#[0-9A-Fa-f]{6}$/.test(settings.accentColor)) {
      return false;
    }
  }

  if ('autoExecute' in settings && typeof settings.autoExecute !== 'boolean') {
    return false;
  }

  if ('notifications' in settings && typeof settings.notifications !== 'boolean') {
    return false;
  }

  if ('highContrast' in settings && typeof settings.highContrast !== 'boolean') {
    return false;
  }

  if ('firstRun' in settings && typeof settings.firstRun !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Valida se uma string não contém caracteres perigosos
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
