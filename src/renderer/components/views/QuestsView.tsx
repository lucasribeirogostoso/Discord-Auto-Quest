import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore, executeQuestAutomation } from '../../stores/appStore';
import { QuestData } from '../QuestCard';
import DiscordQuestCard from '../DiscordQuestCard';
import { Search, X } from 'lucide-react';

const QuestsView: React.FC = () => {
  const { t } = useTranslation();
  const { isExecuting, setCurrentView } = useAppStore();
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuests();
    const interval = setInterval(loadQuests, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.getAllQuests();
      
      console.log('[QuestsView] Load quests result:', result);

      if (result.success && result.quests && result.quests.length > 0) {
        console.log('[QuestsView] Found', result.quests.length, 'quests');
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

        console.log('[QuestsView] Mapping quests:', result.quests);
        
        const questsData: QuestData[] = result.quests.map((q: any, index: number) => {
          console.log(`[QuestsView] Mapping quest ${index}:`, q);
          
          let status: 'active' | 'completed' | 'available' | 'failed' = 'available';
          if (q.isCompleted) {
            status = 'completed';
          } else if (q.isEnrolled && q.secondsDone > 0) {
            status = 'active';
          }

          const questId = q.questId || q.questImageId || q.id;
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

          const questData = {
            id: questId || q.id || `quest-${index}-${Date.now()}`,
            questName: q.questName || q.name || 'Unknown Quest',
            applicationName: q.applicationName || q.application?.name || 'Unknown Game',
            applicationId: q.applicationId || q.application?.id || q.applicationId || '0',
            taskType: q.taskType || 'UNKNOWN',
            secondsNeeded: q.secondsNeeded || q.questSecondsNeeded || 0,
            secondsDone: q.secondsDone || 0,
            status,
            expiresAt: q.expiresAt,
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : q.imageUrl || null,
            isEnrolled: q.isEnrolled || false,
            isCompleted: q.isCompleted || false,
            questImageId: q.questImageId || questId,
            appImageId: q.appImageId || q.applicationId,
            imageUrls: imageUrls.length > 0 ? imageUrls : q.imageUrls || [],
            imageIds: q.imageIds || [],
          };
          
          console.log(`[QuestsView] Mapped quest ${index} to:`, questData);
          return questData;
        });
        
        console.log('[QuestsView] Final quests data:', questsData);
        setQuests(questsData);
      } else {
        console.log('[QuestsView] No quests found. Result:', result);
        setQuests([]);
      }
    } catch (error: unknown) {
      console.error('Error loading quests:', error);
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

  const handleExecuteQuest = async (quest: QuestData) => {
    await executeQuestAutomation(quest.id);
    setTimeout(() => {
      loadQuests();
    }, 2000);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="neon-title">{t('quests.title')}</h1>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder={t('dashboard.searchGames')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="neon-input pl-12 py-3 text-lg bg-black/20 border-white/10 focus:border-[#00f0ff]/50"
        />
      </div>

      {/* Quests Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 font-mono">Loading...</div>
          </div>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="neon-card flex flex-col items-center justify-center py-16 opacity-80">
          <p className="text-xl text-gray-500 font-medium">{t('quests.noQuestsAvailable')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="neon-card p-0 overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-white/5 hover:border-[#00f0ff]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
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

export default QuestsView;

