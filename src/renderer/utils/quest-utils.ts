/**
 * Utilitários para lógica de quests no renderer
 */

import { Quest, QuestProgressData } from '../../types/quest';

/**
 * Encontra uma quest pelo ID usando múltiplos campos possíveis
 */
export function findQuestById(quests: Quest[], questId: string): Quest | undefined {
  return quests.find((q) => {
    const qId = q.questId || q.questImageId || (q as any).id;
    return qId === questId || qId?.toString() === questId?.toString();
  });
}

/**
 * Calcula o progresso percentual de uma quest
 */
export function calculateQuestProgress(quest: Quest): number {
  if (quest.secondsNeeded === 0) {
    return 100;
  }
  return Math.min(100, Math.round((quest.secondsDone / quest.secondsNeeded) * 100));
}

/**
 * Verifica se uma quest está completa
 */
export function isQuestComplete(quest: Quest): boolean {
  return quest.isCompleted || quest.secondsDone >= quest.secondsNeeded;
}

/**
 * Calcula o tempo restante estimado para completar uma quest
 */
export function calculateTimeRemaining(progress: QuestProgressData): number {
  const now = Date.now();
  if (progress.estimatedEndTime <= now) {
    return 0;
  }
  return Math.ceil((progress.estimatedEndTime - now) / 1000); // em segundos
}

/**
 * Formata o tempo restante em uma string legível
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return 'Completo';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Filtra quests baseado em critérios
 */
export function filterQuests(
  quests: Quest[],
  filters: {
    completed?: boolean;
    enrolled?: boolean;
    searchTerm?: string;
  }
): Quest[] {
  return quests.filter((quest) => {
    if (filters.completed !== undefined && isQuestComplete(quest) !== filters.completed) {
      return false;
    }

    if (filters.enrolled !== undefined && quest.isEnrolled !== filters.enrolled) {
      return false;
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesName = quest.questName.toLowerCase().includes(term);
      const matchesApp = quest.applicationName.toLowerCase().includes(term);
      if (!matchesName && !matchesApp) {
        return false;
      }
    }

    return true;
  });
}
