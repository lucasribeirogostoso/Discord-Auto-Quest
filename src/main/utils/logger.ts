/**
 * Sistema de logging estruturado
 */

import { featureFlags } from '../config';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  /**
   * Formata uma entrada de log para exibição
   */
  private formatLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${timestamp} [${entry.level}] ${context} ${entry.message}${data}`;
  }

  /**
   * Adiciona uma entrada de log
   */
  private addLog(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data,
    };

    // Manter apenas os últimos N logs em memória
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Exibir no console baseado no nível
    const formattedMessage = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
        if (featureFlags.enableVerboseLogging) {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  /**
   * Log de erro
   */
  error(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  /**
   * Obtém os logs em memória
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Limpa os logs em memória
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Instância singleton do logger
export const logger = new Logger();
