import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { QuestData } from '../QuestCard';
import DiscordQuestCard from '../DiscordQuestCard';
import { Search, CheckCircle2 } from 'lucide-react';

const LibraryTab: React.FC = () => {
  const { t } = useTranslation();
  const { refreshHistory } = useAppStore();
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

      const latestHistory = useAppStore.getState().history;

      const questIds = latestHistory
        .filter((item) => item.status === 'success')
        .map((item) => item.id || item.questImageId)
        .filter((id): id is string => !!id);

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
    <div className="space-y-4 neo-fade-in">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder={t('library.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neo-input pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Quests Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary">Loading...</div>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
          <p className="text-text-secondary">
            {searchTerm ? t('library.noResults') : t('library.empty')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="neo-card">
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

export default LibraryTab;

