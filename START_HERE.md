# 🚀 START HERE - Discord Auto Quest

## ⚠️ AVISO IMPORTANTE / IMPORTANT WARNING

**PT-BR**: Esta ferramenta pode violar os Termos de Serviço do Discord. Use por sua conta e risco. Os desenvolvedores não se responsabilizam por banimentos ou outras consequências.

**EN**: This tool may violate Discord's Terms of Service. Use at your own risk. Developers are not responsible for bans or other consequences.

---

## 📋 Pré-requisitos / Prerequisites

Você precisa de / You need:

1. ✅ **Node.js 18+** 
   - Download: https://nodejs.org/
   - Verifique / Check: `node --version`

2. ✅ **Discord Desktop App** (não apenas navegador / not just browser)
   - Download: https://discord.com/download

3. ✅ **Git** (opcional / optional)
   - Download: https://git-scm.com/

---

## 🎯 Início Rápido / Quick Start

### Opção 1: Script Automático / Automatic Script

#### Windows
```batch
# Clique duas vezes em / Double-click:
scripts\setup.bat

# Depois / Then:
npm run dev
```

#### Mac/Linux
```bash
# No terminal / In terminal:
chmod +x scripts/setup.sh
./scripts/setup.sh

# Depois / Then:
npm run dev
```

### Opção 2: Manual

```bash
# 1. Instalar dependências / Install dependencies
npm install

# 2. Executar aplicação / Run application
npm run dev

# 3. Construir instalador (opcional) / Build installer (optional)
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 📖 Documentação Completa / Full Documentation

### Português (PT-BR)
- 📘 [QUICK_START.md](QUICK_START.md) - Guia rápido de 5 minutos
- 📗 [INSTALLATION.md](INSTALLATION.md) - Instruções detalhadas de instalação
- 📙 [README.md](README.md) - Documentação completa do projeto
- ❓ [docs/FAQ.md](docs/FAQ.md) - Perguntas frequentes

### English (EN)
- 📘 [QUICK_START.md](QUICK_START.md) - 5-minute quick guide
- 📗 [INSTALLATION.md](INSTALLATION.md) - Detailed installation instructions
- 📙 [README.md](README.md) - Complete project documentation
- ❓ [docs/FAQ.md](docs/FAQ.md) - Frequently asked questions

### Técnico / Technical
- 🏗️ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura técnica / Technical architecture
- 🔌 [docs/API.md](docs/API.md) - Documentação da API / API documentation
- 📁 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Estrutura do projeto / Project structure

---

## 🎮 Como Usar / How to Use

### Passo a Passo / Step by Step

1. **Abra o Discord Desktop** / **Open Discord Desktop**
   ```
   Certifique-se que o Discord está rodando
   Make sure Discord is running
   ```

2. **Inicie o App** / **Start the App**
   ```bash
   npm run dev
   ```

3. **Primeira Execução** / **First Run**
   - Leia e aceite o disclaimer / Read and accept disclaimer
   - Escolha seu idioma / Choose your language
   - Configure o tema / Configure theme

4. **Execute Quests** / **Execute Quests**
   - Aguarde "Discord Detectado" / Wait for "Discord Detected"
   - Clique "Executar Automação" / Click "Execute Automation"
   - Observe os logs / Watch the logs

---

## 🛠️ Solução de Problemas / Troubleshooting

### Discord não detectado / Discord not detected

**PT-BR:**
1. Certifique-se que o Discord Desktop está aberto (não apenas navegador)
2. Execute o app como administrador no Windows
3. Reinicie o Discord e o aplicativo
4. Verifique se não está usando uma versão modificada do Discord

**EN:**
1. Make sure Discord Desktop is open (not just browser)
2. Run the app as administrator on Windows
3. Restart Discord and the application
4. Check you're not using a modified Discord version

### Erro ao instalar / Installation error

```bash
# Limpe o cache / Clear cache
npm cache clean --force

# Remova node_modules / Remove node_modules
rm -rf node_modules package-lock.json

# Reinstale / Reinstall
npm install
```

### Build falha / Build fails

```bash
# Verifique a versão do Node / Check Node version
node --version  # Deve ser 18+ / Should be 18+

# Verifique espaço em disco / Check disk space
# Precisa de pelo menos 2GB / Needs at least 2GB

# Tente build individual / Try individual build
npm run build:win   # ou/or :mac, :linux
```

---

## 📱 Funcionalidades / Features

### Dashboard
- ✅ Status do Discord em tempo real / Real-time Discord status
- ✅ Botão de execução / Execute button
- ✅ Console de logs ao vivo / Live log console
- ✅ Avisos de disclaimer / Disclaimer warnings

### Estatísticas / Statistics
- 📊 Total de quests completadas / Total quests completed
- ⏱️ Tempo economizado / Time saved
- 📈 Taxa de sucesso / Success rate
- 🏆 Última quest completada / Last completed quest

### Histórico / History
- 📜 Registro completo / Complete record
- 🔍 Busca e filtros / Search and filters
- 📅 Data e duração / Date and duration
- 🗑️ Limpar histórico / Clear history

### Configurações / Settings
- 🌍 Idioma (PT-BR/EN) / Language (PT-BR/EN)
- 🌓 Tema (Claro/Escuro) / Theme (Light/Dark)
- ⚡ Execução automática / Auto-execute
- 🔔 Notificações / Notifications

---

## 🎨 Personalização / Customization

### Ícones / Icons
```bash
# Coloque seus ícones em / Place your icons in:
resources/icon.png   # 512x512 ou maior / or larger
resources/icon.ico   # Windows
resources/icon.icns  # macOS
```

### Cores / Colors
Edite / Edit: `tailwind.config.js`
```javascript
colors: {
  discord: {
    blurple: '#5865F2',  // Mude aqui / Change here
    // ...
  }
}
```

### Traduções / Translations
Adicione idiomas em / Add languages in:
- `src/renderer/i18n/your-language.json`

---

## 📦 Distribuição / Distribution

### Criar Instalador / Create Installer

```bash
# Windows (cria .exe em release/)
npm run build:win

# macOS (cria .dmg em release/)
npm run build:mac

# Linux (cria .AppImage em release/)
npm run build:linux
```

### Localizações dos Instaladores / Installer Locations
```
release/
  ├── Discord Auto Quest-1.0.0-Setup.exe    # Windows
  ├── Discord Auto Quest-1.0.0.dmg          # macOS
  └── Discord Auto Quest-1.0.0.AppImage     # Linux
```

---

## 🤝 Contribuir / Contributing

Quer contribuir? / Want to contribute?

1. Fork o repositório / Fork the repository
2. Crie uma branch / Create a branch
3. Faça suas mudanças / Make your changes
4. Envie um Pull Request / Submit a Pull Request

Veja / See: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Suporte / Support

### Problemas / Issues
Abra uma issue no GitHub / Open a GitHub issue:
https://github.com/yourusername/discord-auto-quest/issues

### Documentação / Documentation
- [Quick Start](QUICK_START.md)
- [Installation Guide](INSTALLATION.md)
- [FAQ](docs/FAQ.md)
- [Architecture](docs/ARCHITECTURE.md)

---

## ⚖️ Legal

### Licença / License
MIT License - Veja / See [LICENSE](LICENSE)

### Aviso / Disclaimer
Este software é fornecido "como está" sem garantias. O uso de automação pode violar os Termos de Serviço do Discord.

This software is provided "as is" without warranties. Using automation may violate Discord's Terms of Service.

---

## 🎉 Pronto! / Ready!

**PT-BR:** Você está pronto para começar! Execute `npm run dev` e divirta-se!

**EN:** You're ready to start! Run `npm run dev` and have fun!

---

**Feito com 💜 / Made with 💜**

