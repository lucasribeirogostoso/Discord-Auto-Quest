import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';
import { User, Rocket, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const HeroUserCard: React.FC = () => {
  const { t } = useTranslation();
  const { discordStatus, isExecuting } = useAppStore();
  const [discordUser, setDiscordUser] = useState<{
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
  } | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (discordStatus.isRunning) {
        try {
          const result = await window.electronAPI.getDiscordUser();
          if (result.success && result.user) {
            setDiscordUser({
              displayName: result.user.displayName || result.user.username || t('common.user'),
              avatarUrl: result.user.avatarUrl,
              bannerUrl: result.user.bannerUrl || null,
            });
            setAvatarError(false);
          }
        } catch (error) {
          console.error('Failed to load Discord user info:', error);
        }
      } else {
        setDiscordUser(null);
        setAvatarError(false);
      }
    };

    loadUserInfo();
    const interval = setInterval(loadUserInfo, 10000);
    return () => clearInterval(interval);
  }, [discordStatus.isRunning, t]);

  const handleExecute = () => {
    if (discordStatus.isRunning && !isExecuting) {
      executeQuestAutomation();
    }
  };

  const bannerBackground = discordUser?.bannerUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.95)), url(${discordUser.bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div
      className={`hero-user-card ${discordStatus.isRunning ? 'online' : ''}`}
      style={bannerBackground}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {/* Avatar */}
        <div className="relative mb-4">
          <div
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl"
            style={{
              boxShadow: discordStatus.isRunning
                ? '0 0 30px rgba(78, 201, 176, 0.6), 0 0 60px rgba(78, 201, 176, 0.4)'
                : '0 0 20px rgba(244, 135, 113, 0.4)',
            }}
          >
            {discordUser?.avatarUrl && !avatarError ? (
              <img
                src={discordUser.avatarUrl}
                alt={discordUser.displayName}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User size={64} className="text-white" />
              </div>
            )}
          </div>
          {/* Status Indicator */}
          <div className="absolute -bottom-2 -right-2">
            <div className={`status-dot ${discordStatus.isRunning ? 'online' : 'offline'}`} />
          </div>
        </div>

        {/* User Name */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center z-10">
          {discordUser?.displayName || t('common.user')}
        </h2>

        {/* Status Text */}
        <div className="flex items-center space-x-2 mb-4 z-10">
          <Activity
            size={16}
            className={discordStatus.isRunning ? 'text-green-400' : 'text-red-400'}
          />
          <span className="text-sm text-white/80">
            {discordStatus.isRunning ? t('dashboard.discordOnline') : t('dashboard.discordOffline')}
          </span>
        </div>

        {/* Expand Button */}
        {discordStatus.process && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/60 hover:text-white transition-colors mb-2 z-10"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}

        {/* Expanded Info */}
        {expanded && discordStatus.process && (
          <div className="mt-2 p-3 bg-black/30 rounded-lg backdrop-blur-sm border border-white/20 z-10 animate-slide-up">
            <div className="text-xs text-white/80 space-y-1">
              <div className="font-mono">PID: {discordStatus.process.pid}</div>
              <div
                className="font-mono text-xs truncate max-w-[200px]"
                title={discordStatus.process.path}
              >
                {discordStatus.process.path}
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || !discordStatus.isRunning}
          className={`btn-unique mt-4 flex items-center space-x-2 z-10 ${
            isExecuting || !discordStatus.isRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isExecuting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('dashboard.executing')}</span>
            </>
          ) : (
            <>
              <Rocket size={20} />
              <span>{t('dashboard.executeButton')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default HeroUserCard;
