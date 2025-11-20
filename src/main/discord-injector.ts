import { BrowserWindow } from 'electron';
import CDP, { Client, ListTarget } from 'chrome-remote-interface';
import { ensureDiscordRunningWithDebug, DISCORD_DEBUG_PORT } from './discord-controller';
import { WEBSOCKET_INJECTION_CODE } from './discord-websocket-inject';

const GET_ALL_QUESTS_CODE = `
(async function() {
  try {
    delete window.$;

    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
    let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;
    
    if (!QuestsStore) {
      console.log('[QuestLoader] QuestsStore not found');
      return { success: false, message: "QuestsStore not found", quests: [] };
    }
    
    if (!QuestsStore.quests) {
      console.log('[QuestLoader] QuestsStore.quests is undefined');
      return { success: false, message: "QuestsStore.quests is undefined", quests: [] };
    }
    
    // Get all quests from the store
    let allQuestsRaw = [];
    try {
      if (QuestsStore.quests instanceof Map) {
        allQuestsRaw = [...QuestsStore.quests.values()];
      } else if (QuestsStore.quests.values) {
        allQuestsRaw = [...QuestsStore.quests.values()];
      } else if (Array.isArray(QuestsStore.quests)) {
        allQuestsRaw = QuestsStore.quests;
      } else {
        // Try to get quests using getQuest method
        const questIds = Object.keys(QuestsStore.quests || {});
        allQuestsRaw = questIds.map(id => QuestsStore.getQuest(id)).filter(q => q);
      }
    } catch (e) {
      console.log('[QuestLoader] Error accessing quests:', e);
      return { success: false, message: "Error accessing quests: " + e.message, quests: [] };
    }
    
    console.log('[QuestLoader] Found', allQuestsRaw.length, 'total quests in store');
    
    // Get ALL quests - both enrolled and available
    const allQuests = allQuestsRaw.filter(x => {
      if (!x || !x.config) return false;
      
      // Filter out the specific quest ID that should be ignored
      if (x.id === "1412491570820812933") return false;
      
      // Check if quest hasn't expired
      try {
        const expiresAt = new Date(x.config.expiresAt).getTime();
        if (expiresAt <= Date.now()) return false;
      } catch (e) {
        return false;
      }
      
      // Include quests that are:
      // 1. Enrolled but not completed
      // 2. Or available to enroll (no userStatus or no enrolledAt)
      if (x.userStatus?.enrolledAt) {
        // If enrolled, check if not completed
        return !x.userStatus?.completedAt;
      }
      
      // If not enrolled, it's available
      return true;
    });
    
    console.log('[QuestLoader] Filtered to', allQuests.length, 'available quests');

    // Fetch application data for images
    const applicationIds = [...new Set(allQuests.map(q => {
      try {
        return q.config?.application?.id?.toString();
      } catch {
        return null;
      }
    }).filter(id => id))];
    
    let applicationDataMap = {};
    
    if (applicationIds.length > 0 && api) {
      try {
        console.log('[QuestLoader] Fetching app data for', applicationIds.length, 'applications');
        const appDataResponse = await api.get({url: \`/applications/public?application_ids=\${applicationIds.join(',')}\`});
        if (appDataResponse?.body) {
          if (Array.isArray(appDataResponse.body)) {
            appDataResponse.body.forEach(app => {
              if (app && app.id) {
                applicationDataMap[app.id.toString()] = app;
              }
            });
          }
        }
        console.log('[QuestLoader] Loaded', Object.keys(applicationDataMap).length, 'application data entries');
      } catch (e) {
        const errorMsg = e?.message || (e?.toString ? e.toString() : JSON.stringify(e)) || 'Unknown error';
        console.log('[QuestLoader] Could not fetch application data:', errorMsg);
        if (e?.stack) {
          console.log('[QuestLoader] Error stack:', e.stack);
        }
      }
    }

    // Fetch quest details from API endpoint for images (Method 1)
    const questDetailsMap = {};
    if (api) {
      try {
        console.log('[QuestLoader] Fetching quest details from API for', allQuests.length, 'quests');
        const questDetailsPromises = allQuests.map(async (q) => {
          try {
            const questId = q.id?.toString();
            if (!questId) return null;
            const questDetailsResponse = await api.get({url: \`/quests/\${questId}\`});
            if (questDetailsResponse?.body) {
              questDetailsMap[questId] = questDetailsResponse.body;
              console.log('[QuestLoader] Fetched quest details for', questId, ':', Object.keys(questDetailsResponse.body || {}));
            }
            return questDetailsResponse?.body;
          } catch (e) {
            console.log('[QuestLoader] Could not fetch quest details for', q.id, ':', e?.message || e);
            return null;
          }
        });
        await Promise.all(questDetailsPromises);
        console.log('[QuestLoader] Loaded', Object.keys(questDetailsMap).length, 'quest details from API');
      } catch (e) {
        console.log('[QuestLoader] Error fetching quest details:', e?.message || e);
      }
    }

    const questsData = allQuests.map(quest => {
      try {
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig?.tasks?.[x] != null);
        const secondsNeeded = taskConfig?.tasks?.[taskName]?.target || 0;
        const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        
        const appId = quest.config?.application?.id?.toString() || '0';
        const questId = quest.id?.toString() || '';
        const appData = applicationDataMap[appId] || quest.config?.application || {};
        const questDetails = questDetailsMap[questId] || {};
        // Method 1: Extract image URLs from quest details API response
        let imageUrlsFromAPI = [];
        if (questDetails) {
          // Try various possible field names for image URLs
          if (questDetails.cover_image) imageUrlsFromAPI.push(questDetails.cover_image);
          if (questDetails.image_url) imageUrlsFromAPI.push(questDetails.image_url);
          if (questDetails.thumbnail) imageUrlsFromAPI.push(questDetails.thumbnail);
          if (questDetails.thumbnail_url) imageUrlsFromAPI.push(questDetails.thumbnail_url);
          if (questDetails.media?.image_url) imageUrlsFromAPI.push(questDetails.media.image_url);
          if (questDetails.media?.cover_image) imageUrlsFromAPI.push(questDetails.media.cover_image);
          if (questDetails.config?.cover_image) imageUrlsFromAPI.push(questDetails.config.cover_image);
          if (questDetails.config?.image_url) imageUrlsFromAPI.push(questDetails.config.image_url);
          if (questDetails.application?.cover_image) imageUrlsFromAPI.push(questDetails.application.cover_image);
          if (questDetails.application?.icon) {
            const iconId = questDetails.application.icon;
            imageUrlsFromAPI.push(\`https://cdn.discordapp.com/app-icons/\${appId}/\${iconId}.png\`);
          }
          console.log('[QuestLoader] Found', imageUrlsFromAPI.length, 'image URLs from API for quest', questId);
        }
        
        // Extract image IDs from quest config and app data
        // Based on DevTools structure: quests/{applicationId}/{imageId}.jpg
        let imageIds = [];
        
        // Try to get cover image ID from quest config (various possible field names)
        if (quest.config?.coverImageId) {
          imageIds.push(quest.config.coverImageId.toString());
        }
        if (quest.config?.cover_image_id) {
          imageIds.push(quest.config.cover_image_id.toString());
        }
        if (quest.config?.coverImage) {
          imageIds.push(quest.config.coverImage.toString());
        }
        if (quest.config?.imageId) {
          imageIds.push(quest.config.imageId.toString());
        }
        
        // Try to get image IDs from quest.config.assets
        if (quest.config?.assets) {
          if (Array.isArray(quest.config.assets)) {
            quest.config.assets.forEach(asset => {
              if (asset?.id) imageIds.push(asset.id.toString());
              if (asset?.cover) imageIds.push(asset.cover.toString());
            });
          } else if (quest.config.assets.cover) {
            imageIds.push(quest.config.assets.cover.toString());
          }
        }
        
        // Try to get icon from quest config
        if (quest.config?.icon) {
          imageIds.push(quest.config.icon.toString());
        }
        
        // Try to get images array from quest config
        if (quest.config?.images && Array.isArray(quest.config.images)) {
          quest.config.images.forEach(img => {
            if (img?.id) imageIds.push(img.id.toString());
            if (typeof img === 'string') imageIds.push(img);
          });
        }
        
        // Try to get image IDs from app data assets
        if (appData.assets && Array.isArray(appData.assets)) {
          appData.assets.forEach(asset => {
            if (asset && asset.id) {
              imageIds.push(asset.id.toString());
            }
          });
        }
        
        // Try to get cover image ID from app data
        if (appData.cover_image_id) {
          imageIds.push(appData.cover_image_id.toString());
        }
        if (appData.coverImageId) {
          imageIds.push(appData.coverImageId.toString());
        }
        
        // Try to get icon ID from app data
        if (appData.icon) {
          imageIds.push(appData.icon.toString());
        }
        
        // Try from quest.config.application
        if (quest.config?.application?.icon) {
          imageIds.push(quest.config.application.icon.toString());
        }
        if (quest.config?.application?.cover_image_id) {
          imageIds.push(quest.config.application.cover_image_id.toString());
        }
        if (quest.config?.application?.coverImageId) {
          imageIds.push(quest.config.application.coverImageId.toString());
        }
        
        // Try from questDetails (API response)
        if (questDetails?.cover_image_id) {
          imageIds.push(questDetails.cover_image_id.toString());
        }
        if (questDetails?.image_id) {
          imageIds.push(questDetails.image_id.toString());
        }
        if (questDetails?.config?.cover_image_id) {
          imageIds.push(questDetails.config.cover_image_id.toString());
        }
        
        // Remove duplicates
        imageIds = [...new Set(imageIds)];
        console.log('[QuestLoader] Found', imageIds.length, 'image IDs for quest', questId, ':', imageIds);
        
        // Build image URLs using the structure from DevTools: quests/{applicationId}/{imageId}
        let imageUrls = [];
        
        // Priority 1: URLs from API endpoint
        if (imageUrlsFromAPI.length > 0) {
          imageUrlsFromAPI.forEach(url => {
            if (!imageUrls.includes(url)) {
              imageUrls.push(url);
            }
          });
        }
        
        // Priority 2: Use applicationId as folder with specific image IDs
        if (appId && appId !== '0' && imageIds.length > 0) {
          imageIds.forEach(imgId => {
            // Try JPG with webp format (as seen in DevTools)
            imageUrls.push(\`https://cdn.discordapp.com/quests/\${appId}/\${imgId}.jpg?format=webp&width=1320&height=370\`);
            imageUrls.push(\`https://cdn.discordapp.com/quests/\${appId}/\${imgId}.jpg\`);
            imageUrls.push(\`https://cdn.discordapp.com/quests/\${appId}/\${imgId}.png\`);
            // Also try app-assets path
            imageUrls.push(\`https://cdn.discordapp.com/app-assets/\${appId}/\${imgId}.jpg?format=webp&width=1320&height=370\`);
            imageUrls.push(\`https://cdn.discordapp.com/app-assets/\${appId}/\${imgId}.jpg\`);
            imageUrls.push(\`https://cdn.discordapp.com/app-assets/\${appId}/\${imgId}.png\`);
          });
        }
        
        // Priority 3: Try cover_image URL directly if available
        if (appData.cover_image && !imageUrls.includes(appData.cover_image)) {
          imageUrls.push(appData.cover_image);
        }
        
        // Priority 4: Try application icon
        if (appData.icon) {
          const iconUrl = \`https://cdn.discordapp.com/app-icons/\${appId}/\${appData.icon}.png\`;
          if (!imageUrls.includes(iconUrl)) {
            imageUrls.push(iconUrl);
          }
        }
        
        // Priority 5: Try quest ID based images
        if (questId) {
          const questCoverPng = \`https://cdn.discordapp.com/quests/\${questId}/cover.png\`;
          const questCoverJpg = \`https://cdn.discordapp.com/quests/\${questId}/cover.jpg\`;
          if (!imageUrls.includes(questCoverPng)) imageUrls.push(questCoverPng);
          if (!imageUrls.includes(questCoverJpg)) imageUrls.push(questCoverJpg);
        }
        
        // Priority 6: Try generic patterns with applicationId
        if (appId && appId !== '0') {
          imageUrls.push(\`https://cdn.discordapp.com/quests/\${appId}/cover.jpg\`);
          imageUrls.push(\`https://cdn.discordapp.com/quests/\${appId}/cover.png\`);
        }
        
        return {
          questId: quest.id,
          questName: quest.config?.messages?.questName || 'Unknown Quest',
          applicationName: quest.config?.application?.name || 'Unknown Game',
          applicationId: appId,
          taskType: taskName || "UNKNOWN",
          secondsNeeded,
          secondsDone,
          expiresAt: new Date(quest.config.expiresAt).getTime(),
          enrolledAt: quest.userStatus?.enrolledAt ? new Date(quest.userStatus.enrolledAt).getTime() : null,
          isEnrolled: !!quest.userStatus?.enrolledAt,
          isCompleted: !!quest.userStatus?.completedAt,
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
          // All image URLs to try
          imageUrls: imageUrls,
          // Additional IDs for reference
          questImageId: questId,
          appImageId: appId,
          imageIds: imageIds
        };
      } catch (e) {
        console.log('[QuestLoader] Error processing quest:', e);
        return null;
      }
    }).filter(q => q !== null);

    console.log('[QuestLoader] Returning', questsData.length, 'quests');
    return { success: true, quests: questsData };
  } catch (error) {
    console.error('[QuestLoader] Error getting quests:', error);
    return { success: false, message: error?.message || "Unknown error", quests: [] };
  }
})();
`;

const QUEST_AUTOMATION_CODE = `
(async function(questIdToExecute) {
  try {
    delete window.$;

    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata).exports.Z;
    let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
    let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
    let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
    let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
    let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
    let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;

    // Find quest - if questIdToExecute is provided, use it, otherwise find first available
    let quest;
    if (questIdToExecute) {
      // Try to find by ID first
      quest = [...QuestsStore.quests.values()].find(x => x.id === questIdToExecute);
      
      if (!quest) {
        console.log('[QuestInjector] Quest ID not found:', questIdToExecute);
        return { success: false, message: \`Quest with ID \${questIdToExecute} not found!\` };
      }
      
      // Check if quest is enrolled, if not, try to enroll
      if (!quest.userStatus?.enrolledAt) {
        console.log('[QuestInjector] Quest not enrolled, attempting to enroll...');
        try {
          // Try to enroll in the quest
          const enrollResponse = await api.post({url: \`/quests/\${quest.id}/enroll\`, body: {}});
          if (enrollResponse?.body) {
            console.log('[QuestInjector] Successfully enrolled in quest');
            // Refresh quest data
            quest = [...QuestsStore.quests.values()].find(x => x.id === questIdToExecute);
          }
        } catch (enrollError) {
          console.log('[QuestInjector] Could not enroll in quest:', enrollError?.message || enrollError);
          // Continue anyway, might work if quest doesn't require enrollment
        }
      }
    } else {
      // Original behavior - find first available enrolled quest
      quest = [...QuestsStore.quests.values()].find(x => 
        x.id !== "1412491570820812933" && 
        x.userStatus?.enrolledAt && 
        !x.userStatus?.completedAt && 
        new Date(x.config.expiresAt).getTime() > Date.now()
      );
    }
    
    let isApp = typeof DiscordNative !== "undefined";
    
    if(!quest) {
      console.log("You don't have any uncompleted quests!");
      return { success: false, message: "You don't have any uncompleted quests!" };
    }
    
    // Check if quest is completed
    if(quest.userStatus?.completedAt) {
      console.log("Quest is already completed!");
      return { success: false, message: "Quest is already completed!" };
    }
    
    // Check if quest has expired
    if(new Date(quest.config.expiresAt).getTime() <= Date.now()) {
      console.log("Quest has expired!");
      return { success: false, message: "Quest has expired!" };
    }
    
    const pid = Math.floor(Math.random() * 30000) + 1000;
    
    const applicationId = quest.config.application.id;
    const applicationName = quest.config.application.name;
    const questName = quest.config.messages.questName;
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null);
    const secondsNeeded = taskConfig.tasks[taskName].target;
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    
    // Method 1: Fetch quest details from API endpoint for images
    let imageUrlsFromAPI = [];
    let imageIds = [];
    try {
      const questDetailsResponse = await api.get({url: \`/quests/\${quest.id}\`});
      if (questDetailsResponse?.body) {
        const questDetails = questDetailsResponse.body;
        // Try various possible field names for image URLs
        if (questDetails.cover_image) imageUrlsFromAPI.push(questDetails.cover_image);
        if (questDetails.image_url) imageUrlsFromAPI.push(questDetails.image_url);
        if (questDetails.thumbnail) imageUrlsFromAPI.push(questDetails.thumbnail);
        if (questDetails.thumbnail_url) imageUrlsFromAPI.push(questDetails.thumbnail_url);
        if (questDetails.media?.image_url) imageUrlsFromAPI.push(questDetails.media.image_url);
        if (questDetails.media?.cover_image) imageUrlsFromAPI.push(questDetails.media.cover_image);
        if (questDetails.config?.cover_image) imageUrlsFromAPI.push(questDetails.config.cover_image);
        if (questDetails.config?.image_url) imageUrlsFromAPI.push(questDetails.config.image_url);
        if (questDetails.application?.cover_image) imageUrlsFromAPI.push(questDetails.application.cover_image);
        
        // Extract image IDs from quest details
        if (questDetails.cover_image_id) imageIds.push(questDetails.cover_image_id.toString());
        if (questDetails.image_id) imageIds.push(questDetails.image_id.toString());
        if (questDetails.config?.cover_image_id) imageIds.push(questDetails.config.cover_image_id.toString());
        console.log('[QuestInjector] Found', imageUrlsFromAPI.length, 'image URLs from API for quest', quest.id);
      }
    } catch (e) {
      console.log('[QuestInjector] Could not fetch quest details for images:', e?.message || e);
    }
    
    // Extract image IDs from quest config
    if (quest.config?.coverImageId) {
      imageIds.push(quest.config.coverImageId.toString());
    }
    if (quest.config?.cover_image_id) {
      imageIds.push(quest.config.cover_image_id.toString());
    }
    if (quest.config?.coverImage) {
      imageIds.push(quest.config.coverImage.toString());
    }
    if (quest.config?.imageId) {
      imageIds.push(quest.config.imageId.toString());
    }
    if (quest.config?.assets) {
      if (Array.isArray(quest.config.assets)) {
        quest.config.assets.forEach(asset => {
          if (asset?.id) imageIds.push(asset.id.toString());
          if (asset?.cover) imageIds.push(asset.cover.toString());
        });
      } else if (quest.config.assets.cover) {
        imageIds.push(quest.config.assets.cover.toString());
      }
    }
    if (quest.config?.icon) {
      imageIds.push(quest.config.icon.toString());
    }
    if (quest.config?.images && Array.isArray(quest.config.images)) {
      quest.config.images.forEach(img => {
        if (img?.id) imageIds.push(img.id.toString());
        if (typeof img === 'string') imageIds.push(img);
      });
    }
    if (quest.config?.application?.icon) {
      imageIds.push(quest.config.application.icon.toString());
    }
    if (quest.config?.application?.cover_image_id) {
      imageIds.push(quest.config.application.cover_image_id.toString());
    }
    if (quest.config?.application?.coverImageId) {
      imageIds.push(quest.config.application.coverImageId.toString());
    }
    
    // Remove duplicates
    imageIds = [...new Set(imageIds)];
    console.log('[QuestInjector] Found', imageIds.length, 'image IDs for quest', quest.id, ':', imageIds);
    
    // Use API method for images
    const allImageUrls = [...imageUrlsFromAPI];

    if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
      const maxFuture = 10, speed = 7, interval = 1;
      const enrolledAt = quest.userStatus?.enrolledAt ? new Date(quest.userStatus.enrolledAt).getTime() : Date.now();
      let completed = false;
      let fn = async () => {			
        while(true) {
          const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture;
          const diff = maxAllowed - secondsDone;
          const timestamp = secondsDone + speed;
          if(diff >= speed) {
            const res = await api.post({url: \`/quests/\${quest.id}/video-progress\`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
            completed = res.body.completed_at != null;
            secondsDone = Math.min(secondsNeeded, timestamp);
          }
          
          if(timestamp >= secondsNeeded) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
        if(!completed) {
          await api.post({url: \`/quests/\${quest.id}/video-progress\`, body: {timestamp: secondsNeeded}});
        }
        console.log("Quest completed!");
      };
      fn();
      console.log(\`Spoofing video for \${questName}.\`);
      const questId = quest.id?.toString() || '';
      const appId = applicationId?.toString() || '0';
      return { 
        success: true, 
        message: \`Spoofing video for \${questName}.\`,
        questId: questId, // Real Discord quest ID
        questName,
        applicationName,
        applicationId: appId,
        questImageId: questId,
        appImageId: appId,
        taskType: taskName,
        secondsNeeded,
        secondsDone,
        imageUrls: allImageUrls, // URLs from API endpoint
        imageIds: imageIds // Image IDs for cache matching
      };
    } else if(taskName === "PLAY_ON_DESKTOP") {
      if(!isApp) {
        console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!");
        return { 
          success: false, 
          message: \`This no longer works in browser for non-video quests. Use the discord desktop app to complete the \${questName} quest!\`
        };
      }
      api.get({url: \`/applications/public?application_ids=\${applicationId}\`}).then(res => {
        const appData = res.body[0];
        const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
        
        const fakeGame = {
          cmdLine: \`C:\\\\Program Files\\\\\${appData.name}\\\\\${exeName}\`,
          exeName,
          exePath: \`c:/program files/\${appData.name.toLowerCase()}/\${exeName}\`,
          hidden: false,
          isLauncher: false,
          id: applicationId,
          name: appData.name,
          pid: pid,
          pidPath: [pid],
          processName: appData.name,
          start: Date.now(),
        };
        const realGames = RunningGameStore.getRunningGames();
        const fakeGames = [fakeGame];
        const realGetRunningGames = RunningGameStore.getRunningGames;
        const realGetGameForPID = RunningGameStore.getGameForPID;
        RunningGameStore.getRunningGames = () => fakeGames;
        RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
        FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});
        
        let fn = data => {
          let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
          console.log(\`Quest progress: \${progress}/\${secondsNeeded}\`);
          
          if(progress >= secondsNeeded) {
            console.log("Quest completed!");
            
            RunningGameStore.getRunningGames = realGetRunningGames;
            RunningGameStore.getGameForPID = realGetGameForPID;
            FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
          }
        };
        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        
        console.log(\`Spoofed your game to \${applicationName}. Wait for \${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.\`);
      });
      const questId = quest.id?.toString() || '';
      const appId = applicationId?.toString() || '0';
      return { 
        success: true, 
        message: \`Spoofed your game to \${applicationName}. Wait for \${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.\`,
        questId: questId, // Real Discord quest ID
        questName,
        applicationName,
        applicationId: appId,
        questImageId: questId,
        appImageId: appId,
        taskType: taskName,
        secondsNeeded,
        secondsDone,
        imageUrls: allImageUrls, // URLs from API endpoint
        imageIds: imageIds // Image IDs for cache matching
      };
    } else if(taskName === "STREAM_ON_DESKTOP") {
      if(!isApp) {
        console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!");
        return { 
          success: false, 
          message: \`This no longer works in browser for non-video quests. Use the discord desktop app to complete the \${questName} quest!\`
        };
      }
      let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
      ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
        id: applicationId,
        pid,
        sourceName: null
      });
      
      let fn = data => {
        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
        console.log(\`Quest progress: \${progress}/\${secondsNeeded}\`);
        
        if(progress >= secondsNeeded) {
          console.log("Quest completed!");
          
          ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
          FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
        }
      };
      FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
      
      console.log(\`Spoofed your stream to \${applicationName}. Stream any window in vc for \${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.\`);
      console.log("Remember that you need at least 1 other person to be in the vc!");
      const questId = quest.id?.toString() || '';
      const appId = applicationId?.toString() || '0';
      return { 
        success: true, 
        message: \`Spoofed your stream to \${applicationName}. Stream any window in vc for \${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes. Remember that you need at least 1 other person to be in the vc!\`,
        questId: questId, // Real Discord quest ID
        questName,
        applicationName,
        applicationId: appId,
        questImageId: questId,
        appImageId: appId,
        taskType: taskName,
        secondsNeeded,
        secondsDone,
        imageUrls: allImageUrls, // URLs from API endpoint
        imageIds: imageIds // Image IDs for cache matching
      };
    } else if(taskName === "PLAY_ACTIVITY") {
      const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
      const streamKey = \`call:\${channelId}:1\`;
      
      let fn = async () => {
        console.log("Completing quest", questName, "-", quest.config.messages.questName);
        
        while(true) {
          const res = await api.post({url: \`/quests/\${quest.id}/heartbeat\`, body: {stream_key: streamKey, terminal: false}});
          const progress = res.body.progress.PLAY_ACTIVITY.value;
          console.log(\`Quest progress: \${progress}/\${secondsNeeded}\`);
          
          await new Promise(resolve => setTimeout(resolve, 20 * 1000));
          
          if(progress >= secondsNeeded) {
            await api.post({url: \`/quests/\${quest.id}/heartbeat\`, body: {stream_key: streamKey, terminal: true}});
            break;
          }
        }
        
        console.log("Quest completed!");
      };
      fn();
      const questId = quest.id?.toString() || '';
      const appId = applicationId?.toString() || '0';
      return { 
        success: true, 
        message: \`Completing quest: \${questName}\`,
        questId: questId, // Real Discord quest ID
        questName,
        applicationName,
        applicationId: appId,
        questImageId: questId,
        appImageId: appId,
        taskType: taskName,
        secondsNeeded,
        secondsDone,
        imageUrls: allImageUrls, // URLs from API endpoint
        imageIds: imageIds // Image IDs for cache matching
      };
    }
  } catch (error) {
    console.error('[QuestInjector] Script error:', error?.message, error?.stack);
    return {
      success: false,
      message: error?.message || "Unknown error occurred",
    };
  }
})`;

const GET_USER_INFO_CODE = `
(async function() {
  try {
    let userInfo = {
      username: null,
      displayName: null,
      userId: null,
      avatarURL: null,
      discriminator: null,
      avatar: null,
      banner: null,
      bannerURL: null,
      bannerColor: null
    };
    
    // ========================================
    // MÃ‰TODO 1: Token JWT - MAIS CONFIÃVEL
    // ========================================
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token')?.replace(/"/g, '');
        if (token) {
          const parts = token.split('.');
          if (parts.length > 1) {
            const payload = JSON.parse(atob(parts[1]));
            userInfo.userId = payload.user_id || payload.id;
          }
        } else {
          // Try other possible token keys
          const tokenKeys = ['token', 'authToken', 'discord_token', 'access_token'];
          for (const key of tokenKeys) {
            const tokenValue = localStorage.getItem(key);
            if (tokenValue) {
              try {
                const parts = tokenValue.replace(/"/g, '').split('.');
                if (parts.length > 1) {
                  const payload = JSON.parse(atob(parts[1]));
                  userInfo.userId = payload.user_id || payload.id;
                  break;
                }
              } catch (e) {
                // Not a JWT token, continue
              }
            }
          }
        }
      }
    } catch (e) {
      // Silent fail
    }
    
    // ========================================
    // MÃ‰TODO 2: API /users/@me - SEU USUÃRIO
    // ========================================
    if (userInfo.userId || typeof window !== 'undefined') {
      try {
        let token = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          token = localStorage.getItem('token')?.replace(/"/g, '');
          if (!token) {
            // Try other token keys
            const tokenKeys = ['token', 'authToken', 'discord_token', 'access_token'];
            for (const key of tokenKeys) {
              const tokenValue = localStorage.getItem(key);
              if (tokenValue) {
                token = tokenValue.replace(/"/g, '');
                break;
              }
            }
          }
        }
        
        if (token) {
          // Add timeout to fetch
          const fetchPromise = fetch('https://discord.com/api/v9/users/@me', {
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 10000)
          );
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (response.ok) {
            const data = await response.json();
            
            // Validate response has user data
            if (data && (data.id || data.username)) {
              userInfo.username = data.username;
              userInfo.displayName = data.global_name || data.username;
              userInfo.userId = data.id || userInfo.userId;
              userInfo.discriminator = data.discriminator;
              userInfo.avatar = data.avatar;
              userInfo.banner = data.banner || null;
              userInfo.bannerColor = data.banner_color || data.bannerColor || null;
              
              if (data.avatar && userInfo.userId) {
                const ext = data.avatar.startsWith('a_') ? 'gif' : 'png';
                userInfo.avatarURL = \`https://cdn.discordapp.com/avatars/\${userInfo.userId}/\${data.avatar}.\${ext}?size=256\`;
              }
              
              if (userInfo.banner && userInfo.userId) {
                const isAnimatedBanner = userInfo.banner.startsWith('a_');
                const bannerExt = isAnimatedBanner ? 'gif' : 'webp';
                const animatedParam = isAnimatedBanner ? '&animated=true' : '';
                userInfo.bannerURL = \`https://cdn.discordapp.com/banners/\${userInfo.userId}/\${userInfo.banner}.\${bannerExt}?size=600\${animatedParam}\`;
              }
            }
          }
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    // ========================================
    // MÃ‰TODO 3: Webpack - Fallback
    // ========================================
    if (!userInfo.username) {
      try {
        delete window.$;
        
        let wpRequire = webpackChunkdiscord_app.push([['autoquest_user_' + Date.now()], {}, r => r]);
        webpackChunkdiscord_app.pop();
        
        const modules = Object.values(wpRequire.c);
        
        for (const mod of modules) {
          try {
            const exp = mod?.exports;
            if (exp?.default?.getCurrentUser || exp?.Z?.getCurrentUser || exp?.ZP?.getCurrentUser) {
              const store = exp.default || exp.Z || exp.ZP || exp;
              const user = store.getCurrentUser();
              if (user && user.id) {
                userInfo.username = user.username;
                userInfo.displayName = user.globalName || user.global_name || user.username;
                userInfo.userId = user.id;
                userInfo.discriminator = user.discriminator;
                
                if (user.avatar && userInfo.userId) {
                  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
                  userInfo.avatarURL = \`https://cdn.discordapp.com/avatars/\${userInfo.userId}/\${user.avatar}.\${ext}?size=256\`;
                  userInfo.avatar = user.avatar;
                }
                
                if (user.banner) {
                  userInfo.banner = user.banner;
                  userInfo.bannerColor = user.bannerColor || user.banner_color || null;
                  if (userInfo.userId) {
                    const isAnimatedBanner = user.banner.startsWith('a_');
                    const bannerExt = isAnimatedBanner ? 'gif' : 'webp';
                    const animatedParam = isAnimatedBanner ? '&animated=true' : '';
                    userInfo.bannerURL = \`https://cdn.discordapp.com/banners/\${userInfo.userId}/\${user.banner}.\${bannerExt}?size=600\${animatedParam}\`;
                  }
                }
                
                break;
              }
            }
          } catch (e) {
            // Continue to next module
          }
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    // ========================================
    // MÃ‰TODO 4: Buscar avatar no DOM
    // ========================================
    if (!userInfo.avatarURL && userInfo.userId) {
      try {
        // Procura pela Ã¡rea do usuÃ¡rio (canto inferior esquerdo)
        const panels = document.querySelectorAll('[class*="panels"]');
        
        for (const panel of panels) {
          const avatar = panel.querySelector(\`img[src*="\${userInfo.userId}"]\`);
          if (avatar) {
            userInfo.avatarURL = avatar.src.split('?')[0] + '?size=256';
            break;
          }
        }
        
        // Fallback: busca em todos os avatares com seu ID
        if (!userInfo.avatarURL) {
          const allAvatars = document.querySelectorAll('img[src*="avatars"]');
          for (const img of allAvatars) {
            if (img.src.includes(userInfo.userId)) {
              userInfo.avatarURL = img.src.split('?')[0] + '?size=256';
              break;
            }
          }
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    // ========================================
    // RESULTADO FINAL
    // ========================================
    if (userInfo.userId) {
      // Build avatar URL if we have avatar hash but not URL
      if (!userInfo.avatarURL && userInfo.avatar && userInfo.userId) {
        const ext = userInfo.avatar.startsWith('a_') ? 'gif' : 'png';
        userInfo.avatarURL = \`https://cdn.discordapp.com/avatars/\${userInfo.userId}/\${userInfo.avatar}.\${ext}?size=256\`;
      }
      
      // Fallback to default avatar if no avatar URL
      if (!userInfo.avatarURL && userInfo.userId) {
        try {
          const userIdNum = BigInt(userInfo.userId);
          const defaultAvatarIndex = Number(userIdNum % 5n);
          userInfo.avatarURL = \`https://cdn.discordapp.com/embed/avatars/\${defaultAvatarIndex}.png\`;
        } catch (e) {
          userInfo.avatarURL = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
      }
      
      if (!userInfo.bannerURL && userInfo.banner && userInfo.userId) {
        const isAnimatedBanner = userInfo.banner.startsWith('a_');
        const bannerExt = isAnimatedBanner ? 'gif' : 'webp';
        const animatedParam = isAnimatedBanner ? '&animated=true' : '';
        userInfo.bannerURL = \`https://cdn.discordapp.com/banners/\${userInfo.userId}/\${userInfo.banner}.\${bannerExt}?size=600\${animatedParam}\`;
      }
      
      return {
        success: true,
        user: {
          id: userInfo.userId,
          username: userInfo.username || 'UsuÃ¡rio',
          displayName: userInfo.displayName || userInfo.username || 'UsuÃ¡rio',
          globalName: userInfo.displayName || userInfo.username || 'UsuÃ¡rio',
          discriminator: userInfo.discriminator || '0000',
          avatar: userInfo.avatar || null,
          avatarUrl: userInfo.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png',
          banner: userInfo.banner || null,
          bannerUrl: userInfo.bannerURL || null,
          bannerColor: userInfo.bannerColor || null
        }
      };
    } else {
      return { success: false, message: "Could not extract user information", user: null };
    }
  } catch (error) {
    return { success: false, message: error?.message || "Unknown error", user: null };
  }
})();
`;

export class DiscordInjector {
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  private formatError(error: unknown): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error instanceof Error) {
      return error.message || error.stack || 'Unknown error';
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  async getUserInfo(): Promise<{ success: boolean; user: any; message?: string }> {
    try {
      await ensureDiscordRunningWithDebug();
      const client = await this.attachToDiscord();

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Use a longer timeout for user info retrieval (60 seconds)
        const evaluation = (await Promise.race([
          client.Runtime.evaluate({
            expression: GET_USER_INFO_CODE,
            awaitPromise: true,
            returnByValue: true,
            timeout: 60000, // 60 seconds timeout
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('User info retrieval timeout')), 60000)
          ),
        ])) as any;

        const result = evaluation.result?.value;

        if (result && result.success && result.user) {
          this.sendLog('info', 'Loaded User');
          return { success: true, user: result.user };
        }

        return {
          success: false,
          user: null,
          message: result?.message || 'Failed to load user info',
        };
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        user: null,
        message: `Failed to load user info: ${errorMessage}`,
      };
    }
  }

  async getAllQuests(): Promise<{ success: boolean; quests: any[]; message?: string }> {
    try {
      await ensureDiscordRunningWithDebug();
      const client = await this.attachToDiscord();

      try {
        this.sendLog('info', 'Loading available quests...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const evaluation = await client.Runtime.evaluate({
          expression: GET_ALL_QUESTS_CODE,
          awaitPromise: true,
          returnByValue: true,
        });

        const result = evaluation.result?.value;

        if (result && result.success) {
          this.sendLog('info', `Found ${result.quests.length} available quests`);
          return { success: true, quests: result.quests || [] };
        }

        const message = result?.message || 'Failed to load quests';
        this.sendLog('error', message);
        return { success: false, quests: [], message };
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      const details = this.formatError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendLog('error', `Failed to load quests: ${details}`);
      return {
        success: false,
        quests: [],
        message: `Failed to load quests: ${errorMessage}`,
      };
    }
  }

  async injectWebSocket(): Promise<void> {
    try {
      await ensureDiscordRunningWithDebug();
      const client = await this.attachToDiscord();

      try {
        this.sendLog('info', 'Injecting WebSocket client into Discord...');

        await client.Runtime.evaluate({
          expression: WEBSOCKET_INJECTION_CODE,
          returnByValue: false,
        });

        this.sendLog('success', 'WebSocket client injected successfully');
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      const details = this.formatError(error);
      this.sendLog('error', `Error injecting WebSocket: ${details}`);
    }
  }

  async injectCode(questId?: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      await ensureDiscordRunningWithDebug();
      const client = await this.attachToDiscord();

      try {
        this.sendLog(
          'info',
          questId
            ? `Executing quest ${questId}...`
            : 'Waiting for Discord internals to finish loading...'
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Create the code with questId parameter - wrap in parentheses to ensure proper IIFE
        const questIdParam = questId ? JSON.stringify(questId) : 'undefined';
        const codeWithQuestId = `(${QUEST_AUTOMATION_CODE})(${questIdParam})`;

        const evaluation = await client.Runtime.evaluate({
          expression: codeWithQuestId,
          awaitPromise: true,
          returnByValue: true,
        });

        const result = evaluation.result?.value;

        if (result && result.success) {
          this.sendLog('success', result.message || 'Quest automation completed');
          return {
            success: true,
            message: result.message || 'Quest automation completed',
            data: result,
          };
        }

        const message = result?.message || 'Quest automation failed';
        this.sendLog('error', message);
        return { success: false, message };
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      const details = this.formatError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendLog('error', `Quest automation error: ${details}`);
      return {
        success: false,
        message: `Quest automation error: ${errorMessage}`,
      };
    }
  }

  private async attachToDiscord(): Promise<Client> {
    const discordTarget = await this.waitForDiscordTarget();

    const client = await CDP({ target: discordTarget, port: DISCORD_DEBUG_PORT });
    await client.Runtime.enable();
    await this.waitForDiscordReady(client);

    client.Runtime.consoleAPICalled((event: any) => {
      const { type, args } = event;
      const message = (args || []).map((arg: any) => arg.value ?? arg.description ?? '').join(' ');

      // Filter out Discord's internal i18n warnings (not relevant to our functionality)
      if (message.includes('Requested message') && message.includes('does not have a value')) {
        return; // Skip this warning
      }

      // Always show QuestImages and QuestLoader logs for debugging
      const isQuestLog =
        message.includes('[QuestImages]') ||
        message.includes('[QuestLoader]') ||
        message.includes('[QuestInjector]');

      const level = this.mapConsoleType(type);
      if (message.trim() && (isQuestLog || !message.includes('['))) {
        this.sendLog(level, message);
      }
    });

    return client;
  }

  private async waitForDiscordTarget(): Promise<ListTarget> {
    const timeout = 30000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const targets = await CDP.List({ port: DISCORD_DEBUG_PORT });
        const discordTarget = targets.find((target: ListTarget) => {
          if (target.type !== 'page') return false;
          const url = target.url ?? '';
          return (
            url.startsWith('https://discord.com') ||
            url.startsWith('https://canary.discord.com') ||
            url.startsWith('https://ptb.discord.com') ||
            url.startsWith('app://discord') ||
            url.includes('discordapp')
          );
        });

        if (discordTarget) {
          return discordTarget;
        }
      } catch (error) {
        // ignore and retry
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Unable to find Discord desktop target. Make sure Discord is fully opened.');
  }

  private async waitForDiscordReady(client: Client): Promise<void> {
    const timeout = 30000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const evaluation = await client.Runtime.evaluate({
        expression: 'typeof webpackChunkdiscord_app !== "undefined"',
        returnByValue: true,
      });
      if (evaluation.result?.value) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('Discord is still loading. Please wait a few seconds and try again.');
  }

  private mapConsoleType(type: string): 'info' | 'warning' | 'error' | 'success' {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  private sendLog(level: string, message: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('quest-log', {
        timestamp: Date.now(),
        message,
        level,
      });
    }
  }

  async getQuestImagesFromCache(
    questIds: string[],
    historyData?: Array<{
      id: string;
      appImageId?: string;
      applicationId?: string;
      imageIds?: string[];
    }>
  ): Promise<{ success: boolean; imageMap: Record<string, string>; message?: string }> {
    const GET_QUEST_IMAGES_FROM_CACHE_CODE = `
(async function() {
  try {
    const questIds = ${JSON.stringify(questIds)};
    const historyData = ${JSON.stringify(historyData || [])};
    const imageMap = {};
    const allFoundImages = new Set(); // Track all found .jpg?format=webp images
    
    // First, get quest data from QuestsStore to know which applicationId corresponds to each questId
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();
    
    let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
    
    if (!QuestsStore) {
      return {
        success: false,
        imageMap: {},
        message: 'QuestsStore not found'
      };
    }
    
    // Build a map of questId -> applicationId and imageIds
    const questDataMap = {};
    try {
      let allQuestsRaw = [];
      if (QuestsStore.quests instanceof Map) {
        allQuestsRaw = [...QuestsStore.quests.values()];
      } else if (QuestsStore.quests.values) {
        allQuestsRaw = [...QuestsStore.quests.values()];
      } else if (Array.isArray(QuestsStore.quests)) {
        allQuestsRaw = QuestsStore.quests;
      } else {
        const questIdsFromStore = Object.keys(QuestsStore.quests || {});
        allQuestsRaw = questIdsFromStore.map(id => QuestsStore.getQuest(id)).filter(q => q);
      }
      
      // Filter to only quests we're looking for
      const relevantQuests = allQuestsRaw.filter(q => {
        const questId = q?.id?.toString();
        return questId && questIds.includes(questId);
      });
      
      // Build quest data map
      relevantQuests.forEach(quest => {
        const questId = quest.id?.toString();
        if (!questId) return;
        
        const appId = quest.config?.application?.id?.toString() || '0';
        let imageIds = [];
        
        // Extract image IDs from quest config (same logic as GET_ALL_QUESTS_CODE)
        if (quest.config?.coverImageId) {
          imageIds.push(quest.config.coverImageId.toString());
        }
        if (quest.config?.cover_image_id) {
          imageIds.push(quest.config.cover_image_id.toString());
        }
        if (quest.config?.coverImage) {
          imageIds.push(quest.config.coverImage.toString());
        }
        if (quest.config?.imageId) {
          imageIds.push(quest.config.imageId.toString());
        }
        if (quest.config?.assets) {
          if (Array.isArray(quest.config.assets)) {
            quest.config.assets.forEach(asset => {
              if (asset?.id) imageIds.push(asset.id.toString());
              if (asset?.cover) imageIds.push(asset.cover.toString());
            });
          } else if (quest.config.assets.cover) {
            imageIds.push(quest.config.assets.cover.toString());
          }
        }
        if (quest.config?.icon) {
          imageIds.push(quest.config.icon.toString());
        }
        if (quest.config?.images && Array.isArray(quest.config.images)) {
          quest.config.images.forEach(img => {
            if (img?.id) imageIds.push(img.id.toString());
            if (typeof img === 'string') imageIds.push(img);
          });
        }
        if (quest.config?.application?.icon) {
          imageIds.push(quest.config.application.icon.toString());
        }
        if (quest.config?.application?.cover_image_id) {
          imageIds.push(quest.config.application.cover_image_id.toString());
        }
        if (quest.config?.application?.coverImageId) {
          imageIds.push(quest.config.application.coverImageId.toString());
        }
        
        // Remove duplicates
        imageIds = [...new Set(imageIds)];
        
        console.log('[QuestImages] Quest', questId, '- applicationId:', appId, '- imageIds:', imageIds);
        
        questDataMap[questId] = {
          applicationId: appId,
          imageIds: imageIds,
          quest: quest
        };
      });
      
      // Add quests from history data that are not in QuestsStore
      historyData.forEach(historyItem => {
        const questId = historyItem.id;
        if (questIds.includes(questId) && !questDataMap[questId]) {
          // Use history data for quests not in store (completed quests)
          // Try appImageId first, then fallback to applicationId from history
          const appId = historyItem.appImageId || historyItem.applicationId || '0';
          const imageIds = historyItem.imageIds || [];
          
          console.log('[QuestImages] Using history data for quest', questId, '- applicationId:', appId, '- imageIds:', imageIds);
          
          questDataMap[questId] = {
            applicationId: appId,
            imageIds: imageIds,
            quest: null // Not in store
          };
        } else if (questIds.includes(questId) && questDataMap[questId]) {
          // Quest is in store, but merge history data if store data is incomplete
          const questData = questDataMap[questId];
          if (questData.applicationId === '0' && historyItem.appImageId) {
            questData.applicationId = historyItem.appImageId || historyItem.applicationId || '0';
            console.log('[QuestImages] Updated quest', questId, 'applicationId from history:', questData.applicationId);
          }
          if (questData.imageIds.length === 0 && historyItem.imageIds && historyItem.imageIds.length > 0) {
            questData.imageIds = historyItem.imageIds;
            console.log('[QuestImages] Updated quest', questId, 'imageIds from history:', questData.imageIds);
          }
        }
      });
      
      console.log('[QuestImages] Built questDataMap for', Object.keys(questDataMap).length, 'quests');
      console.log('[QuestImages] Looking for', questIds.length, 'quests, found', Object.keys(questDataMap).length, 'total (store + history)');
    } catch (e) {
      console.log('[QuestImages] Error building quest data map:', e?.message);
    }
    
    const questIdsSet = new Set(questIds);
    const QUEST_URL_REGEX = /\/quests\/([^\/]+)\/([^\/\?]+)(?:\.(?:jpg|png|webp|jpeg))?/i;
    
    const normalizeId = (value) => {
      if (value === undefined || value === null) return null;
      return value.toString().split('?')[0].split('.')[0];
    };
    
    const assignImageToQuest = (questId, url, reason) => {
      if (!questId || imageMap[questId]) return false;
      imageMap[questId] = url;
      console.log('[QuestImages] ✓ Matched quest', questId, '-', reason + ':', url);
      return true;
    };
    
    const matchUrlToQuest = (url, contextLabel = 'unknown') => {
      if (!url || typeof url !== 'string') return false;
      if (!url.includes('cdn.discordapp.com') || !url.includes('/quests/')) return false;
      
      const urlMatch = url.match(QUEST_URL_REGEX);
      if (!urlMatch) return false;
      
      const folderId = normalizeId(urlMatch[1]);
      const imageId = normalizeId(urlMatch[2]);
      let matched = false;
      
      if (folderId && questIdsSet.has(folderId)) {
        matched = assignImageToQuest(folderId, url, contextLabel + ' folderId match');
      }
      
      if (!matched && imageId && questIdsSet.has(imageId)) {
        matched = assignImageToQuest(imageId, url, contextLabel + ' filename match');
      }
      
      if (!matched && imageId) {
        for (const questId in questDataMap) {
          const questData = questDataMap[questId];
          if (!questData || !questData.imageIds || questData.imageIds.length === 0) continue;
          if (questData.imageIds.includes(imageId)) {
            matched = assignImageToQuest(questId, url, contextLabel + ' imageId match (' + imageId + ')');
            if (matched) break;
          }
        }
      }
      
      if (!matched && folderId) {
        for (const questId in questDataMap) {
          const questData = questDataMap[questId];
          if (!questData) continue;
          if (questData.applicationId === folderId && questData.applicationId !== '0') {
            matched = assignImageToQuest(questId, url, contextLabel + ' applicationId fallback (' + folderId + ')');
            if (matched) break;
          }
        }
      }
      
      if (!matched && folderId) {
        const relatedQuests = Object.keys(questDataMap).filter(qId => questDataMap[qId].applicationId === folderId);
        if (relatedQuests.length === 0) {
          console.log('[QuestImages] ⚠ Image not matched - no quests with folder/applicationId:', folderId, 'URL:', url);
        }
      }
      
      return matched;
    };
    
    // ========================================
    // METHOD 1: Buscar TODAS as imagens do DOM
    // ========================================
    try {
      const allImages = document.querySelectorAll('img');
      let foundQuestImages = 0;
      allImages.forEach((img) => {
        const src = img.src || img.getAttribute('src') || '';
        
        // Filter: Images from Discord CDN quests
        if (src.includes('cdn.discordapp.com') && 
            src.includes('quest')) {
          
          allFoundImages.add(src);
          foundQuestImages++;
          
          // Try to match with quests
          // URL format: https://cdn.discordapp.com/quests/{applicationId}/{imageId}.*
          // Handle both with and without query parameters
          const urlMatch = src.match(/\\/quests\\/([^\\/]+)\\/([^\\/\\?]+)(?:\\.(jpg|png|webp|jpeg))?/);
          if (urlMatch) {
            const applicationId = urlMatch[1];
            const questIdFromFolder = questIds.includes(applicationId) ? applicationId : null;
            // Extract imageId - remove file extension if present
            let imageId = urlMatch[2];
            // Remove extension if it's part of the captured group
            if (imageId.includes('.')) {
              imageId = imageId.split('.')[0];
            }
            
            // Find which questId this image belongs to
            // Priority 1: Match by exact imageId (most specific)
            let matchedByImageId = false;
            for (const questId in questDataMap) {
              const questData = questDataMap[questId];
              if (questData.applicationId === applicationId && questData.imageIds.length > 0) {
                if (questData.imageIds.includes(imageId)) {
                  // Exact imageId match - highest priority
                  if (!imageMap[questId]) {
                    imageMap[questId] = src;
                    matchedByImageId = true;
                    console.log('[QuestImages] ✓ Matched quest', questId, 'to image by imageId:', imageId, 'URL:', src);
                  }
                }
              }
            }
            
            // Priority 2: If no exact imageId match, use applicationId as fallback (even if quest has imageIds)
            if (!matchedByImageId) {
              for (const questId in questDataMap) {
                const questData = questDataMap[questId];
                if (questData.applicationId === applicationId && questData.applicationId !== '0' && !imageMap[questId]) {
                  // Use applicationId fallback - assign to first quest with matching applicationId
                  imageMap[questId] = src;
                  matchedByImageId = true;
                  console.log('[QuestImages] ✓ Matched quest', questId, 'to image by applicationId (fallback):', applicationId, 'ImageId from URL:', imageId, 'URL:', src);
                  break; // Only assign to first matching quest to avoid duplicates
                }
              }
            }
            
            // Log if image wasn't matched to any quest
            if (!matchedByImageId && Object.keys(questDataMap).length > 0) {
              const matchingQuests = Object.keys(questDataMap).filter(qId => questDataMap[qId].applicationId === applicationId);
              if (matchingQuests.length === 0) {
                console.log('[QuestImages] ⚠ Image not matched - no quests with applicationId:', applicationId, 'ImageId:', imageId, 'URL:', src);
              }
            }

            // Priority 3: Direct questId match using folderId (Discord stores quests/<questId>/...)
            if (!imageMap[questIdFromFolder] && questIdFromFolder) {
              imageMap[questIdFromFolder] = src;
              console.log('[QuestImages] ✓ Matched quest', questIdFromFolder, 'to image via folder ID fallback:', src);
            }
          }
        }
      });
      console.log('[QuestImages] Found', foundQuestImages, 'quest images in DOM');
    } catch (e) {
      console.log('[QuestImages] DOM method failed:', e?.message);
    }
    
    // ========================================
    // METHOD 2: Buscar via Network (Performance API)
    // ========================================
    try {
      if ('performance' in window && performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        const questResources = resources.filter(r => {
          const url = r.name || '';
          return url.includes('cdn.discordapp.com') && 
                 url.includes('quest');
        });
        
        questResources.forEach((resource) => {
          const url = resource.name;
          if (url && !allFoundImages.has(url)) {
            allFoundImages.add(url);
            
            // Try to match with quests
            const urlMatch = url.match(/\\/quests\\/([^\\/]+)\\/([^\\/\\?]+)(?:\\.(jpg|png|webp|jpeg))?/);
            if (urlMatch) {
              const applicationId = urlMatch[1];
              const questIdFromFolder = questIds.includes(applicationId) ? applicationId : null;
              // Extract imageId - remove file extension if present
              let imageId = urlMatch[2];
              // Remove extension if it's part of the captured group
              if (imageId.includes('.')) {
                imageId = imageId.split('.')[0];
              }
              
              for (const questId in questDataMap) {
                const questData = questDataMap[questId];
                if (questData.applicationId === applicationId) {
                  if (questData.imageIds.length === 0 || questData.imageIds.includes(imageId)) {
                    if (!imageMap[questId]) {
                      imageMap[questId] = url;
                    }
                  }
                }
              }

              if (!imageMap[questIdFromFolder] && questIdFromFolder) {
                imageMap[questIdFromFolder] = url;
                console.log('[QuestImages] ✓ Matched quest', questIdFromFolder, 'to image via folder ID fallback:', url);
              }
            }
          }
        });
      }
    } catch (e) {
      console.log('[QuestImages] Performance API method failed:', e?.message);
    }
    
    // ========================================
    // METHOD 3: Cache API
    // ========================================
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
              const url = request.url;
              // Filter: Quest images
              if (url.includes('quest') && 
                  !allFoundImages.has(url)) {
                
                allFoundImages.add(url);
                
                const urlMatch = url.match(/\\/quests\\/([^\\/]+)\\/([^\\/\\?]+)\\.(jpg|png|webp)/);
                if (urlMatch) {
                  const applicationId = urlMatch[1];
                  const questIdFromFolder = questIds.includes(applicationId) ? applicationId : null;
                  const imageId = urlMatch[2];
                  
                  for (const questId in questDataMap) {
                    const questData = questDataMap[questId];
                    if (questData.applicationId === applicationId) {
                      if (questData.imageIds.length === 0 || questData.imageIds.includes(imageId)) {
                        if (!imageMap[questId]) {
                          imageMap[questId] = url;
                        }
                      }
                    }
                  }

                  if (!imageMap[questIdFromFolder] && questIdFromFolder) {
                    imageMap[questIdFromFolder] = url;
                    console.log('[QuestImages] ✓ Matched quest', questIdFromFolder, 'to image via folder ID fallback (cache API):', url);
                  }
                }
              }
            }
          } catch (e) {
            // Continue to next cache
          }
        }
      }
    } catch (e) {
      console.log('[QuestImages] Cache API method failed:', e?.message);
    }
    
    // ========================================
    // METHOD 4: IndexedDB
    // ========================================
    try {
      if ('indexedDB' in window) {
        const dbRequest = indexedDB.open('discord', 1);
        await new Promise((resolve, reject) => {
          dbRequest.onsuccess = () => resolve(dbRequest.result);
          dbRequest.onerror = () => reject(dbRequest.error);
        });
        
        const db = dbRequest.result;
        const objectStoreNames = Array.from(db.objectStoreNames);
        
        for (const storeName of objectStoreNames) {
          try {
            if (storeName.includes('quest') || storeName.includes('cache') || storeName.includes('image')) {
              const transaction = db.transaction([storeName], 'readonly');
              const store = transaction.objectStore(storeName);
              
              if (store) {
                const getAllRequest = store.getAll();
                await new Promise((resolve, reject) => {
                  getAllRequest.onsuccess = () => {
                    const data = getAllRequest.result;
                    if (Array.isArray(data)) {
                      data.forEach(item => {
                        const url = item?.url || item?.key || item?.value || '';
                        // Filter: Quest images
                        if (url && 
                            url.includes('quest') && 
                            !allFoundImages.has(url)) {
                          
                          allFoundImages.add(url);
                          
                          const urlMatch = url.match(/\\/quests\\/([^\\/]+)\\/([^\\/\\?]+)\\.(jpg|png|webp)/);
                          if (urlMatch) {
                            const applicationId = urlMatch[1];
                            const questIdFromFolder = questIds.includes(applicationId) ? applicationId : null;
                            const imageId = urlMatch[2];
                            
                            // Priority 1: Match by exact imageId (most specific)
                            let matchedByImageId = false;
                            for (const questId in questDataMap) {
                              const questData = questDataMap[questId];
                              if (questData.applicationId === applicationId && questData.imageIds.length > 0) {
                                if (questData.imageIds.includes(imageId)) {
                                  if (!imageMap[questId]) {
                                    imageMap[questId] = url;
                                    matchedByImageId = true;
                                  }
                                }
                              }
                            }
                            
                            // Priority 2: If no exact imageId match, use applicationId as fallback
                            if (!matchedByImageId) {
                              for (const questId in questDataMap) {
                                const questData = questDataMap[questId];
                                if (questData.applicationId === applicationId && !imageMap[questId]) {
                                  if (questData.imageIds.length === 0) {
                                    imageMap[questId] = url;
                                  }
                                }
                              }
                            }

                            if (!imageMap[questIdFromFolder] && questIdFromFolder) {
                              imageMap[questIdFromFolder] = url;
                              console.log('[QuestImages] ✓ Matched quest', questIdFromFolder, 'to image via folder ID fallback (IndexedDB):', url);
                            }
                          }
                        }
                      });
                    }
                    resolve(null);
                  };
                  getAllRequest.onerror = () => reject(getAllRequest.error);
                });
              }
            }
          } catch (e) {
            // Continue to next store
          }
        }
      }
    } catch (e) {
      console.log('[QuestImages] IndexedDB method failed:', e?.message);
    }
    
    // ========================================
    // METHOD 5: Service Worker cache
    // ========================================
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            try {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              
              for (const request of requests) {
                const url = request.url;
                // Filter: Quest images
                if (url.includes('quest') && 
                    !allFoundImages.has(url)) {
                  
                  allFoundImages.add(url);
                  
                  const urlMatch = url.match(/\\/quests\\/([^\\/]+)\\/([^\\/\\?]+)\\.(jpg|png|webp)/);
                  if (urlMatch) {
                    const applicationId = urlMatch[1];
                    const questIdFromFolder = questIds.includes(applicationId) ? applicationId : null;
                    const imageId = urlMatch[2];
                    
                    // Priority 1: Match by exact imageId (most specific)
                    let matchedByImageId = false;
                    for (const questId in questDataMap) {
                      const questData = questDataMap[questId];
                      if (questData.applicationId === applicationId && questData.imageIds.length > 0) {
                        if (questData.imageIds.includes(imageId)) {
                          if (!imageMap[questId]) {
                            imageMap[questId] = url;
                            matchedByImageId = true;
                          }
                        }
                      }
                    }
                    
                    // Priority 2: If no exact imageId match, use applicationId as fallback (even if quest has imageIds)
                    if (!matchedByImageId) {
                      for (const questId in questDataMap) {
                        const questData = questDataMap[questId];
                        if (questData.applicationId === applicationId && questData.applicationId !== '0' && !imageMap[questId]) {
                          // Use applicationId fallback - assign to first quest with matching applicationId
                          imageMap[questId] = url;
                          matchedByImageId = true;
                          console.log('[QuestImages] ✓ Matched quest', questId, 'to image by applicationId (fallback):', applicationId, 'ImageId from URL:', imageId, 'URL:', url);
                          break; // Only assign to first matching quest to avoid duplicates
                        }
                      }
                    }

                    if (!imageMap[questIdFromFolder] && questIdFromFolder) {
                      imageMap[questIdFromFolder] = url;
                      console.log('[QuestImages] ✓ Matched quest', questIdFromFolder, 'to image via folder ID fallback (ServiceWorker):', url);
                    }
                  }
                }
              }
            } catch (e) {
              // Continue to next cache
            }
          }
        }
      }
    } catch (e) {
      console.log('[QuestImages] Service Worker method failed:', e?.message);
    }
    
    // ========================================
    // METHOD 6: Direct CDN fallback (quests/<id>/<image>.jpg?format=webp)
    // ========================================
    try {
      const FALLBACK_SUFFIXES = [
        '?format=webp&width=1320&height=370',
        '?format=webp&width=660&height=185',
        '?format=webp&size=600'
      ];
      
      const historyLookup = {};
      historyData.forEach(item => {
        historyLookup[item.id] = item;
      });
      
      for (const questId of questIds) {
        if (imageMap[questId]) continue;
        const questData = questDataMap[questId] || {};
        const candidateIds = new Set();
        
        (questData.imageIds || []).forEach(id => {
          if (id) candidateIds.add(id.toString());
        });
        
        if (historyLookup[questId]) {
          const historyItem = historyLookup[questId];
          (historyItem.imageIds || []).forEach(id => {
            if (id) candidateIds.add(id.toString());
          });
          if (historyItem.applicationId && historyItem.applicationId !== '0') {
            candidateIds.add(historyItem.applicationId.toString());
          }
          if (historyItem.appImageId && historyItem.appImageId !== '0') {
            candidateIds.add(historyItem.appImageId.toString());
          }
        }
        
        if (questData.applicationId && questData.applicationId !== '0') {
          candidateIds.add(questData.applicationId.toString());
        }
        
        candidateIds.add(questId.toString());
        
        for (const candidateId of candidateIds) {
          let matched = false;
          for (const suffix of FALLBACK_SUFFIXES) {
            const url = \`https://cdn.discordapp.com/quests/\${questId}/\${candidateId}.jpg\${suffix}\`;
            try {
              let response = await fetch(url, { method: 'HEAD' });
              if (!response || !response.ok) {
                response = await fetch(url, { method: 'GET', cache: 'force-cache' });
              }
              if (response && response.ok) {
                imageMap[questId] = url;
                allFoundImages.add(url);
                console.log('[QuestImages] ✓ CDN fallback match', questId, '->', url);
                matched = true;
                break;
              }
            } catch (err) {
              // Ignore fetch errors and try next candidate
            }
          }
          if (matched) break;
        }
      }
    } catch (e) {
      console.log('[QuestImages] CDN fallback method failed:', e?.message);
    }
    
    // Log results for debugging
    const matchedCount = Object.keys(imageMap).length;
    const unmatchedQuests = questIds.filter(id => !imageMap[id]);
    console.log('[QuestImages] Found images for', matchedCount, 'out of', questIds.length, 'quests');
    console.log('[QuestImages] Total images found in cache:', allFoundImages.size);
    if (unmatchedQuests.length > 0) {
      console.log('[QuestImages] Quests without images:', unmatchedQuests);
      unmatchedQuests.forEach(questId => {
        const questData = questDataMap[questId];
        if (questData) {
          console.log('[QuestImages] Quest', questId, '- applicationId:', questData.applicationId, '- imageIds:', questData.imageIds);
        } else {
          console.log('[QuestImages] Quest', questId, '- NOT FOUND in questDataMap');
        }
      });
    }
    if (matchedCount > 0) {
      console.log('[QuestImages] Matched quests:');
      Object.keys(imageMap).forEach(questId => {
        console.log('[QuestImages]   Quest', questId, '->', imageMap[questId]);
      });
    }
    
    return {
      success: true,
      imageMap: imageMap
    };
  } catch (error) {
    console.log('[QuestImages] Error:', error?.message || error);
    return {
      success: false,
      imageMap: {},
      message: error?.message || 'Unknown error'
    };
  }
})();
`;

    try {
      await ensureDiscordRunningWithDebug();
      const client = await this.attachToDiscord();

      try {
        this.sendLog('info', 'Buscando imagens das quests no cache do DevTools...');

        const result = await client.Runtime.evaluate({
          expression: GET_QUEST_IMAGES_FROM_CACHE_CODE,
          returnByValue: true,
          awaitPromise: true,
        });

        if (result.result?.value) {
          const data = result.result.value;
          if (data.success) {
            const foundCount = Object.keys(data.imageMap || {}).length;
            this.sendLog('info', `Encontradas ${foundCount} imagens no cache`);
            return {
              success: true,
              imageMap: data.imageMap || {},
            };
          } else {
            this.sendLog('warning', `Falha ao buscar imagens: ${data.message || 'Unknown error'}`);
            return {
              success: false,
              imageMap: {},
              message: data.message || 'Failed to get quest images from cache',
            };
          }
        }

        return {
          success: false,
          imageMap: {},
          message: 'No result from quest images cache lookup',
        };
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      const details = this.formatError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendLog('error', `Erro ao buscar imagens: ${details}`);
      return {
        success: false,
        imageMap: {},
        message: `Error getting quest images: ${errorMessage}`,
      };
    }
  }

  cleanup(): void {
    // No-op for now
  }
}
