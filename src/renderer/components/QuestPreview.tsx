import React from 'react';
import { Play, Clock, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { QuestData } from './QuestCard';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';

interface QuestPreviewProps {
  quest: QuestData | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (quest: QuestData) => void;
  isExecuting?: boolean;
}

const QuestPreview: React.FC<QuestPreviewProps> = ({
  quest,
  isOpen,
  onClose,
  onExecute,
  isExecuting = false,
}) => {
  const { t } = useTranslation();

  if (!quest) return null;

  const progress = quest.secondsNeeded > 0 
    ? Math.min((quest.secondsDone / quest.secondsNeeded) * 100, 100)
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      WATCH_VIDEO: t('quests.watchVideo'),
      PLAY_ON_DESKTOP: t('quests.playDesktop'),
      STREAM_ON_DESKTOP: t('quests.streamDesktop'),
      PLAY_ACTIVITY: t('quests.playActivity'),
      WATCH_VIDEO_ON_MOBILE: t('quests.watchMobile'),
    };
    return labels[type] || type;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={quest.questName}>
      <div className="space-y-6">
        {/* Quest Image */}
        {quest.imageUrl && (
          <div className="relative w-full h-64 rounded-xl overflow-hidden">
            <img
              src={quest.imageUrl}
              alt={quest.questName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-bold text-white mb-2">{quest.questName}</h3>
              <p className="text-gray-300">{quest.applicationName}</p>
            </div>
          </div>
        )}

        {/* Quest Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target size={18} className="text-purple-500" />
              <span className="text-sm text-gray-400">{t('quests.taskType')}</span>
            </div>
            <p className="text-white font-semibold">{getTaskTypeLabel(quest.taskType)}</p>
          </div>

          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={18} className="text-cyan-500" />
              <span className="text-sm text-gray-400">{t('quests.estimatedTime')}</span>
            </div>
            <p className="text-white font-semibold">{formatTime(quest.secondsNeeded)}</p>
          </div>
        </div>

        {/* Progress */}
        {quest.status === 'active' && (
          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t('quests.progress')}</span>
              <span className="text-sm text-white font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{formatTime(quest.secondsDone)}</span>
              <span>{formatTime(quest.secondsNeeded)}</span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          {quest.status === 'completed' && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
              <CheckCircle2 size={18} className="text-green-500" />
              <span className="text-green-400 font-semibold">{t('quests.questCompleted')}</span>
            </div>
          )}
          {quest.status === 'active' && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full">
              <Play size={18} className="text-purple-400" />
              <span className="text-purple-400 font-semibold">{t('quests.questActive')}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onExecute && quest.status !== 'completed' && (
          <button
            onClick={() => onExecute(quest)}
            disabled={isExecuting}
            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center space-x-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{t('dashboard.executing')}</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>{t('quests.executeNow')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default QuestPreview;

