# Installation Guide

## Quick Start

### Step 1: Install Node.js

Download and install Node.js (version 18 or higher) from:
- https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### Step 2: Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all required dependencies. It may take a few minutes.

### Step 3: Run in Development Mode

To test the application:

```bash
npm run dev
```

The application will open automatically. Make sure Discord is running to test the automation features.

### Step 4: Build for Production

To create an installer for your operating system:

#### Windows
```bash
npm run build:win
```

The installer will be created in the `release` directory:
- `Discord Auto Quest-1.0.0-Setup.exe`

#### macOS
```bash
npm run build:mac
```

The DMG file will be created in the `release` directory:
- `Discord Auto Quest-1.0.0.dmg`

#### Linux
```bash
npm run build:linux
```

The AppImage will be created in the `release` directory:
- `Discord Auto Quest-1.0.0.AppImage`

## Troubleshooting

### "command not found" errors

Make sure Node.js and npm are properly installed and added to your PATH.

### Dependencies fail to install

Try clearing the npm cache:
```bash
npm cache clean --force
npm install
```

### Build fails

Make sure you have:
1. All dependencies installed (`npm install`)
2. Sufficient disk space
3. Proper permissions to create files

### Discord not detected

Make sure:
1. Discord Desktop App is running
2. You're not using Discord in a browser only
3. The app has permission to monitor processes

## Custom Icons

To use custom icons instead of placeholders:

1. Create your icon in PNG format (512x512 or larger)
2. Use an icon generator tool:
   ```bash
   npm install -g electron-icon-maker
   electron-icon-maker --input=your-icon.png --output=./resources
   ```
3. Rebuild the application

## Platform-Specific Notes

### Windows
- Windows Defender may flag the app on first run (this is normal for unsigned apps)
- You may need to add an exception
- The app requires Windows 10 or later

### macOS
- The app is not signed, so you'll need to allow it in Security & Privacy settings
- Right-click the app and select "Open" on first run
- Requires macOS 10.13 or later

### Linux
- Make the AppImage executable: `chmod +x Discord-Auto-Quest-1.0.0.AppImage`
- You may need to install additional dependencies depending on your distribution

## Next Steps

After installation:
1. Launch the application
2. Read and accept the disclaimer
3. Configure your settings (language, theme, etc.)
4. Make sure Discord is running
5. Click "Execute Quest Automation" to start

## Support

If you encounter issues:
1. Check the console logs in the Dashboard
2. Check GitHub Issues for similar problems
3. Create a new issue with:
   - Your OS and version
   - Error messages
   - Steps to reproduce

## Updating

To update to a new version:
1. Download the latest release
2. Install over the existing installation
3. Your settings and history will be preserved

---

For more information, see the [README.md](README.md) file.

