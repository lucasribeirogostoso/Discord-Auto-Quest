import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../../stores/appStore';
import { QuestData } from '../QuestCard';
import DiscordQuestCard from '../DiscordQuestCard';
import { Search } from 'lucide-react';

const QuestsTab: React.FC = () => {
  const { t } = useTranslation();
  const { isExecuting } = useAppStore();
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!searchTerm) return quests;
    return quests.filter(
      (q) =>
        q.questName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.applicationName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quests, searchTerm]);

  const handleExecuteQuest = async (quest: QuestData) => {
    await executeQuestAutomation(quest.id);
    setTimeout(() => {
      loadQuests();
    }, 2000);
  };

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
            placeholder={t('dashboard.searchGames')}
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
          <p className="text-text-secondary">
            {errorMessage || t('quests.noQuestsAvailable')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="neo-card">
              <DiscordQuestCard
                quest={quest}
                onExecute={handleExecuteQuest}
                isExecuting={isExecuting}
                isCompleted={quest.status === 'completed'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestsTab;

