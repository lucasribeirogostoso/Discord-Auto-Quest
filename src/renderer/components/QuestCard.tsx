import React from 'react';
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  Gamepad2,
  Radio,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';

export interface QuestData {
  id: string;
  questName: string;
  applicationName: string;
  applicationId: string;
  taskType: string;
  secondsNeeded: number;
  secondsDone: number;
  status?: 'active' | 'completed' | 'available' | 'failed';
  expiresAt?: number;
  imageUrl?: string | null;
  isEnrolled?: boolean;
  isCompleted?: boolean;
  questImageId?: string;
  appImageId?: string;
  imageUrls?: string[];
  imageIds?: string[];
}

interface QuestCardProps {
  quest: QuestData;
  onExecute: (quest: QuestData) => void;
  isExecuting?: boolean;
  hideExecuteButton?: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onExecute,
  isExecuting = false,
  hideExecuteButton = false,
}) => {
  const { t } = useTranslation();
  const { settings } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#5865F2';

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'WATCH_VIDEO':
      case 'WATCH_VIDEO_ON_MOBILE':
        return Video;
      case 'PLAY_ON_DESKTOP':
        return Gamepad2;
      case 'STREAM_ON_DESKTOP':
        return Radio;
      case 'PLAY_ACTIVITY':
        return Activity;
      default:
        return Sparkles;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'WATCH_VIDEO':
        return t('quests.watchVideo');
      case 'WATCH_VIDEO_ON_MOBILE':
        return t('quests.watchMobile');
      case 'PLAY_ON_DESKTOP':
        return t('quests.playDesktop');
      case 'STREAM_ON_DESKTOP':
        return t('quests.streamDesktop');
      case 'PLAY_ACTIVITY':
        return t('quests.playActivity');
      default:
        return type;
    }
  };

  const getStatusColor = (status?: string) => {
    if (isHighContrast) {
      switch (status) {
        case 'active':
          return 'border-2 border-status-online bg-hc-secondary';
        case 'completed':
          return 'border-2 border-accent bg-hc-secondary';
        case 'failed':
          return 'border-2 border-status-offline bg-hc-secondary';
        default:
          return 'border-2 border-hc bg-hc-secondary';
      }
    } else {
      switch (status) {
        case 'active':
          return 'border-green-500 bg-green-500/10';
        case 'completed':
          return 'border-blue-500 bg-blue-500/10';
        case 'failed':
          return 'border-red-500 bg-red-500/10';
        default:
          return 'border-gray-600 bg-gray-800/50';
      }
    }
  };

  const progress =
    quest.secondsNeeded > 0 ? Math.min((quest.secondsDone / quest.secondsNeeded) * 100, 100) : 0;

  const timeRemaining = Math.max(0, quest.secondsNeeded - quest.secondsDone);
  const minutesRemaining = Math.ceil(timeRemaining / 60);

  const TaskIcon = getTaskTypeIcon(quest.taskType);

  // Get all image URLs to try in order - prioritize Discord quest images from DevTools
  const getAllImageUrls = () => {
    const urls: string[] = [];

    // Priority 1: URLs from API endpoint (Method 3 - highest priority)
    if (quest.imageUrls && quest.imageUrls.length > 0) {
      urls.push(...quest.imageUrls);
    }

    // Fallback: Original imageUrl
    if (quest.imageUrl && !urls.includes(quest.imageUrl)) {
      urls.push(quest.imageUrl);
    }

    // Additional fallbacks: Build URLs using image IDs if available
    if (
      quest.appImageId &&
      quest.appImageId !== '0' &&
      quest.imageIds &&
      quest.imageIds.length > 0
    ) {
      quest.imageIds.forEach((imgId) => {
        const newUrls = [
          `https://cdn.discordapp.com/quests/${quest.appImageId}/${imgId}.jpg?format=webp&width=1320&height=370`,
          `https://cdn.discordapp.com/quests/${quest.appImageId}/${imgId}.jpg`,
          `https://cdn.discordapp.com/quests/${quest.appImageId}/${imgId}.png`,
          `https://cdn.discordapp.com/app-assets/${quest.appImageId}/${imgId}.jpg?format=webp&width=1320&height=370`,
          `https://cdn.discordapp.com/app-assets/${quest.appImageId}/${imgId}.jpg`,
          `https://cdn.discordapp.com/app-assets/${quest.appImageId}/${imgId}.png`,
        ];
        newUrls.forEach((url) => {
          if (!urls.includes(url)) {
            urls.push(url);
          }
        });
      });
    }

    // Quest ID based images (if not already included)
    if (quest.questImageId) {
      const questUrls = [
        `https://cdn.discordapp.com/quests/${quest.questImageId}/cover.png`,
        `https://cdn.discordapp.com/quests/${quest.questImageId}/cover.jpg`,
      ];
      questUrls.forEach((url) => {
        if (!urls.includes(url)) {
          urls.push(url);
        }
      });
    }

    // Steam fallback (last resort)
    if (quest.applicationId && quest.applicationId !== '0') {
      const steamUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${quest.applicationId}/header.jpg`;
      if (!urls.includes(steamUrl)) {
        urls.push(steamUrl);
      }
    }

    return urls;
  };

  const allImageUrls = getAllImageUrls();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    if (currentImageIndex < allImageUrls.length - 1) {
      // Try next image URL
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      // All images failed, show gradient
      setImageError(true);
    }
  };

  const currentImageSrc =
    !imageError && allImageUrls.length > 0 ? allImageUrls[currentImageIndex] : null;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden card-3d card-hover-glow glass-card-hover cursor-pointer ${
        isHighContrast ? getStatusColor(quest.status) : 'glass-card'
      }`}
      style={
        isHighContrast
          ? {
              boxShadow: `0 4px 6px rgba(0, 0, 0, 0.3), 0 0 0 1px ${accentColor}20`,
            }
          : {
              boxShadow:
                quest.status === 'active'
                  ? `0 8px 32px ${accentColor}30, 0 0 0 1px rgba(255,255,255,0.1)`
                  : '0 8px 32px rgba(0, 0, 0, 0.37)',
            }
      }
    >
      {/* Game Image with Modern Effects */}
      <div
        className="relative h-56 overflow-hidden"
        style={{
          backgroundImage: currentImageSrc
            ? `url(${currentImageSrc})`
            : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer" />

        {currentImageSrc && !imageError && (
          <img
            key={currentImageIndex}
            src={currentImageSrc}
            alt={quest.applicationName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
            onError={handleImageError}
          />
        )}

        {/* Modern gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Animated border glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 60px ${accentColor}30`,
          }}
        />

        {/* Modern Status Badge */}
        {quest.status === 'active' && (
          <div
            className={`absolute top-4 right-4 flex items-center space-x-2 glass-card ${
              isHighContrast ? 'border-2 border-hc' : ''
            } text-white px-4 py-2 rounded-xl text-xs font-bold glow-pulse`}
            style={
              isHighContrast
                ? { backgroundColor: 'var(--status-online)' }
                : {
                    backgroundColor: 'rgba(87, 242, 135, 0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 4px 20px rgba(87, 242, 135, 0.4)`,
                  }
            }
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span>{t('quests.questActive')}</span>
          </div>
        )}
        {quest.status === 'completed' && (
          <div
            className={`absolute top-4 right-4 glass-card ${
              isHighContrast ? 'border-2 border-hc' : ''
            } text-white px-4 py-2 rounded-xl text-xs font-bold`}
            style={
              isHighContrast
                ? { backgroundColor: accentColor }
                : {
                    backgroundColor: `${accentColor}40`,
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 4px 20px ${accentColor}40`,
                  }
            }
          >
            <CheckCircle2 size={16} className="inline mr-1.5" />
            {t('quests.questCompleted')}
          </div>
        )}
        {quest.status === 'failed' && (
          <div
            className={`absolute top-4 right-4 glass-card ${
              isHighContrast ? 'border-2 border-hc' : ''
            } text-white px-4 py-2 rounded-xl text-xs font-bold`}
            style={
              isHighContrast
                ? { backgroundColor: 'var(--status-offline)' }
                : {
                    backgroundColor: 'rgba(237, 66, 69, 0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 4px 20px rgba(237, 66, 69, 0.4)`,
                  }
            }
          >
            <XCircle size={16} className="inline mr-1.5" />
            {t('quests.questFailed')}
          </div>
        )}

        {/* Modern Task Type Badge */}
        <div
          className={`absolute bottom-4 left-4 flex items-center space-x-2 glass-card ${
            isHighContrast ? 'bg-hc-secondary border-2 border-hc' : ''
          } text-white px-4 py-2 rounded-xl text-xs font-semibold`}
          style={
            !isHighContrast
              ? {
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                }
              : {}
          }
        >
          <TaskIcon size={18} />
          <span>{getTaskTypeLabel(quest.taskType)}</span>
        </div>
      </div>

      {/* Modern Card Content */}
      <div className={`p-5 ${isHighContrast ? 'bg-hc-secondary' : 'glass-card bg-white/5'}`}>
        <h3
          className={`text-lg font-bold mb-1 line-clamp-1 ${
            isHighContrast ? 'text-hc-primary' : 'text-white'
          }`}
        >
          {quest.questName}
        </h3>
        <p
          className={`text-sm mb-3 line-clamp-1 ${
            isHighContrast ? 'text-hc-secondary' : 'text-gray-400'
          }`}
        >
          {quest.applicationName}
        </p>

        {/* Progress Bar */}
        {quest.status === 'active' && (
          <div className="mb-3">
            <div
              className={`flex items-center justify-between text-xs mb-1 ${
                isHighContrast ? 'text-hc-secondary' : 'text-gray-400'
              }`}
            >
              <span>{t('quests.progress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className={`w-full rounded-full h-2 overflow-hidden ${
                isHighContrast ? 'bg-hc-primary border border-hc' : 'bg-gray-700'
              }`}
            >
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isHighContrast ? accentColor : undefined,
                  background: isHighContrast
                    ? undefined
                    : 'linear-gradient(to right, #5865F2, #EB459E)',
                }}
              />
            </div>
          </div>
        )}

        {/* Time Info */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={`flex items-center space-x-1 text-xs ${
              isHighContrast ? 'text-hc-secondary' : 'text-gray-400'
            }`}
          >
            <Clock size={14} />
            <span>
              {minutesRemaining > 0
                ? `${minutesRemaining} ${t('quests.minutes')}`
                : `${Math.ceil(timeRemaining)} ${t('quests.seconds')}`}
            </span>
          </div>
          {quest.secondsNeeded > 0 && (
            <span className={`text-xs ${isHighContrast ? 'text-hc-secondary' : 'text-gray-500'}`}>
              {Math.floor(quest.secondsDone / 60)}/{Math.floor(quest.secondsNeeded / 60)}{' '}
              {t('quests.minutes')}
            </span>
          )}
        </div>

        {/* Modern Action Button */}
        {!hideExecuteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExecute(quest);
            }}
            disabled={isExecuting || quest.status === 'active'}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 relative overflow-hidden ${
              quest.status === 'active'
                ? isHighContrast
                  ? 'border-2 border-status-online bg-hc-secondary text-status-online cursor-not-allowed'
                  : 'glass-card bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                : isExecuting
                ? isHighContrast
                  ? 'border-2 border-hc bg-hc-secondary text-hc-secondary cursor-not-allowed'
                  : 'glass-card bg-gray-700/30 text-gray-400 cursor-not-allowed border border-gray-600/30'
                : isHighContrast
                ? 'border-2 border-hc text-white hover:shadow-lg hover:scale-105'
                : 'btn-modern text-white hover:shadow-lg hover:scale-105'
            }`}
            style={
              !isExecuting && quest.status !== 'active' && isHighContrast
                ? {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    boxShadow: `0 4px 20px ${accentColor}40`,
                  }
                : !isExecuting && quest.status !== 'active' && !isHighContrast
                ? {
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                    boxShadow: `0 4px 20px ${accentColor}40`,
                  }
                : {}
            }
          >
            {quest.status === 'active' ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>{t('quests.questActive')}</span>
              </>
            ) : isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>{t('dashboard.executing')}</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>{t('quests.executeNow')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestCard;
