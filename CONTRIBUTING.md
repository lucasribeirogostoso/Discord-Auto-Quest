# Contributing to Discord Auto Quest

Thank you for your interest in contributing to Discord Auto Quest! We welcome contributions from the community.

## Code of Conduct

Please be respectful and professional in all interactions. We aim to maintain a welcoming and inclusive environment.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Discord version, app version)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Code Contributions

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/discord-auto-quest.git
   cd discord-auto-quest
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Follow the existing code style
   - Write clear commit messages
   - Add comments for complex logic
   - Test your changes thoroughly

5. **Run tests and linting**
   ```bash
   npm run dev  # Test in development
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Create a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Wait for review and address feedback

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic

### Component Guidelines

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use Tailwind CSS for styling
- Ensure responsive design

### State Management

- Use Zustand for global state
- Keep state minimal and normalized
- Use local state when possible

### Translations

When adding new text:
1. Add keys to both `src/renderer/i18n/en.json` and `src/renderer/i18n/pt-BR.json`
2. Use the `useTranslation` hook to access translations
3. Keep keys organized by feature/section

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add new feature`
- `fix: Fix bug in component`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor component`
- `test: Add tests`
- `chore: Update dependencies`

## Project Structure

```
DiscordAutoQuest/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Entry point
│   │   ├── discord-injector.ts
│   │   ├── process-monitor.ts
│   │   └── store.ts
│   ├── renderer/          # React UI
│   │   ├── components/    # React components
│   │   ├── stores/        # Zustand stores
│   │   ├── i18n/          # Translations
│   │   └── styles/        # Global styles
│   ├── preload/           # Preload scripts
│   └── types/             # TypeScript types
├── resources/             # Icons and assets
└── release/               # Built applications
```

## Questions?

If you have questions, feel free to:
- Open an issue for discussion
- Check existing issues and documentation
- Reach out to maintainers

Thank you for contributing! 🎉

