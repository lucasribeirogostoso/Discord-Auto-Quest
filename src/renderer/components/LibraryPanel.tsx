import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { Search, Sparkles, CheckCircle2, Grid3x3, List, Calendar, TrendingUp, Award } from 'lucide-react';
import { QuestData } from './QuestCard';
import DiscordQuestCard from './DiscordQuestCard';
import AnimatedCard from './AnimatedCard';
import QuestPreview from './QuestPreview';

const LibraryPanel: React.FC = () => {
  const { t } = useTranslation();
  const { refreshHistory, settings } = useAppStore();
  const isHighContrast = settings.highContrast ?? true;
  const accentColor = settings.accentColor || '#8B5CF6';
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'oldest'>('all');
  const [viewMode, setViewMode] = useState<'gallery' | 'grid' | 'timeline'>('grid');
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      await refreshHistory();

      const latestHistory = useAppStore.getState().history;

      const questIds = latestHistory
        .filter((item) => item.status === 'success')
        .map((item) => item.id || item.questImageId)
        .filter((id): id is string => !!id);

      const historyData = latestHistory
        .filter((item) => item.status === 'success')
        .map((item) => ({
          id: item.id || item.questImageId || '',
          appImageId: item.appImageId || item.applicationId || '0',
          applicationId: item.applicationId || item.appImageId || '0',
          imageIds: item.imageIds || [],
        }))
        .filter((item) => !!item.id);

      let cacheImageMap: Record<string, string> = {};
      if (questIds.length > 0) {
        try {
          const cacheResult = await window.electronAPI.getQuestImagesFromCache(questIds, historyData);
          if (cacheResult.success && cacheResult.imageMap) {
            cacheImageMap = cacheResult.imageMap;
          }
        } catch (error) {
          console.error('Error fetching images from cache:', error);
        }
      }

      const completedQuests = latestHistory
        .filter((item) => item.status === 'success')
        .map((item) => {
          const imageUrls: string[] = [];
          const questId = item.id || item.questImageId;
          
          if (questId && cacheImageMap[questId]) {
            imageUrls.push(cacheImageMap[questId]);
          }

          if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            item.imageUrls.forEach((url) => {
              if (!imageUrls.includes(url)) {
                imageUrls.push(url);
              }
            });
          }

          if (item.imageIds && Array.isArray(item.imageIds) && item.imageIds.length > 0 && item.appImageId && item.appImageId !== '0') {
            item.imageIds.forEach((imageId: string) => {
              const specificUrls = [
                `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.jpg?format=webp&width=1320&height=370`,
                `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.jpg`,
                `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.png`,
              ];
              specificUrls.forEach((url) => {
                if (!imageUrls.includes(url)) {
                  imageUrls.push(url);
                }
              });
            });
          }

          const questIdForImages = item.questImageId || item.id;
          if (questIdForImages) {
            const questUrls = [
              `https://cdn.discordapp.com/quests/${questIdForImages}/cover.png`,
              `https://cdn.discordapp.com/quests/${questIdForImages}/cover.jpg`,
            ];
            questUrls.forEach((url) => {
              if (!imageUrls.includes(url)) {
                imageUrls.push(url);
              }
            });
          }

          const questData: QuestData = {
            id: item.id,
            questName: item.questName,
            applicationName: item.applicationName,
            applicationId: item.applicationId || '0',
            taskType: item.taskType,
            secondsNeeded: item.duration,
            secondsDone: item.duration,
            status: 'completed',
            expiresAt: item.timestamp + item.duration * 1000,
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
            isEnrolled: false,
            isCompleted: true,
            questImageId: questIdForImages,
            appImageId: item.appImageId,
            imageUrls: imageUrls,
            imageIds: item.imageIds || [],
          };
          return questData;
        });

      try {
        const currentQuestsResult = await window.electronAPI.getAllQuests();
        if (currentQuestsResult.success && currentQuestsResult.quests) {
          const questsByNameMap = new Map(
            currentQuestsResult.quests.map((q: any) => [q.questName.toLowerCase(), q])
          );

          const enrichedQuests = completedQuests.map((quest) => {
            const existingUrls = quest.imageUrls || [];
            const matchingQuest = questsByNameMap.get(quest.questName.toLowerCase());

            if (matchingQuest) {
              const mergedUrls = [...existingUrls];
              if (matchingQuest.imageUrls && Array.isArray(matchingQuest.imageUrls)) {
                matchingQuest.imageUrls.forEach((url: string) => {
                  if (!mergedUrls.includes(url)) {
                    mergedUrls.push(url);
                  }
                });
              }

              return {
                ...quest,
                applicationId: matchingQuest.applicationId || quest.applicationId,
                questImageId: matchingQuest.questImageId || quest.questImageId,
                appImageId: matchingQuest.appImageId || quest.appImageId,
                imageUrl: mergedUrls.length > 0 ? mergedUrls[0] : quest.imageUrl,
                imageUrls: mergedUrls,
                imageIds: matchingQuest.imageIds || quest.imageIds,
              };
            }

            return quest;
          });

          setQuests(enrichedQuests);
        } else {
          setQuests(completedQuests);
        }
      } catch (error) {
        console.error('Error enriching quests with images:', error);
        setQuests(completedQuests);
      }
    } catch (error: any) {
      console.error('Error loading library:', error);
      setQuests([]);
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

    const sorted = [...filtered];
    switch (filter) {
      case 'recent':
        sorted.sort((a, b) => (b.expiresAt || 0) - (a.expiresAt || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => (a.expiresAt || 0) - (b.expiresAt || 0));
        break;
      default:
        sorted.sort((a, b) => a.questName.localeCompare(b.questName));
        break;
    }

    return sorted;
  }, [quests, searchTerm, filter]);

  const handleQuestClick = (quest: QuestData) => {
    setSelectedQuest(quest);
    setShowPreview(true);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const stats = useMemo(() => {
    return {
      total: quests.length,
      thisMonth: quests.filter(q => {
        const questDate = new Date(q.expiresAt || 0);
        const now = new Date();
        return questDate.getMonth() === now.getMonth() && questDate.getFullYear() === now.getFullYear();
      }).length,
      uniqueGames: new Set(quests.map(q => q.applicationId)).size,
    };
  }, [quests]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-4xl font-bold mb-2 flex items-center space-x-3 ${isHighContrast ? 'text-hc-primary' : 'text-white'}`}>
          <Sparkles size={36} style={{ color: isHighContrast ? accentColor : '#8B5CF6' }} className="animate-float" />
          <span className="gradient-text">{t('library.title')}</span>
        </h1>
        <p className={isHighContrast ? 'text-hc-secondary' : 'text-gray-400'}>
          {t('library.completedQuests')} • {filteredQuests.length} {filteredQuests.length === 1 ? 'quest' : 'quests'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedCard hover3D={true}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{t('library.totalCompleted')}</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Award size={32} className="text-purple-500" />
            </div>
          </div>
        </AnimatedCard>
        <AnimatedCard hover3D={true}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{t('library.thisMonth')}</p>
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
              </div>
              <Calendar size={32} className="text-cyan-500" />
            </div>
          </div>
        </AnimatedCard>
        <AnimatedCard hover3D={true}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{t('library.uniqueGames')}</p>
                <p className="text-2xl font-bold text-white">{stats.uniqueGames}</p>
              </div>
              <TrendingUp size={32} className="text-green-500" />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Search and Filters */}
      <AnimatedCard className="mb-6">
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder={t('library.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`input-modern w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none ${
                  isHighContrast 
                    ? 'bg-hc-secondary border-2 border-hc text-hc-primary placeholder-hc-secondary' 
                    : 'text-white placeholder-gray-500'
                }`}
              />
            </div>

            <div className="flex items-center glass-card rounded-lg p-1">
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'gallery' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Gallery View"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'timeline' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Timeline View"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 glass-card rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'gradient-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('library.all')}
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'recent'
                  ? 'gradient-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('library.recent')}
            </button>
            <button
              onClick={() => setFilter('oldest')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'oldest'
                  ? 'gradient-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('library.oldest')}
            </button>
          </div>
        </div>
      </AnimatedCard>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">{t('library.loading')}</p>
          </div>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <CheckCircle2 size={64} className="text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {searchTerm ? t('library.noResults') : t('library.empty')}
          </h3>
          <p className="text-gray-400 max-w-md">
            {searchTerm ? t('library.noResultsDescription') : t('library.emptyDescription')}
          </p>
        </div>
      ) : viewMode === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
          {filteredQuests.map((quest, index) => (
            <div
              key={quest.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AnimatedCard hover3D={true} glowOnHover={true} onClick={() => handleQuestClick(quest)}>
                <div className="aspect-video rounded-lg overflow-hidden mb-3">
                  {quest.imageUrl ? (
                    <img
                      src={quest.imageUrl}
                      alt={quest.questName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-purple-500/50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{quest.questName}</h3>
                  <p className="text-sm text-gray-400 truncate">{quest.applicationName}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(quest.expiresAt || Date.now())}</span>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                </div>
              </AnimatedCard>
            </div>
          ))}
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-4 pb-6">
          {filteredQuests.map((quest, index) => (
            <div
              key={quest.id}
              className="animate-slide-in-right"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <AnimatedCard onClick={() => handleQuestClick(quest)}>
                <div className="flex items-center space-x-4 p-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {quest.imageUrl ? (
                      <img
                        src={quest.imageUrl}
                        alt={quest.questName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-purple-500/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-1 truncate">{quest.questName}</h3>
                    <p className="text-sm text-gray-400 truncate">{quest.applicationName}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(quest.expiresAt || Date.now())}</span>
                      <span className="flex items-center space-x-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span>Completada</span>
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredQuests.map((quest, index) => (
            <div
              key={quest.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AnimatedCard hover3D={true} glowOnHover={true} onClick={() => handleQuestClick(quest)}>
                <DiscordQuestCard
                  quest={quest}
                  onExecute={() => {}}
                  isExecuting={false}
                  hideExecuteButton={true}
                  isCompleted={true}
                  completedDate={formatDate(quest.expiresAt || Date.now())}
                />
              </AnimatedCard>
            </div>
          ))}
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
      />
    </div>
  );
};

export default LibraryPanel;
