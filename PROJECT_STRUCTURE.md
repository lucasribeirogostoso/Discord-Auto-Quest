# Project Structure

```
DiscordAutoQuest/
│
├── 📄 Configuration Files
│   ├── package.json              # Project dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tsconfig.node.json        # TypeScript config for Node
│   ├── vite.config.ts            # Vite bundler configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── electron-builder.json     # Electron Builder config
│   ├── .eslintrc.json            # ESLint configuration
│   ├── .eslintignore             # ESLint ignore patterns
│   ├── .prettierrc               # Prettier configuration
│   ├── .prettierignore           # Prettier ignore patterns
│   ├── .npmrc                    # NPM configuration
│   └── .gitignore                # Git ignore patterns
│
├── 📚 Documentation
│   ├── README.md                 # Main project documentation
│   ├── QUICK_START.md            # Quick start guide
│   ├── INSTALLATION.md           # Installation instructions
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── CHANGELOG.md              # Version history
│   ├── LICENSE                   # MIT License
│   └── docs/
│       ├── ARCHITECTURE.md       # Technical architecture
│       ├── API.md                # IPC API documentation
│       └── FAQ.md                # Frequently asked questions
│
├── 🔧 Scripts
│   ├── scripts/
│   │   ├── setup.bat             # Windows setup script
│   │   └── setup.sh              # Unix setup script
│   └── index.html                # Root HTML (redirects to src)
│
├── 🎨 Resources
│   └── resources/
│       ├── icon.png              # App icon (placeholder)
│       ├── icon.ico              # Windows icon (to be created)
│       ├── icon.icns             # macOS icon (to be created)
│       └── README.md             # Icon documentation
│
├── 💻 Source Code
│   └── src/
│       │
│       ├── 🖥️ Main Process (Electron)
│       │   └── main/
│       │       ├── index.ts              # Main entry point
│       │       ├── process-monitor.ts    # Discord detection
│       │       ├── discord-injector.ts   # Code injection
│       │       ├── ipc/                  # IPC registration layer
│       │       │   └── register-handlers.ts
│       │       ├── store.ts              # Data persistence
│       │       └── types.ts              # TypeScript types
│       │
│       ├── 🔌 Preload Scripts
│       │   └── preload/
│       │       └── index.ts              # IPC bridge
│       │
│       ├── 🎨 Renderer Process (React UI)
│       │   └── renderer/
│       │       │
│       │       ├── Entry Points
│       │       │   ├── index.html        # HTML template
│       │       │   ├── main.tsx          # React entry
│       │       │   └── App.tsx           # Main App component
│       │       │
│       │       ├── 🧩 Components
│       │       │   └── components/
│       │       │       ├── Dashboard.tsx       # Dashboard view
│       │       │       ├── StatsPanel.tsx      # Statistics view
│       │       │       ├── HistoryPanel.tsx    # History view
│       │       │       ├── SettingsPanel.tsx   # Settings view
│       │       │       └── FirstRunModal.tsx   # First run modal
│       │       │
│       │       ├── 📦 State Management
│       │       │   └── stores/
│       │       │       └── appStore.ts         # Zustand store
│       │       │
│       │       ├── 🌍 Internationalization
│       │       │   └── i18n/
│       │       │       ├── index.ts            # i18n setup
│       │       │       ├── en.json             # English translations
│       │       │       └── pt-BR.json          # Portuguese translations
│       │       │
│       │       └── 🎨 Styles
│       │           └── styles/
│       │               └── global.css          # Global styles
│       │
│       └── 📝 Type Definitions
│           └── types/
│               └── electron.d.ts               # Electron API types
│
├── 🔨 Build Output (Generated)
│   ├── dist/                     # Vite build output
│   ├── dist-electron/            # Electron build output
│   ├── node_modules/             # Dependencies
│   └── release/                  # Final installers
│
└── 🔧 IDE Configuration
    └── .vscode/
        ├── settings.json         # VS Code settings
        └── extensions.json       # Recommended extensions
```

## Key Directories

### `/src/main/`
**Electron Main Process** - Runs in Node.js environment
- Window management
- Process monitoring
- Discord injection
- Data storage
- IPC handlers

### `/src/renderer/`
**React UI** - Runs in Chromium renderer
- User interface components
- State management
- Internationalization
- Styling

### `/src/preload/`
**Preload Scripts** - Bridge between main and renderer
- Secure IPC communication
- Context isolation
- API exposure

### `/src/types/`
**TypeScript Definitions**
- Shared types
- API interfaces

### `/docs/`
**Documentation**
- Architecture details
- API reference
- FAQ

### `/resources/`
**Application Assets**
- Icons for different platforms
- Build resources

### `/scripts/`
**Helper Scripts**
- Setup scripts for different platforms
- Build utilities

## File Flow

### Development
```
index.html (root)
    ↓
src/renderer/main.tsx
    ↓
src/renderer/App.tsx
    ↓
Components + State + i18n
```

### Main Process
```
src/main/index.ts
    ↓
Creates BrowserWindow
    ↓
Loads index.html
    ↓
Initializes monitors and injector
    ↓
Sets up IPC handlers
```

### Build Process
```
npm run build
    ↓
TypeScript Compilation
    ↓
Vite Build (React)
    ↓
Electron Builder
    ↓
Platform-specific Installers
```

## Important Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Build configuration |
| `src/main/index.ts` | Electron entry point |
| `src/renderer/App.tsx` | React entry point |
| `src/preload/index.ts` | IPC bridge |
| `src/renderer/stores/appStore.ts` | Application state |
| `electron-builder.json` | Installer configuration |

## Build Artifacts

### Development
- Hot reload enabled
- Source maps included
- DevTools open

### Production
- Optimized bundles
- Minified code
- Platform-specific installers:
  - Windows: `.exe` (NSIS installer)
  - macOS: `.dmg` (DMG image)
  - Linux: `.AppImage` and `.deb`

## Data Storage Locations

Application data is stored in platform-specific locations:

- **Windows**: `%APPDATA%\discord-auto-quest\`
- **macOS**: `~/Library/Application Support/discord-auto-quest/`
- **Linux**: `~/.config/discord-auto-quest/`

Stored data includes:
- `config.json` - User settings
- Quest history
- Statistics

## Technology Stack

### Core
- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Language
- **Vite** - Build tool

### UI
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **i18next** - Translations

### State & Storage
- **Zustand** - State management
- **electron-store** - Persistence

### Build & Tools
- **electron-builder** - Packaging
- **ESLint** - Linting
- **Prettier** - Formatting

## Development Workflow

1. **Install**: `npm install`
2. **Develop**: `npm run dev`
3. **Build**: `npm run build:win` / `build:mac` / `build:linux`
4. **Output**: Check `release/` folder

## Next Steps

- Add custom icons to `/resources/`
- Customize colors in `tailwind.config.js`
- Add more translations in `/src/renderer/i18n/`
- Extend components in `/src/renderer/components/`
- Add more IPC handlers in `/src/main/index.ts`

---

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

