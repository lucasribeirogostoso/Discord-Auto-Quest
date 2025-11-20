import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { QuestData } from '../QuestCard';
import DiscordQuestCard from '../DiscordQuestCard';
import { Search, X, CheckCircle2 } from 'lucide-react';

const LibraryView: React.FC = () => {
  const { t } = useTranslation();
  const { refreshHistory, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quests, setQuests] = useState<QuestData[]>([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      await refreshHistory();

      // Usar snapshot atualizado após o refresh para evitar dados stale
      const latestHistory = useAppStore.getState().history;
      const completedHistory = latestHistory.filter((item) => item.status === 'success');
      
      const questIds = completedHistory
        .map((item) => item.id || item.questImageId)
        .filter((id): id is string => !!id);

      // Preparar dados do histórico para passar ao método de busca de imagens
      const historyData = completedHistory.map((item) => ({
        id: item.id || item.questImageId || '',
        appImageId: item.appImageId,
        applicationId: item.applicationId,
        imageIds: item.imageIds || [],
      }));

      let cacheImageMap: Record<string, string> = {};
      if (questIds.length > 0) {
        try {
          // Passar historyData para ajudar a encontrar imagens de quests completadas
          const cacheResult = await window.electronAPI.getQuestImagesFromCache(questIds, historyData);
          if (cacheResult.success && cacheResult.imageMap) {
            cacheImageMap = cacheResult.imageMap;
            console.log('[LibraryView] Found', Object.keys(cacheImageMap).length, 'images from cache');
          }
        } catch (error) {
          console.error('Error fetching images from cache:', error);
        }
      }

      const completedQuests = completedHistory.map((item) => {
        const imageUrls: string[] = [];
        const questId = item.id || item.questImageId;
        
        // Priority 1: Imagens do cache
        if (questId && cacheImageMap[questId]) {
          imageUrls.push(cacheImageMap[questId]);
        }

        // Priority 2: URLs já salvas no histórico
        if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
          item.imageUrls.forEach((url) => {
            if (!imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }

        // Priority 3: Construir URLs usando imageIds e appImageId
        if (item.imageIds && Array.isArray(item.imageIds) && item.imageIds.length > 0 && item.appImageId && item.appImageId !== '0') {
          item.imageIds.forEach((imageId: string) => {
            const specificUrls = [
              `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.jpg?format=webp&width=1320&height=370`,
              `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.jpg`,
              `https://cdn.discordapp.com/quests/${item.appImageId}/${imageId}.png`,
              `https://cdn.discordapp.com/app-assets/${item.appImageId}/${imageId}.jpg?format=webp&width=1320&height=370`,
              `https://cdn.discordapp.com/app-assets/${item.appImageId}/${imageId}.jpg`,
              `https://cdn.discordapp.com/app-assets/${item.appImageId}/${imageId}.png`,
            ];
            specificUrls.forEach((url) => {
              if (!imageUrls.includes(url)) {
                imageUrls.push(url);
              }
            });
          });
        }

        // Priority 4: URLs baseadas no questImageId
        const questIdForImages = item.questImageId || questId;
        if (questIdForImages) {
          const questUrls = [
            `https://cdn.discordapp.com/quests/${questIdForImages}/cover.png`,
            `https://cdn.discordapp.com/quests/${questIdForImages}/cover.jpg`,
            `https://cdn.discordapp.com/quests/${questIdForImages}/cover.webp`,
          ];
          questUrls.forEach((url) => {
            if (!imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }

        // Priority 5: URLs baseadas no applicationId (fallback)
        if (item.applicationId && item.applicationId !== '0') {
          const appIdUrls = [
            `https://cdn.discordapp.com/app-icons/${item.applicationId}/icon.png`,
            `https://cdn.discordapp.com/quests/${item.applicationId}/cover.png`,
            `https://cdn.discordapp.com/quests/${item.applicationId}/cover.jpg`,
          ];
          appIdUrls.forEach((url) => {
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
          questImageId: questId,
          appImageId: item.appImageId,
          imageUrls: imageUrls,
          imageIds: item.imageIds || [],
        };
        return questData;
      });

      console.log('[LibraryView] Loaded', completedQuests.length, 'completed quests with images');
      setQuests(completedQuests);
    } catch (error: any) {
      console.error('Error loading library:', error);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuests = useMemo(() => {
    if (!searchTerm) return quests;
    return quests.filter(
      (q) =>
        q.questName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.applicationName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quests, searchTerm]);

  return (
    <div className="view-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="neon-title">{t('library.title')}</h1>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder={t('library.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="neon-input pl-12 py-3 text-lg bg-black/20 border-white/10 focus:border-[#00f0ff]/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 font-mono">Loading...</div>
          </div>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="neon-card flex flex-col items-center justify-center py-16 opacity-80">
          <CheckCircle2 size={64} className="text-gray-600 mb-4" />
          <p className="text-xl text-gray-500 font-medium">
            {searchTerm ? t('library.noResults') : t('library.empty')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="neon-card p-0 overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer border-white/5 hover:border-[#00f0ff]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <DiscordQuestCard
                quest={quest}
                onExecute={() => {}}
                isExecuting={false}
                hideExecuteButton={true}
                isCompleted={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;

