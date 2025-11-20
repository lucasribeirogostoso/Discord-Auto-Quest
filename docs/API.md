# API Documentation

## IPC Communication API

This document describes the IPC (Inter-Process Communication) API between the main process and renderer process.

## Main → Renderer (Events)

### `discord-status-changed`

Emitted when Discord's running status changes.

**Payload:**
```typescript
{
  isRunning: boolean;
  process: {
    pid: number;
    name: string;
    path: string;
  } | null;
}
```

**Example:**
```typescript
window.electronAPI.onDiscordStatusChanged((data) => {
  console.log('Discord status:', data.isRunning);
  console.log('Process info:', data.process);
});
```

### `quest-log`

Emitted when a log message is generated during quest execution.

**Payload:**
```typescript
{
  timestamp: number;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}
```

**Example:**
```typescript
window.electronAPI.onQuestLog((log) => {
  console.log(`[${log.level}] ${log.message}`);
});
```

## Renderer → Main (Invocations)

### `get-settings`

Get current application settings.

**Returns:**
```typescript
{
  language: 'pt-BR' | 'en';
  autoExecute: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
  firstRun: boolean;
}
```

**Example:**
```typescript
const settings = await window.electronAPI.getSettings();
```

### `update-settings`

Update application settings.

**Parameters:**
```typescript
{
  language?: 'pt-BR' | 'en';
  autoExecute?: boolean;
  notifications?: boolean;
  theme?: 'light' | 'dark';
  firstRun?: boolean;
}
```

**Returns:** Updated settings object

**Example:**
```typescript
const updated = await window.electronAPI.updateSettings({
  theme: 'dark',
  language: 'pt-BR'
});
```

### `get-history`

Get quest execution history.

**Returns:**
```typescript
Array<{
  id: string;
  questName: string;
  applicationName: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'failure';
  taskType: string;
}>
```

**Example:**
```typescript
const history = await window.electronAPI.getHistory();
```

### `clear-history`

Clear all quest history.

**Returns:** `boolean` (success)

**Example:**
```typescript
const cleared = await window.electronAPI.clearHistory();
```

### `get-stats`

Get quest statistics.

**Returns:**
```typescript
{
  totalCompleted: number;
  totalTimeSaved: number;
  successRate: number;
  lastQuestCompleted: string | null;
}
```

**Example:**
```typescript
const stats = await window.electronAPI.getStats();
```

### `get-discord-status`

Get current Discord running status.

**Returns:**
```typescript
{
  isRunning: boolean;
  process: {
    pid: number;
    name: string;
    path: string;
  } | null;
}
```

**Example:**
```typescript
const status = await window.electronAPI.getDiscordStatus();
```

### `execute-quest-automation`

Execute quest automation.

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    questName: string;
    applicationName: string;
    taskType: string;
    secondsNeeded: number;
    secondsDone: number;
  };
}
```

**Example:**
```typescript
const result = await window.electronAPI.executeQuestAutomation();
if (result.success) {
  console.log('Quest started:', result.message);
} else {
  console.error('Failed:', result.message);
}
```

### `open-external`

Open URL in external browser.

**Parameters:** `url: string`

**Returns:** `boolean` (success)

**Example:**
```typescript
await window.electronAPI.openExternal('https://github.com');
```

## TypeScript Types

### QuestHistory
```typescript
interface QuestHistory {
  id: string;
  questName: string;
  applicationName: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'failure';
  taskType: string;
}
```

### AppSettings
```typescript
interface AppSettings {
  language: 'pt-BR' | 'en';
  autoExecute: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
  firstRun: boolean;
}
```

### Stats
```typescript
interface Stats {
  totalCompleted: number;
  totalTimeSaved: number;
  successRate: number;
  lastQuestCompleted: string | null;
}
```

### DiscordProcess
```typescript
interface DiscordProcess {
  pid: number;
  name: string;
  path: string;
}
```

### LogMessage
```typescript
interface LogMessage {
  timestamp: number;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}
```

## Usage Examples

### Complete Quest Execution Flow

```typescript
// 1. Check Discord status
const status = await window.electronAPI.getDiscordStatus();
if (!status.isRunning) {
  console.error('Discord is not running');
  return;
}

// 2. Setup log listener
const unsubscribe = window.electronAPI.onQuestLog((log) => {
  console.log(`[${log.level}] ${log.message}`);
});

// 3. Execute quest
const result = await window.electronAPI.executeQuestAutomation();

if (result.success) {
  // 4. Update UI with success
  console.log('Quest executing:', result.data);
  
  // 5. Refresh stats
  const stats = await window.electronAPI.getStats();
  console.log('Updated stats:', stats);
} else {
  console.error('Failed to execute:', result.message);
}

// 6. Cleanup
unsubscribe();
```

### Settings Management

```typescript
// Get current settings
const settings = await window.electronAPI.getSettings();

// Update theme
const updated = await window.electronAPI.updateSettings({
  theme: settings.theme === 'dark' ? 'light' : 'dark'
});

// Apply theme
document.documentElement.classList.toggle('dark', updated.theme === 'dark');
```

### History Management

```typescript
// Get history
const history = await window.electronAPI.getHistory();

// Filter successful quests
const successful = history.filter(h => h.status === 'success');

// Clear all history
if (confirm('Clear all history?')) {
  await window.electronAPI.clearHistory();
  // Refresh display
  const newHistory = await window.electronAPI.getHistory();
}
```

## Security Notes

1. **Context Isolation**: All IPC communication goes through the preload script with context isolation enabled
2. **No Direct Node Access**: Renderer process cannot directly access Node.js APIs
3. **Validation**: All inputs are validated in the main process
4. **Local Only**: No external API calls or network requests
5. **Safe Methods Only**: Only specific, safe methods are exposed to renderer

## Error Handling

All IPC invocations can throw errors. Always use try-catch:

```typescript
try {
  const result = await window.electronAPI.executeQuestAutomation();
  // Handle success
} catch (error) {
  console.error('IPC error:', error);
  // Handle error
}
```

## Performance Tips

1. **Batch Operations**: Group multiple IPC calls when possible
2. **Debounce Updates**: Debounce frequent setting updates
3. **Unsubscribe Events**: Always unsubscribe from events when component unmounts
4. **Cache Data**: Cache frequently accessed data like settings
5. **Lazy Load**: Load history and stats only when needed

---

For implementation details, see:
- `src/preload/index.ts` - IPC bridge
- `src/main/index.ts` - IPC handlers
- `src/types/electron.d.ts` - TypeScript definitions

