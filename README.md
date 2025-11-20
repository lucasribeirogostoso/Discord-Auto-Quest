# Discord Auto Quest

🚀 **A beautiful and powerful automation tool for Discord Quests**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ⚠️ Disclaimer

**This software is provided for educational purposes only.** Using automation may violate Discord's Terms of Service. You take full responsibility for using this tool. The developers are not responsible for any consequences that may arise from the use of this software.

## ✨ Features

- 🎯 **Automatic Quest Detection** - Finds and completes Discord quests automatically
- 🔍 **Discord Process Monitor** - Automatically detects when Discord is running
- 📊 **Beautiful Dashboard** - Modern UI with real-time status and logs
- 📈 **Statistics Tracking** - Track completed quests, time saved, and success rate
- 📜 **Quest History** - View detailed history with search and filters
- 🌍 **Bilingual** - Full support for English and Portuguese (BR)
- 🌓 **Dark/Light Theme** - Beautiful themes for any preference
- ⚡ **Auto-Execute** - Optionally run quests automatically when Discord is detected
- 🔔 **Notifications** - Get notified when quests are completed
- 💾 **Persistent Storage** - All settings and history are saved locally

## 🛠️ Tech Stack

- **Electron** - Cross-platform desktop app framework
- **React** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Beautiful, responsive styling
- **Zustand** - Lightweight state management
- **i18next** - Internationalization
- **electron-store** - Persistent data storage

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Discord Desktop App (for full functionality)

### Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discord-auto-quest.git
cd discord-auto-quest
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

### Building

Build for your platform:

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build
```

Installers will be created in the `release` directory.

## 🎮 Usage

1. **Launch the Application**
   - Open Discord Auto Quest
   - The app will automatically detect if Discord is running

2. **First Run**
   - Accept the disclaimer (first time only)
   - Configure your preferences in Settings

3. **Execute Quest Automation**
   - Click the "Execute Quest Automation" button on the Dashboard
   - Watch the console for real-time logs
   - View completed quests in History

4. **Configure Settings**
   - Switch between English and Portuguese
   - Enable auto-execute to run automatically when Discord starts
   - Toggle notifications
   - Choose your preferred theme

## 🎨 Features Overview

### Dashboard
- Real-time Discord status indicator
- Large execute button with status
- Live console logs with timestamps
- Color-coded log levels (info, success, warning, error)

### Statistics
- Total quests completed
- Total time saved (in minutes)
- Success rate percentage
- Last completed quest
- Visual progress indicators

### History
- Complete quest history table
- Search by quest or application name
- Filter by status (success/failure)
- Sort by date, duration, or status
- Clear all history option

### Settings
- Language selection (EN/PT-BR)
- Auto-execute toggle
- Notifications toggle
- Theme switcher (light/dark)
- Clear history
- Reset statistics
- About section with links

## 🔧 How It Works

The application works by:

1. **Monitoring Discord** - Continuously checks for Discord processes on your system
2. **Injecting Code** - When Discord is detected, injects JavaScript code into Discord's web context
3. **Quest Automation** - The injected code interacts with Discord's internal APIs to complete quests
4. **Logging & Tracking** - All actions are logged and statistics are tracked locally

### Supported Quest Types

- ✅ Watch Video
- ✅ Play on Desktop
- ✅ Stream on Desktop
- ✅ Play Activity
- ✅ Watch Video on Mobile

## 🌐 Localization

Fully translated into:
- 🇺🇸 English
- 🇧🇷 Portuguese (Brazil)

Want to add your language? Contributions are welcome!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Legal Notice

This tool is provided "as is" without warranty of any kind. The use of automation tools may violate Discord's Terms of Service. Use at your own risk. The developers assume no responsibility for any consequences resulting from the use of this software.

## 🙏 Acknowledgments

- Built with ❤️ using Electron and React
- UI inspired by Discord's design language
- Quest automation script adapted from community scripts

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Made with 💜 by the Discord Auto Quest Team**

