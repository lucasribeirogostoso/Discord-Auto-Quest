# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-17

### Added
- Initial release of Discord Auto Quest
- Automatic Discord process detection and monitoring
- Quest automation for multiple task types:
  - Watch Video
  - Play on Desktop
  - Stream on Desktop
  - Play Activity
  - Watch Video on Mobile
- Beautiful modern UI with:
  - Dashboard with real-time logs
  - Statistics panel with animated counters
  - History panel with search and filters
  - Settings panel with all configurations
- Bilingual support (English and Portuguese BR)
- Dark and light theme support
- Auto-execute feature
- Desktop notifications
- Persistent data storage for:
  - Quest history
  - Statistics
  - User preferences
- First-run disclaimer modal
- Cross-platform support (Windows, macOS, Linux)
- Complete build configuration for distribution

### Security
- Context isolation enabled for secure IPC communication
- Node integration disabled in renderer process
- Sandboxed preload scripts
- Local data storage only (no external telemetry)

### Documentation
- Comprehensive README with setup instructions
- Contributing guidelines
- MIT License with disclaimer
- Code comments and documentation

