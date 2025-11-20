import * as cron from 'node-cron';
import { Schedule } from './types';
import { store } from './store';
import { accountManager } from './account-manager';
import { DiscordInjector } from './discord-injector';

export class Scheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private discordInjector: DiscordInjector | null = null;

  setDiscordInjector(injector: DiscordInjector) {
    this.discordInjector = injector;
  }

  /**
   * Carregar e iniciar todos os agendamentos salvos
   */
  loadSchedules(): void {
    const schedules = this.getSchedules();
    schedules.forEach((schedule) => {
      if (schedule.enabled) {
        this.scheduleTask(schedule);
      }
    });
  }

  /**
   * Criar novo agendamento
   */
  createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>): Schedule {
    const newSchedule: Schedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastRun: undefined,
      nextRun: this.calculateNextRun(schedule.cronExpression),
    };

    const schedules = this.getSchedules();
    schedules.push(newSchedule);
    store.set('schedules', schedules);

    if (newSchedule.enabled) {
      this.scheduleTask(newSchedule);
    }

    return newSchedule;
  }

  /**
   * Atualizar agendamento existente
   */
  updateSchedule(scheduleId: string, updates: Partial<Schedule>): Schedule | null {
    const schedules = this.getSchedules();
    const index = schedules.findIndex((s) => s.id === scheduleId);

    if (index === -1) {
      return null;
    }

    // Parar task antiga se existir
    this.stopTask(scheduleId);

    const updatedSchedule: Schedule = {
      ...schedules[index],
      ...updates,
      id: scheduleId, // Garantir que ID não seja alterado
    };

    // Recalcular nextRun se cronExpression mudou
    if (updates.cronExpression) {
      updatedSchedule.nextRun = this.calculateNextRun(updatedSchedule.cronExpression);
    }

    schedules[index] = updatedSchedule;
    store.set('schedules', schedules);

    // Reiniciar task se estiver habilitada
    if (updatedSchedule.enabled) {
      this.scheduleTask(updatedSchedule);
    }

    return updatedSchedule;
  }

  /**
   * Remover agendamento
   */
  removeSchedule(scheduleId: string): boolean {
    this.stopTask(scheduleId);

    const schedules = this.getSchedules();
    const filtered = schedules.filter((s) => s.id !== scheduleId);

    if (filtered.length === schedules.length) {
      return false; // Schedule not found
    }

    store.set('schedules', filtered);
    return true;
  }

  /**
   * Obter todos os agendamentos
   */
  getSchedules(): Schedule[] {
    return store.get('schedules', []);
  }

  /**
   * Obter agendamento por ID
   */
  getSchedule(scheduleId: string): Schedule | null {
    const schedules = this.getSchedules();
    return schedules.find((s) => s.id === scheduleId) || null;
  }

  /**
   * Agendar uma task
   */
  private scheduleTask(schedule: Schedule): void {
    if (!cron.validate(schedule.cronExpression)) {
      console.error(`[Scheduler] Invalid cron expression: ${schedule.cronExpression}`);
      return;
    }

    // Parar task existente se houver
    this.stopTask(schedule.id);

    const task = cron.schedule(schedule.cronExpression, async () => {
      await this.executeSchedule(schedule);
    });

    this.tasks.set(schedule.id, task);
    console.log(
      `[Scheduler] Scheduled task ${schedule.id} with expression: ${schedule.cronExpression}`
    );
  }

  /**
   * Parar uma task
   */
  private stopTask(scheduleId: string): void {
    const task = this.tasks.get(scheduleId);
    if (task) {
      task.stop();
      this.tasks.delete(scheduleId);
      console.log(`[Scheduler] Stopped task ${scheduleId}`);
    }
  }

  /**
   * Executar agendamento
   */
  private async executeSchedule(schedule: Schedule): Promise<void> {
    console.log(`[Scheduler] Executing schedule: ${schedule.name}`);

    if (!this.discordInjector) {
      console.error('[Scheduler] Discord injector not available');
      return;
    }

    try {
      // Alternar conta se especificada
      if (schedule.accountId) {
        await accountManager.switchAccount(schedule.accountId);
      }

      // Executar quest automation
      const result = await this.discordInjector.injectCode(schedule.questId);

      // Atualizar lastRun
      const schedules = this.getSchedules();
      const index = schedules.findIndex((s) => s.id === schedule.id);
      if (index !== -1) {
        schedules[index].lastRun = Date.now();
        schedules[index].nextRun = this.calculateNextRun(schedule.cronExpression);
        store.set('schedules', schedules);
      }

      console.log(
        `[Scheduler] Schedule ${schedule.name} executed:`,
        result.success ? 'Success' : 'Failed'
      );
    } catch (error) {
      console.error(`[Scheduler] Error executing schedule ${schedule.name}:`, error);
    }
  }

  /**
   * Calcular próximo horário de execução
   */
  private calculateNextRun(_cronExpression: string): number | undefined {
    // Esta é uma implementação simplificada
    // Para uma implementação completa, usar uma biblioteca como 'cron-parser'
    // Por enquanto, retornamos undefined e deixamos o cálculo para o frontend
    return undefined;
  }

  /**
   * Parar todos os agendamentos
   */
  stopAll(): void {
    this.tasks.forEach((task) => {
      task.stop();
    });
    this.tasks.clear();
    console.log('[Scheduler] All tasks stopped');
  }
}

export const scheduler = new Scheduler();
