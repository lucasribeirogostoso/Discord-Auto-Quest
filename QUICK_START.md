# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (First Time Only)

**Windows:**
```bash
# Double-click scripts/setup.bat
# OR run in Command Prompt:
npm install
```

**Mac/Linux:**
```bash
# In Terminal:
chmod +x scripts/setup.sh
./scripts/setup.sh
# OR:
npm install
```

### 2. Run the App

```bash
npm run dev
```

The app will open automatically!

### 3. First Time Setup

1. ✅ Read and accept the disclaimer
2. 🌍 Choose your language (English or Português)
3. 🎨 Select your theme (Light or Dark)
4. ⚡ Enable auto-execute if you want (optional)

### 4. Use the App

1. **Open Discord** - Make sure Discord Desktop App is running
2. **Check Status** - The Dashboard will show "Discord Detected" when ready
3. **Execute Quest** - Click the big "Execute Quest Automation" button
4. **Watch Logs** - Monitor progress in the console

### 5. Build Installer (Optional)

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Find your installer in the `release/` folder!

## 📱 App Features

### Dashboard
- Real-time Discord status
- Execute button
- Live console logs

### Statistics
- Quests completed
- Time saved
- Success rate
- Last completed quest

### History
- All past quests
- Search and filter
- Detailed information

### Settings
- Language (EN/PT-BR)
- Theme (Light/Dark)
- Auto-execute
- Notifications
- Clear data

## ⚠️ Important Notes

1. **Discord Desktop Required** - Works best with Discord Desktop App (not browser)
2. **Run as Admin** - May need admin rights on Windows for process detection
3. **Antivirus** - May need to add exception for unsigned app
4. **Terms of Service** - Using automation may violate Discord's ToS. Use at your own risk!

## 🆘 Troubleshooting

### Discord Not Detected
- ✅ Make sure Discord Desktop is running (not just browser)
- ✅ Restart the app
- ✅ Try running as administrator (Windows)

### Can't Execute Quest
- ✅ Check that Discord is detected first
- ✅ Make sure you have an active quest enrolled
- ✅ Check the console logs for error messages

### Build Fails
- ✅ Delete `node_modules` and run `npm install` again
- ✅ Make sure you have enough disk space
- ✅ Check that Node.js version is 18 or higher

## 🎯 Tips

- Enable **auto-execute** to run quests automatically when Discord starts
- Enable **notifications** to know when quests complete
- Check **History** to see all completed quests
- Use **Search** in History to find specific quests
- Switch **language** anytime in Settings
- Try both **themes** to find what you like best

## 📖 More Information

- [Installation Guide](INSTALLATION.md) - Detailed installation instructions
- [README](README.md) - Full documentation
- [Architecture](docs/ARCHITECTURE.md) - Technical details
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🎉 You're Ready!

Enjoy automating your Discord quests! Remember to use responsibly. 💜

---

**Need Help?** Open an issue on GitHub or check the documentation.

