/**
 * Interfaces relacionadas a Quests do Discord
 */

export interface Quest {
  questId: string;
  questName: string;
  applicationName: string;
  applicationId?: string;
  taskType: string;
  secondsNeeded: number;
  secondsDone: number;
  expiresAt: number;
  enrolledAt?: number | null;
  isEnrolled: boolean;
  isCompleted: boolean;
  imageUrl?: string | null;
  imageUrls?: string[];
  questImageId?: string;
  appImageId?: string;
  imageIds?: string[];
}

export interface QuestResult {
  success: boolean;
  message: string;
  data?: QuestExecutionData;
  quests?: Quest[];
  warning?: string;
  accountMismatch?: boolean;
  totalQuests?: number;
  filteredQuests?: number;
  accountFilter?: string;
  source?: string;
}

export interface QuestExecutionData {
  questId?: string;
  questName?: string;
  applicationName?: string;
  applicationId?: string;
  taskType?: string;
  secondsNeeded?: number;
  secondsDone?: number;
  questSecondsNeeded?: number;
  questImageId?: string;
  appImageId?: string;
  imageUrls?: string[];
  imageIds?: string[];
}

export interface QuestImageData {
  id: string;
  appImageId?: string;
  applicationId?: string;
  imageIds?: string[];
}

export interface QuestProgressData {
  questId: string;
  questName: string;
  secondsNeeded: number;
  secondsDone: number;
  startTime: number;
  estimatedEndTime: number;
}

export interface QuestImageMap {
  [questId: string]: string;
}
