# Frequently Asked Questions (FAQ)

## General Questions

### What is Discord Auto Quest?

Discord Auto Quest is a desktop application that automates Discord quest completion. It detects when Discord is running and can automatically complete quests to save you time.

### Is this safe to use?

**Technical Safety**: The application runs locally on your computer and doesn't send any data externally. It's as safe as any other desktop application.

**Terms of Service**: However, using automation may violate Discord's Terms of Service. Use at your own risk. We are not responsible for any consequences.

### Will I get banned from Discord?

We cannot guarantee you won't face consequences. Using automation tools may result in:
- Warnings
- Quest restrictions
- Account suspension
- Permanent ban

**Use at your own risk!**

### Does it work on Discord Web?

The app works best with Discord Desktop. It can fall back to Discord Web, but functionality is limited. For best results, use Discord Desktop App.

### Is my data safe?

Yes! All data is stored locally on your computer using electron-store. Nothing is sent to external servers. Your quest history, settings, and statistics stay on your device.

## Installation & Setup

### What do I need to run this?

- **Node.js** 18 or higher
- **Discord Desktop App** (recommended)
- **Operating System**: Windows 10+, macOS 10.13+, or Linux

### How do I install it?

1. Download or clone the repository
2. Run `npm install` (or use setup scripts)
3. Run `npm run dev` to start
4. Or build installers with `npm run build`

See [INSTALLATION.md](../INSTALLATION.md) for detailed instructions.

### Why can't I find Discord after installation?

Make sure:
1. Discord Desktop App is installed and running
2. You're not just using Discord in a browser
3. The app has permission to monitor processes
4. Try running as administrator (Windows)

### Do I need to keep the app open?

Yes, the app needs to be running to:
- Monitor Discord status
- Execute quest automation
- Track statistics

## Usage Questions

### How do I use the app?

1. Open Discord Desktop
2. Launch Discord Auto Quest
3. Wait for "Discord Detected" status
4. Click "Execute Quest Automation"
5. Watch the console logs

### What quest types are supported?

- ✅ Watch Video
- ✅ Watch Video on Mobile
- ✅ Play on Desktop
- ✅ Stream on Desktop
- ✅ Play Activity

### Why isn't it detecting my quest?

The script looks for active, incomplete quests. Make sure:
1. You have enrolled in a quest
2. The quest hasn't expired
3. The quest isn't already completed
4. Discord is fully loaded

### Can I run multiple quests at once?

The automation processes one quest at a time. It will pick the first available quest automatically.

### What does "auto-execute" do?

When enabled, the app will automatically run quest automation when Discord is detected. Useful for "set and forget" automation.

### How do I change the language?

Go to Settings → Language and select your preferred language (English or Português BR). The app will reload with the new language.

## Troubleshooting

### Discord is detected but execution fails

Try these steps:
1. Make sure Discord is fully loaded (wait 30 seconds after opening)
2. Restart Discord
3. Restart Discord Auto Quest
4. Check console logs for specific errors
5. Try manually opening Discord DevTools (Ctrl+Shift+I) to see if there are issues

### The app won't start

Check:
1. Node.js is installed (`node --version`)
2. Dependencies are installed (`npm install`)
3. No other app is using port 5173
4. Check terminal for error messages

### Build fails

Try:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Make sure you have enough disk space (at least 2GB free)
4. Check that your Node.js version is 18+

### App shows "Discord Not Found" but Discord is running

This can happen if:
1. You're using Discord in browser only (use Desktop App)
2. Process monitoring has issues (try running as admin on Windows)
3. Discord variant isn't detected (we check for Discord, DiscordCanary, DiscordPTB)
4. Antivirus is blocking process detection

### Logs aren't showing

Make sure:
1. You've clicked "Execute Quest Automation"
2. Discord is detected
3. You have an active quest
4. Check the console tab in Dashboard

## Features & Settings

### What are the statistics tracking?

- **Total Completed**: Number of successful quests
- **Time Saved**: Total minutes saved (based on quest requirements)
- **Success Rate**: Percentage of successful vs failed attempts
- **Last Completed**: Name of the most recent quest

### How long is history kept?

The app keeps the last 100 quest entries. Older entries are automatically removed to save space.

### Can I export my history?

Currently, history is stored locally in electron-store. You can find the data file:
- **Windows**: `%APPDATA%\discord-auto-quest\`
- **macOS**: `~/Library/Application Support/discord-auto-quest/`
- **Linux**: `~/.config/discord-auto-quest/`

### What does "Clear History" do?

It permanently deletes all quest history records. Statistics are recalculated based on history, so clearing history will reset your stats too.

### What themes are available?

- **Light Theme**: Bright, clean interface
- **Dark Theme**: Easy on the eyes, follows Discord's style

You can switch anytime in Settings.

## Technical Questions

### What technologies are used?

- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **i18next**: Internationalization

See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details.

### How does it inject code into Discord?

The app:
1. Finds Discord's window/process
2. Uses Electron's `executeJavaScript` to run code in Discord's context
3. The injected code uses Discord's internal APIs
4. Results are sent back through IPC

### Is the code open source?

Yes! The entire codebase is available in this repository. Feel free to review, modify, or contribute.

### Can I contribute?

Absolutely! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### How can I add more languages?

1. Copy `src/renderer/i18n/en.json`
2. Create a new file like `src/renderer/i18n/fr.json`
3. Translate all strings
4. Import it in `src/renderer/i18n/index.ts`
5. Add it to the language selector in Settings

### Can I customize the UI?

Yes! The UI uses Tailwind CSS. You can:
- Modify colors in `tailwind.config.js`
- Edit component styles in the component files
- Add custom CSS in `src/renderer/styles/global.css`

## Support & Community

### Where can I get help?

1. Check this FAQ
2. Read the [README](../README.md)
3. Check [GitHub Issues](https://github.com/yourusername/discord-auto-quest/issues)
4. Open a new issue if needed

### How do I report bugs?

Open a GitHub issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your OS and app version
- Console logs if available

### How do I request features?

Open a GitHub issue with:
- Feature description
- Use case (why it's useful)
- Possible implementation ideas

### Is there a Discord server for this app?

Not currently, but you can discuss in GitHub Issues and Discussions.

## Legal & Privacy

### What data is collected?

**None!** The app:
- ✅ Stores data locally only
- ✅ No telemetry or tracking
- ✅ No external API calls (except Discord's own)
- ✅ No data is sent anywhere

### Can I use this commercially?

The code is MIT licensed, but:
- ⚠️ Using it may violate Discord's ToS
- ⚠️ We provide no warranties
- ⚠️ You're responsible for your use

### Who maintains this project?

This is a community project. Check the repository for current maintainers and contributors.

---

## Still have questions?

Open an issue on GitHub or check the documentation!

