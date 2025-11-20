/**
 * Utilitário centralizado para tratamento de erros
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  IPC = 'IPC',
  DISCORD = 'DISCORD',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

export interface FormattedError {
  message: string;
  category: ErrorCategory;
  userFriendlyMessage: string;
  originalError?: Error;
}

/**
 * Categoriza um erro baseado em sua mensagem ou tipo
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) {
    return ErrorCategory.UNKNOWN;
  }

  const errorMessage = error instanceof Error ? error.message : String(error).toLowerCase();
  const errorString = errorMessage.toLowerCase();

  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection')
  ) {
    return ErrorCategory.NETWORK;
  }

  if (
    errorString.includes('validation') ||
    errorString.includes('invalid') ||
    errorString.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }

  if (errorString.includes('ipc') || errorString.includes('invoke')) {
    return ErrorCategory.IPC;
  }

  if (
    errorString.includes('discord') ||
    errorString.includes('quest') ||
    errorString.includes('inject')
  ) {
    return ErrorCategory.DISCORD;
  }

  if (
    errorString.includes('storage') ||
    errorString.includes('file') ||
    errorString.includes('write')
  ) {
    return ErrorCategory.STORAGE;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Cria uma mensagem amigável ao usuário baseada na categoria do erro
 */
export function getUserFriendlyMessage(error: unknown, category: ErrorCategory): string {
  const defaultMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Erro de conexão. Verifique sua conexão com a internet e tente novamente.';
    case ErrorCategory.VALIDATION:
      return 'Dados inválidos fornecidos. Por favor, verifique os dados e tente novamente.';
    case ErrorCategory.IPC:
      return 'Erro de comunicação interno. Tente reiniciar o aplicativo.';
    case ErrorCategory.DISCORD:
      return 'Erro ao comunicar com o Discord. Certifique-se de que o Discord está rodando e conectado.';
    case ErrorCategory.STORAGE:
      return 'Erro ao salvar dados. Verifique as permissões do aplicativo.';
    case ErrorCategory.UNKNOWN:
    default:
      return error instanceof Error ? error.message || defaultMessage : defaultMessage;
  }
}

/**
 * Formata um erro para exibição e logging
 */
export function formatError(error: unknown, context?: string): FormattedError {
  const category = categorizeError(error);
  const originalError = error instanceof Error ? error : new Error(String(error));
  const userFriendlyMessage = getUserFriendlyMessage(error, category);

  let message = originalError.message;
  if (context) {
    message = `[${context}] ${message}`;
  }

  return {
    message,
    category,
    userFriendlyMessage,
    originalError: originalError.message ? originalError : undefined,
  };
}

/**
 * Wrapper para funções assíncronas com tratamento de erro automático
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const formattedError = formatError(error, context);
    console.error(`[ErrorHandler] ${formattedError.message}`, {
      category: formattedError.category,
      context,
      error: formattedError.originalError,
    });
    return fallback;
  }
}
