import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../stores/appStore';
import { QuestData } from './QuestCard';
import DiscordQuestCard from './DiscordQuestCard';
import QuestPreview from './QuestPreview';
import AnimatedCard from './AnimatedCard';
import ProgressIndicator from './ProgressIndicator';
import {
  Search,
  Flame,
  TrendingUp,
  Target,
  Sparkles,
  Grid3x3,
  List,
  Filter,
  X,
  Zap,
} from 'lucide-react';

const QuestsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { isExecuting, settings } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#8B5CF6';
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'downloaded' | 'toComplete'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    loadQuests();
    const interval = setInterval(loadQuests, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await window.electronAPI.getAllQuests();

      if (result.success && result.quests && result.quests.length > 0) {
        const questIds = result.quests
          .map((q: any) => q.questId || q.questImageId)
          .filter((id: any): id is string => !!id);

        let cacheImageMap: Record<string, string> = {};
        if (questIds.length > 0) {
          try {
            const cacheResult = await window.electronAPI.getQuestImagesFromCache(questIds);
            if (cacheResult.success && cacheResult.imageMap) {
              cacheImageMap = cacheResult.imageMap;
            }
          } catch (error) {
            console.error('Error fetching images from cache:', error);
          }
        }

        const questsData: QuestData[] = result.quests.map((q: any) => {
          let status: 'active' | 'completed' | 'available' | 'failed' = 'available';
          if (q.isCompleted) {
            status = 'completed';
          } else if (q.isEnrolled && q.secondsDone > 0) {
            status = 'active';
          }

          const questId = q.questId || q.questImageId;
          const imageUrls: string[] = [];

          if (questId && cacheImageMap[questId]) {
            imageUrls.push(cacheImageMap[questId]);
          }

          if (q.imageUrls && Array.isArray(q.imageUrls) && q.imageUrls.length > 0) {
            q.imageUrls.forEach((url: string) => {
              if (!imageUrls.includes(url)) {
                imageUrls.push(url);
              }
            });
          }

          if (
            q.imageIds &&
            Array.isArray(q.imageIds) &&
            q.imageIds.length > 0 &&
            q.appImageId &&
            q.appImageId !== '0'
          ) {
            q.imageIds.forEach((imageId: string) => {
              const specificUrls = [
                `https://cdn.discordapp.com/quests/${q.appImageId}/${imageId}.jpg?format=webp&width=1320&height=370`,
                `https://cdn.discordapp.com/quests/${q.appImageId}/${imageId}.jpg`,
                `https://cdn.discordapp.com/quests/${q.appImageId}/${imageId}.png`,
              ];
              specificUrls.forEach((url: string) => {
                if (!imageUrls.includes(url)) {
                  imageUrls.push(url);
                }
              });
            });
          }

          if (q.imageUrl && !imageUrls.includes(q.imageUrl)) {
            imageUrls.push(q.imageUrl);
          }

          return {
            id: q.questId || Date.now().toString(),
            questName: q.questName || 'Unknown Quest',
            applicationName: q.applicationName || 'Unknown Game',
            applicationId: q.applicationId || '0',
            taskType: q.taskType || 'UNKNOWN',
            secondsNeeded: q.secondsNeeded || 0,
            secondsDone: q.secondsDone || 0,
            status,
            expiresAt: q.expiresAt,
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : q.imageUrl || null,
            isEnrolled: q.isEnrolled || false,
            isCompleted: q.isCompleted || false,
            questImageId: q.questImageId,
            appImageId: q.appImageId,
            imageUrls: imageUrls.length > 0 ? imageUrls : q.imageUrls || [],
            imageIds: q.imageIds || [],
          };
        });
        setQuests(questsData);
        if (questsData.length === 0) {
          setErrorMessage(t('quests.noQuestsAvailable'));
        }
      } else {
        setQuests([]);
        setErrorMessage(result.message || t('quests.noQuestsAvailable'));
      }
    } catch (error: unknown) {
      console.error('Error loading quests:', error);
      setQuests([]);
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      setErrorMessage(`${t('common.error')}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuests = useMemo(() => {
    let filtered = quests;

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.questName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.applicationName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filter) {
      case 'popular':
        filtered = [...filtered].sort((a, b) => a.secondsNeeded - b.secondsNeeded);
        break;
      case 'downloaded':
        filtered = filtered.filter((q) => q.status === 'active');
        break;
      case 'toComplete':
        filtered = filtered.filter((q) => q.status !== 'completed');
        break;
      default:
        break;
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter((q) => activeFilters.includes(q.taskType));
    }

    return filtered;
  }, [quests, searchTerm, filter, activeFilters]);

  const handleExecuteQuest = useCallback(async (quest: QuestData) => {
    await executeQuestAutomation(quest.id);
    setTimeout(() => {
      loadQuests();
    }, 2000);
  }, []);

  const handleSurpriseMe = () => {
    if (filteredQuests.length > 0) {
      const randomQuest = filteredQuests[Math.floor(Math.random() * filteredQuests.length)];
      handleExecuteQuest(randomQuest);
    }
  };

  const handleQuestClick = (quest: QuestData) => {
    setSelectedQuest(quest);
    setShowPreview(true);
  };

  const taskTypes = useMemo(() => {
    return Array.from(new Set(quests.map((q) => q.taskType))).filter(Boolean);
  }, [quests]);

  const toggleFilter = (taskType: string) => {
    setActiveFilters((prev) =>
      prev.includes(taskType) ? prev.filter((f) => f !== taskType) : [...prev, taskType]
    );
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-4xl font-bold mb-2 flex items-center space-x-3 ${
            isHighContrast ? 'text-hc-primary' : 'text-white'
          }`}
        >
          <Sparkles
            size={36}
            style={{ color: isHighContrast ? accentColor : '#8B5CF6' }}
            className="animate-float"
          />
          <span className="gradient-text">{t('quests.title')}</span>
        </h1>
        <p className={isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}>
          {t('quests.availableQuests')} • {filteredQuests.length}{' '}
          {filteredQuests.length === 1 ? 'quest' : 'quests'}
        </p>
      </div>

      {/* Search and Filters Bar */}
      <AnimatedCard className="mb-6">
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('dashboard.searchGames')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input-modern w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none transition-all ${
                isHighContrast
                  ? 'bg-hc-secondary border-2 border-hc text-hc-primary placeholder-hc-secondary'
                  : 'text-white placeholder-gray-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Tabs and View Mode */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto flex-1">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'glass-card text-gray-400 hover:text-white'
                }`}
              >
                <Target size={18} />
                <span>{t('common.all')}</span>
              </button>
              <button
                onClick={() => setFilter('popular')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === 'popular'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'glass-card text-gray-400 hover:text-white'
                }`}
              >
                <Flame size={18} />
                <span>{t('dashboard.popular')}</span>
              </button>
              <button
                onClick={() => setFilter('downloaded')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === 'downloaded'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'glass-card text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp size={18} />
                <span>{t('dashboard.mostDownloaded')}</span>
              </button>
              <button
                onClick={() => setFilter('toComplete')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === 'toComplete'
                    ? 'gradient-primary text-white shadow-lg'
                    : 'glass-card text-gray-400 hover:text-white'
                }`}
              >
                <Target size={18} />
                <span>{t('dashboard.toComplete')}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center glass-card rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'list'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* Surprise Me Button */}
              <button
                onClick={handleSurpriseMe}
                disabled={filteredQuests.length === 0}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed gradient-primary text-white"
              >
                <Zap size={18} />
                <span>{t('dashboard.surpriseMe')}</span>
              </button>
            </div>
          </div>

          {/* Task Type Filters */}
          {taskTypes.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400 mr-2">Filtros:</span>
              {taskTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilters.includes(type)
                      ? 'gradient-primary text-white'
                      : 'glass-card text-gray-400 hover:text-white'
                  }`}
                >
                  {type.replace(/_/g, ' ')}
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  onClick={() => setActiveFilters([])}
                  className="px-3 py-1.5 rounded-full text-xs font-medium glass-card text-gray-400 hover:text-white transition-all flex items-center space-x-1"
                >
                  <X size={14} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Quests Grid/List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ProgressIndicator size="lg" variant="ring" />
            <p className={`mt-4 ${isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}`}>
              {t('quests.loadingQuests')}
            </p>
          </div>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              style={{ color: isHighContrast ? accentColor : '#6B7280' }}
            />
            <p
              className={`text-xl font-semibold mb-2 ${
                isHighContrast ? 'text-hc-primary' : 'text-gray-400'
              }`}
            >
              {searchTerm ? t('dashboard.noQuests') : t('quests.noQuestsAvailable')}
            </p>
            {errorMessage && (
              <p
                className={`text-sm mb-4 max-w-md mx-auto ${
                  isHighContrast ? 'text-status-offline' : 'text-red-400'
                }`}
              >
                {errorMessage}
              </p>
            )}
            <button
              onClick={loadQuests}
              className="mt-4 px-4 py-2 rounded-lg transition-colors gradient-primary text-white"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {filteredQuests.map((quest, index) => (
                <div
                  key={quest.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AnimatedCard
                    hover3D={true}
                    glowOnHover={true}
                    onClick={() => handleQuestClick(quest)}
                  >
                    <DiscordQuestCard
                      quest={quest}
                      onExecute={handleExecuteQuest}
                      isExecuting={isExecuting}
                      isCompleted={quest.status === 'completed'}
                    />
                  </AnimatedCard>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {filteredQuests.map((quest, index) => (
                <div
                  key={quest.id}
                  className="animate-slide-in-right"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <AnimatedCard hover3D={false} onClick={() => handleQuestClick(quest)}>
                    <DiscordQuestCard
                      quest={quest}
                      onExecute={handleExecuteQuest}
                      isExecuting={isExecuting}
                      isCompleted={quest.status === 'completed'}
                    />
                  </AnimatedCard>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quest Preview Modal */}
      <QuestPreview
        quest={selectedQuest}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedQuest(null);
        }}
        onExecute={handleExecuteQuest}
        isExecuting={isExecuting}
      />
    </div>
  );
};

export default QuestsPanel;
