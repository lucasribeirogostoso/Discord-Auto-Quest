const fs = require('fs');
const path = 'src/main/discord-injector.ts';
const original = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const startMarker = '    } else if(taskName ===  PLAY_ON_DESKTOP) {';
const endMarker = '    } else if(taskName === STREAM_ON_DESKTOP) {';
const start = original.indexOf(startMarker);
const end = original.indexOf(endMarker);
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Markers not found');
}
const before = original.slice(0, start);
const after = original.slice(end);
const newBlock =     } else if(taskName === PLAY_ON_DESKTOP) {
      if(!isApp) {
        return { 
          success: false, 
          message: \This no longer works in browser for non-video quests. Use the discord desktop app to complete the \ quest!\
        };
      }

      const appData = await api.get({url: \/applications/public?application_ids=\\}).then(res => res.body[0]);
      const exeName = appData.executables.find(x => x.os === win32).name.replace(>,);

 const fakeGame = {
 cmdLine: \C:\\\\Program Files\\\\\\\\\\\,
 exeName,
 exePath: \c:/program files/\/\\,
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
 FluxDispatcher.dispatch({type: RUNNING_GAMES_CHANGE, removed: realGames, added: [fakeGame], games: fakeGames});

 const restoreRunningGames = (() => {
 let restored = false;
 return () => {
 if (restored) return;
 restored = true;
 RunningGameStore.getRunningGames = realGetRunningGames;
 RunningGameStore.getGameForPID = realGetGameForPID;
 FluxDispatcher.dispatch({type: RUNNING_GAMES_CHANGE, removed: [fakeGame], added: [], games: []});
 };
 })();

 const monitorProgress = async () => {
 while(true) {
 try {
 const progress = readQuestProgress(PLAY_ON_DESKTOP);
 console.log(\Quest progress: \/\\);

 if(progress >= secondsNeeded) {
 console.log(Quest completed!);
 restoreRunningGames();
 break;
 }
 } catch (err) {
 console.error(Quest progress monitor error, err?.message);
 }
 await new Promise(resolve => setTimeout(resolve, 5000));
 }
 };

 monitorProgress().catch(err => {
 console.error(Quest monitor crashed, err?.message);
 restoreRunningGames();
 });

 return { 
 success: true, 
 message: \Spoofed your game to \. Wait for \ more minutes.\,
 questName,
 applicationName,
 taskType: taskName,
 secondsNeeded,
 secondsDone
 };
;
const updated = before + newBlock + after;
fs.writeFileSync(path, updated.replace(/\n/g, '\r\n'), 'utf8');
