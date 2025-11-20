# Architecture Documentation

## Overview

Discord Auto Quest is built using Electron with a React frontend and TypeScript throughout. The application follows a clear separation between the main process (Node.js) and renderer process (Chromium).

## Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────┐         ┌───────────────────┐        │
│  │   Main Process    │◄───IPC──►│ Renderer Process  │        │
│  │   (Node.js)       │         │   (React/UI)      │        │
│  └───────────────────┘         └───────────────────┘        │
│           │                              │                   │
│           │                              │                   │
│  ┌────────▼────────┐           ┌────────▼────────┐         │
│  │ Process Monitor │           │  UI Components  │         │
│  │ Discord Injec.  │           │  - Dashboard    │         │
│  │ Data Storage    │           │  - Stats        │         │
│  └─────────────────┘           │  - History      │         │
│                                 │  - Settings     │         │
│                                 └─────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Main Process Components

### 1. Main Process (src/main/index.ts)
- **Responsibility**: Application lifecycle, window management, IPC handlers
- **Key Functions**:
  - Create and manage the main window
  - Setup IPC communication channels
  - Initialize monitors and services
  - Handle app events (ready, quit, etc.)

### 2. Process Monitor (src/main/process-monitor.ts)
- **Responsibility**: Detect and monitor Discord processes
- **Key Features**:
  - Cross-platform process detection (Windows, macOS, Linux)
  - Periodic polling (every 3 seconds)
  - Event emission on Discord status changes
  - Support for multiple Discord variants (Stable, Canary, PTB)

### 3. Discord Injector (src/main/discord-injector.ts)
- **Responsibility**: Inject and execute quest automation code
- **How it works**:
  1. Finds Discord window among all open windows
  2. Falls back to web Discord if desktop app not found
  3. Executes JavaScript in Discord's context
  4. Captures logs and results
  5. Reports back to renderer process

### 4. Data Store (src/main/store.ts)
- **Responsibility**: Persistent data storage
- **Uses**: electron-store
- **Stores**:
  - User settings (language, theme, preferences)
  - Quest history (up to 100 entries)
  - Statistics (calculated from history)

## Renderer Process Components

### 1. State Management (src/renderer/stores/appStore.ts)
- **Framework**: Zustand
- **State Includes**:
  - Settings
  - Stats
  - History
  - Discord status
  - Logs
  - UI state
- **Actions**: All state mutations and async operations

### 2. UI Components

#### Dashboard (src/renderer/components/Dashboard.tsx)
- Shows Discord status with real-time indicator
- Execute button with state (idle/executing)
- Live console logs with color coding
- Disclaimer notice

#### Stats Panel (src/renderer/components/StatsPanel.tsx)
- Animated stat cards
- Progress visualizations
- Circular success rate indicator
- Timeline charts

#### History Panel (src/renderer/components/HistoryPanel.tsx)
- Searchable table of past quests
- Status filters (all/success/failure)
- Date/time formatting
- Clear history with confirmation

#### Settings Panel (src/renderer/components/SettingsPanel.tsx)
- Language selector (EN/PT-BR)
- Theme switcher (light/dark)
- Feature toggles (auto-execute, notifications)
- Data management (clear/reset)
- About section with links

### 3. Internationalization (src/renderer/i18n/)
- **Framework**: i18next + react-i18next
- **Languages**: English, Portuguese (BR)
- **Features**:
  - Runtime language switching
  - Fallback to English
  - Persistent language preference

## IPC Communication

### Main → Renderer Events

```typescript
// Discord status changed
'discord-status-changed' → { isRunning: boolean, process: DiscordProcess | null }

// Quest log message
'quest-log' → { timestamp: number, message: string, level: string }
```

### Renderer → Main Invocations

```typescript
// Settings
invoke('get-settings') → AppSettings
invoke('update-settings', settings) → AppSettings

// History
invoke('get-history') → QuestHistory[]
invoke('clear-history') → boolean

// Stats
invoke('get-stats') → Stats

// Discord
invoke('get-discord-status') → { isRunning: boolean, process: DiscordProcess | null }
invoke('execute-quest-automation') → { success: boolean, message: string, data?: any }

// Utility
invoke('open-external', url) → boolean
```

## Security Model

### Context Isolation
- Enabled for all windows
- Renderer has no direct access to Node.js APIs
- All communication through secure IPC bridge

### Preload Script (src/preload/index.ts)
- Exposes only specific, safe APIs to renderer
- Uses `contextBridge.exposeInMainWorld`
- No direct Node.js module access

### Data Storage
- All data stored locally
- No external API calls
- No telemetry or tracking

## Build Process

### Development
1. Vite dev server for React (port 5173)
2. Electron loads from dev server
3. Hot module replacement enabled
4. DevTools open by default

### Production
1. TypeScript compilation
2. Vite builds React app to `dist/`
3. Electron main process compiled to `dist-electron/`
4. electron-builder packages everything
5. Creates platform-specific installers in `release/`

## Data Flow

### Quest Execution Flow

```
User clicks Execute Button
         ↓
Renderer calls executeQuestAutomation()
         ↓
IPC invoke 'execute-quest-automation'
         ↓
Main process → Discord Injector
         ↓
Find Discord window/process
         ↓
Execute JavaScript in Discord context
         ↓
Quest automation runs
         ↓
Logs sent back via IPC 'quest-log' events
         ↓
Results returned to renderer
         ↓
Update history and stats
         ↓
Refresh UI
```

### Discord Detection Flow

```
Process Monitor starts
         ↓
Poll every 3 seconds
         ↓
Check for Discord processes
         ↓
Status changed?
    ├─ Yes → Emit 'discord-status-changed'
    │         ↓
    │    Renderer updates UI
    │         ↓
    │    Auto-execute if enabled
    │
    └─ No → Continue polling
```

## Technology Choices

### Why Electron?
- Cross-platform desktop support
- Access to native APIs (process monitoring)
- Can inject into other windows
- Mature ecosystem

### Why React?
- Component-based UI
- Rich ecosystem
- Excellent TypeScript support
- Fast development

### Why Zustand?
- Lightweight state management
- Simple API
- No boilerplate
- TypeScript-first

### Why Tailwind CSS?
- Utility-first approach
- Rapid development
- Consistent design system
- Small bundle size with purging

### Why i18next?
- Industry standard for i18n
- Excellent React integration
- Runtime language switching
- Powerful interpolation

## Performance Considerations

### Process Monitoring
- Polling interval: 3 seconds (balance between responsiveness and CPU usage)
- Only checks when app is active
- Efficient process detection per platform

### UI Rendering
- React components are memoized where appropriate
- Animations use CSS instead of JavaScript
- Virtual scrolling for large history lists

### Data Storage
- electron-store handles disk I/O efficiently
- History limited to 100 entries to prevent bloat
- Stats calculated on-demand from history

## Future Enhancements

Potential improvements:
- WebSocket for real-time Discord status
- More quest types support
- Advanced scheduling (cron-like)
- Multiple Discord account support
- Cloud sync (optional)
- Plugin system
- Better error recovery
- Automated testing

## Debugging

### Main Process
- Logs visible in terminal
- Use `console.log` statements
- Chrome DevTools for debugging (attach to main process)

### Renderer Process
- DevTools open in development mode
- React DevTools available
- Network tab for IPC monitoring

### IPC Communication
- All IPC calls logged in development
- Use Electron DevTools for IPC inspection

---

For implementation details, see the source code comments in each file.

