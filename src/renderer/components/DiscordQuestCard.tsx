import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { QuestData } from './QuestCard';
import { useAppStore, QuestProgress } from '../stores/appStore';

interface DiscordQuestCardProps {
  quest: QuestData;
  onExecute?: (quest: QuestData) => void;
  isExecuting?: boolean;
  hideExecuteButton?: boolean;
  isCompleted?: boolean;
  completedDate?: string;
}

const DiscordQuestCard: React.FC<DiscordQuestCardProps> = ({
  quest,
  onExecute,
  isExecuting = false,
  hideExecuteButton = false,
  isCompleted = false,
  completedDate,
}) => {
  const { settings, getQuestProgress } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#5865F2';
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Buscar progresso atualizado em tempo real
  const [activeProgress, setActiveProgress] = useState<QuestProgress | null>(
    quest.id ? getQuestProgress(quest.id) : null
  );
  
  const isInProgress = activeProgress !== null;
  
  // Atualizar progresso em tempo real a cada segundo
  useEffect(() => {
    if (!quest.id) return;
    
    // Buscar progresso inicial
    const initialProgress = getQuestProgress(quest.id);
    setActiveProgress(initialProgress);
    
    const interval = setInterval(() => {
      const latestProgress = getQuestProgress(quest.id!);
      setActiveProgress(prev => {
        // Só atualizar se o progresso mudou
        if (!latestProgress && !prev) return prev;
        if (!latestProgress) return null;
        if (!prev) return latestProgress;
        
        // Comparar valores para evitar re-renders desnecessários
        if (
          latestProgress.secondsDone !== prev.secondsDone ||
          latestProgress.secondsNeeded !== prev.secondsNeeded ||
          latestProgress.estimatedEndTime !== prev.estimatedEndTime
        ) {
          return latestProgress;
        }
        return prev;
      });
    }, 1000); // Atualizar a cada segundo para animação suave
    
    return () => clearInterval(interval);
  }, [quest.id, getQuestProgress]);

  // Get all image URLs to try in order - same logic as QuestCard
  const getAllImageUrls = () => {
    const urls: string[] = [];

    // Priority 1: URLs from cache/API endpoint (highest priority)
    if (quest.imageUrls && quest.imageUrls.length > 0) {
      urls.push(...quest.imageUrls);
    }

    // Priority 2: Original imageUrl
    if (quest.imageUrl && !urls.includes(quest.imageUrl)) {
      urls.push(quest.imageUrl);
    }

    // Priority 3: Build URLs using image IDs if available
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

    // Priority 4: Quest ID based images
    if (quest.questImageId) {
      const questUrls = [
        `https://cdn.discordapp.com/quests/${quest.questImageId}/cover.png`,
        `https://cdn.discordapp.com/quests/${quest.questImageId}/cover.jpg`,
        `https://cdn.discordapp.com/quests/${quest.questImageId}/cover.webp`,
      ];
      questUrls.forEach((url) => {
        if (!urls.includes(url)) {
          urls.push(url);
        }
      });
    }

    // Priority 5: Application ID based images
    if (quest.applicationId && quest.applicationId !== '0') {
      const appIdUrls = [
        `https://cdn.discordapp.com/app-icons/${quest.applicationId}/icon.png`,
        `https://cdn.discordapp.com/quests/${quest.applicationId}/cover.png`,
        `https://cdn.discordapp.com/quests/${quest.applicationId}/cover.jpg`,
      ];
      appIdUrls.forEach((url) => {
        if (!urls.includes(url)) {
          urls.push(url);
        }
      });
    }

    // Priority 6: Steam fallback (last resort)
    if (quest.applicationId && quest.applicationId !== '0') {
      const steamUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${quest.applicationId}/header.jpg`;
      if (!urls.includes(steamUrl)) {
        urls.push(steamUrl);
      }
    }

    return urls;
  };

  const allImageUrls = getAllImageUrls();

  // Get current image URL
  const getImageUrl = () => {
    if (imageError || allImageUrls.length === 0) return null;
    return allImageUrls[currentImageIndex] || allImageUrls[0];
  };

  const handleImageError = () => {
    if (currentImageIndex < allImageUrls.length - 1) {
      // Try next image URL
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      // All images failed, show gradient
      setImageError(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getRewardText = () => {
    // Simulate Discord Orbs reward based on quest type
    const baseOrbs = quest.secondsNeeded > 900 ? 700 : 150;
    return `${baseOrbs} Orbs do Discord`;
  };

  const getPromotedBy = () => {
    // Extract publisher/company from application name or use default
    const appName = quest.applicationName || 'Discord';
    if (appName.includes('Call of Duty') || appName.includes('Activision')) {
      return 'Activision';
    }
    if (appName.includes('Perplexity') || appName.includes('Comet')) {
      return 'Perplexity';
    }
    if (appName.includes('King') || appName.includes('Amazon')) {
      return 'Amazon Games';
    }
    if (appName.includes('NetEase')) {
      return 'NetEase Games';
    }
    if (appName.includes('NetEase') && appName.includes('Where')) {
      return 'NetEase';
    }
    return appName;
  };

  const imageUrl = getImageUrl();

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
        isHighContrast
          ? 'bg-hc-secondary border-2 border-hc'
          : 'bg-gray-900/90 border border-gray-800'
      } ${!hideExecuteButton ? 'hover:scale-[1.02] hover:shadow-2xl' : ''}`}
      style={
        !isHighContrast
          ? {
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }
          : {}
      }
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            <img
              key={currentImageIndex}
              src={imageUrl}
              alt={quest.applicationName}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={handleImageError}
              onLoad={() => {
                // Reset error state when image loads successfully
                if (imageError) setImageError(false);
              }}
            />
            {/* Fallback gradient in case image fails to load */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: isHighContrast
                  ? accentColor
                  : `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}40 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: isHighContrast
                ? accentColor
                : `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}40 100%)`,
            }}
          />
        )}
        {/* Dark overlay for text readability */}
        <div
          className={`absolute inset-0 ${
            isHighContrast ? 'bg-hc-primary/80' : 'bg-black/60'
          } group-hover:bg-black/70 transition-colors`}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[320px]">
        {/* Top Section */}
        <div className="space-y-3">
          {/* Promoted By */}
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium ${
                isHighContrast ? 'text-hc-secondary' : 'text-gray-300'
              }`}
            >
              Promovido por {getPromotedBy()}
            </p>
            {isCompleted && (
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                  isHighContrast
                    ? 'bg-hc-secondary border border-hc'
                    : 'bg-green-500/20 border border-green-500/30'
                }`}
              >
                <CheckCircle2
                  size={14}
                  className={isHighContrast ? 'text-hc-primary' : 'text-green-400'}
                />
                <span
                  className={`text-xs font-medium ${
                    isHighContrast ? 'text-hc-primary' : 'text-green-400'
                  }`}
                >
                  Concluída
                </span>
              </div>
            )}
          </div>

          {/* Application Name / Title */}
          <h3
            className={`text-2xl font-bold leading-tight ${
              isHighContrast ? 'text-hc-primary' : 'text-white'
            }`}
            style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
            }}
          >
            {quest.applicationName || 'Unknown Game'}
          </h3>

          {/* Mission Name */}
          <div className="space-y-1">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                isHighContrast ? 'text-hc-secondary' : 'text-gray-300'
              }`}
            >
              MISSÃO:
            </p>
            <p
              className={`text-sm font-medium ${isHighContrast ? 'text-hc-primary' : 'text-white'}`}
              style={{
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              {quest.questName || 'Unknown Quest'}
            </p>
          </div>

          {/* Reward */}
          <div className="flex items-center space-x-2">
            <Sparkles
              size={16}
              className={isHighContrast ? 'text-hc-primary' : 'text-yellow-400'}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 0, 0.5))',
              }}
            />
            <p
              className={`text-sm font-semibold ${
                isHighContrast ? 'text-hc-primary' : 'text-yellow-300'
              }`}
              style={{
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              Resgatar {getRewardText()}
            </p>
          </div>

          {/* Description / Time */}
          {!isCompleted && (
            <p className={`text-xs ${isHighContrast ? 'text-hc-secondary' : 'text-gray-300'}`}>
              {quest.taskType === 'WATCH_VIDEO' || quest.taskType === 'WATCH_VIDEO_ON_MOBILE'
                ? 'Assista ao vídeo para ganhar Orbs!'
                : quest.taskType === 'PLAY_ON_DESKTOP'
                ? `Jogue por ${formatTime(quest.secondsNeeded)} para ganhar Orbs!`
                : quest.taskType === 'STREAM_ON_DESKTOP'
                ? `Transmita por ${formatTime(quest.secondsNeeded)} para ganhar Orbs!`
                : `Complete a missão para ganhar Orbs!`}
            </p>
          )}

          {/* Completed Date */}
          {isCompleted && completedDate && (
            <div className="flex items-center space-x-1">
              <Calendar
                size={12}
                className={isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}
              />
              <p className={`text-xs ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
                Você reivindicou esta recompensa em {completedDate}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section - Action Button */}
        <div className="mt-4">
          {!hideExecuteButton && !isCompleted ? (
            <>
              {isInProgress && activeProgress ? (
                <div className="w-full space-y-2">
                  {/* Barra de Progresso */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: accentColor }}>
                        Em Progresso...
                      </span>
                      <span className="text-xs text-white/70">
                        {activeProgress.estimatedEndTime > Date.now() 
                          ? `${Math.max(0, Math.ceil((activeProgress.estimatedEndTime - Date.now()) / 1000 / 60))} min restantes`
                          : 'Completando...'}
                      </span>
                    </div>
                    <div 
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{
                        background: isHighContrast 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(0, (activeProgress.secondsDone / activeProgress.secondsNeeded) * 100))}%`,
                          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                          boxShadow: `0 0 10px ${accentColor}80`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60 mt-1">
                      <span>
                        {Math.floor(activeProgress.secondsDone / 60)} min / {Math.ceil(activeProgress.secondsNeeded / 60)} min
                      </span>
                      <span>
                        {Math.round(Math.min(100, Math.max(0, (activeProgress.secondsDone / activeProgress.secondsNeeded) * 100)))}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onExecute?.(quest)}
                  disabled={isExecuting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                    isExecuting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'
                  }`}
                  style={{
                    background: isHighContrast
                      ? accentColor
                      : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                    color: '#FFFFFF',
                    boxShadow: isExecuting ? 'none' : `0 4px 20px ${accentColor}40`,
                  }}
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Executando...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Execute Now</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : isCompleted ? (
            <div className="flex space-x-2">
              <button
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isHighContrast
                    ? 'bg-hc-secondary border border-hc text-hc-primary hover:bg-hc'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                Ver código
              </button>
              <button
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                  isHighContrast
                    ? 'bg-hc-secondary border border-hc text-hc-primary hover:bg-hc'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                Explore a loja
              </button>
            </div>
          ) : null}

          {/* End Date */}
          {quest.expiresAt && !isCompleted && (
            <p
              className={`text-xs text-center mt-2 ${
                isHighContrast ? 'text-hc-secondary' : 'text-gray-400'
              }`}
            >
              Termina em {formatDate(quest.expiresAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscordQuestCard;
