# Resources

This directory contains application icons and assets for different platforms.

## Icon Requirements

### Windows (icon.ico)
- Multi-resolution ICO file
- Recommended sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### macOS (icon.icns)
- ICNS file with multiple resolutions
- Recommended sizes: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024

### Linux (icon.png)
- PNG file
- Recommended size: 512x512 or 1024x1024

## Creating Icons

You can use tools like:
- **Windows**: IcoFX, GIMP with ICO plugin
- **macOS**: iconutil (built-in), Image2icon
- **Linux**: ImageMagick, GIMP
- **Cross-platform**: electron-icon-maker, png2icons

## Placeholder Icons

For development, you can use placeholder icons. For production, replace these with your custom-designed icons.

To generate icons from a single PNG:
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon-source.png --output=./resources
```

