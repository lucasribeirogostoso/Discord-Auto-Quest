# Screenshots & UI Guide

This document describes the user interface of Discord Auto Quest.

## Application Overview

The application features a modern, responsive interface with:
- Clean navigation bar
- Multiple view panels
- Real-time status indicators
- Smooth animations and transitions
- Dark and light theme support
- Bilingual interface (EN/PT-BR)

---

## 🎨 Main Interface

### Header
```
┌─────────────────────────────────────────────────────┐
│  Discord Auto Quest                                 │
│  Smart Quest Automation                             │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Gradient text logo (Discord purple to pink)
- Subtitle describing the app
- Clean, modern design

### Navigation Bar
```
┌─────────────────────────────────────────────────────┐
│  [Dashboard] [Statistics] [History] [Settings]      │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Four main sections with icons
- Active tab highlighted in Discord blue
- Hover effects
- Smooth transitions

---

## 📊 Dashboard View

### Discord Status Card
```
╔═══════════════════════════════════════════╗
║  Discord Status                           ║
║                                           ║
║  ● Discord Detected                       ║
║  PID: 12345                               ║
║  Path: C:\Program Files\Discord\...       ║
╚═══════════════════════════════════════════╝
```

**Status Indicators:**
- 🟢 Green pulsing dot when Discord is detected
- 🔴 Red dot when Discord is not found
- Shows process ID and path when detected

### Disclaimer Notice
```
╔═══════════════════════════════════════════╗
║  ⚠️  Legal Disclaimer                     ║
║                                           ║
║  This software is provided for            ║
║  educational purposes only...             ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Yellow warning style
- Clear disclaimer text
- Visible but not intrusive

### Execute Button
```
┌───────────────────────────────┐
│  ▶️  Execute Quest Automation  │
└───────────────────────────────┘
```

**States:**
- **Idle**: Gradient button (purple to pink)
- **Executing**: Spinning icon, "Executing..." text
- **Disabled**: Grayed out when Discord not detected

**Effects:**
- Hover: Lifts up slightly with shadow
- Click: Smooth press animation

### Console Logs
```
╔═══════════════════════════════════════════╗
║  💻 Log Console                           ║
╠═══════════════════════════════════════════╣
║  [12:34:56] [INFO] Starting automation... ║
║  [12:34:57] [SUCCESS] Quest detected!     ║
║  [12:35:00] [INFO] Progress: 50/120       ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Auto-scrolling to latest message
- Color-coded log levels:
  - 🔵 Blue for INFO
  - 🟢 Green for SUCCESS
  - 🟡 Yellow for WARNING
  - 🔴 Red for ERROR
- Timestamps on every message
- Monospace font for readability

---

## 📈 Statistics View

### Stat Cards (Grid Layout)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🏆 12       │ │ ⏱️  360      │ │ 📈 95%      │ │ 🏅 Latest   │
│ Completed   │ │ Minutes     │ │ Success     │ │ Quest Name  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**Card Features:**
- Icon with gradient colors
- Large number display
- Animated counting effect
- Descriptive label
- Hover lift effect
- Staggered animation on load

**Stat Types:**
1. **Total Completed**: Yellow/orange trophy
2. **Time Saved**: Blue/cyan clock
3. **Success Rate**: Green trending up
4. **Last Completed**: Purple/pink award

### Progress Chart
```
╔═══════════════════════════════════════════╗
║  Quest Completion Progress                ║
║                                           ║
║  This Week          [████████░░] 12       ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Gradient progress bar (purple to pink)
- Smooth fill animation
- Shows count and target

### Success Rate Indicator
```
╔═══════════════════════════════════════════╗
║  Performance Overview                     ║
║                                           ║
║           ██████████                      ║
║          ██        ██                     ║
║         ██    95%   ██                    ║
║          ██        ██                     ║
║           ██████████                      ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Circular progress indicator
- Gradient stroke
- Large percentage in center
- Smooth animation

---

## 📜 History View

### Search and Filters
```
┌──────────────────────────────┬───────────────────┐
│  🔍 Search...                │  🔽 Filter: All   │
└──────────────────────────────┴───────────────────┘
```

**Features:**
- Search by quest or application name
- Filter dropdown: All / Success / Failure
- Real-time filtering
- Clear icons

### History Table
```
╔═══════════════════════════════════════════════════════════════╗
║ Quest Name    │ Application │ Date/Time     │ Duration │ Status║
╠═══════════════════════════════════════════════════════════════╣
║ Daily Quest   │ Game Name   │ Nov 17, 12:34 │ 120m    │ ✅    ║
║ Weekly Quest  │ App Name    │ Nov 17, 12:00 │ 60m     │ ✅    ║
║ Special Quest │ Discord     │ Nov 16, 18:30 │ 30m     │ ❌    ║
╚═══════════════════════════════════════════════════════════════╝
```

**Features:**
- Sortable columns
- Hover highlight on rows
- Status icons (✅ green check, ❌ red X)
- Task type badges
- Formatted dates and durations
- Scrollable for long lists

### Clear History Button
```
┌──────────────────────────────┐
│  🗑️  Clear History            │
└──────────────────────────────┘
```

**Features:**
- Red color scheme
- Confirmation modal before clearing
- Disabled when no history

---

## ⚙️ Settings View

### Language Selection
```
╔═══════════════════════════════════════════╗
║  🌍 Language                              ║
║  Select interface language                ║
║                                           ║
║  [  English  ] [Português (BR)]          ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Two-button toggle
- Active button highlighted in blue
- Instant language switch
- Persists after restart

### Toggle Settings
```
╔═══════════════════════════════════════════╗
║  ⚡ Auto Execute                          ║
║  Automatically execute when Discord...    ║
║                                      [●]  ║
╚═══════════════════════════════════════════╝
```

**Toggle States:**
- **On**: Blue background, switch on right
- **Off**: Gray background, switch on left
- Smooth sliding animation

**Available Toggles:**
- Auto Execute (⚡)
- Notifications (🔔)

### Theme Switcher
```
╔═══════════════════════════════════════════╗
║  🌙 Theme                                 ║
║  Choose between light or dark theme       ║
║                                           ║
║  [☀️  Light] [🌙  Dark]                   ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Sun and moon icons
- Active theme highlighted
- Instant theme change
- Smooth color transitions

### Data Management
```
╔═══════════════════════════════════════════╗
║  ℹ️  Data                                 ║
║                                           ║
║  🗑️  Clear History                        ║
║  Remove all history records               ║
║                                           ║
║  🔄  Reset Statistics                     ║
║  Reset all statistics to zero             ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Destructive actions in warning colors
- Icons and descriptions
- Confirmation modals

### About Section
```
╔═══════════════════════════════════════════╗
║  About                                    ║
║                                           ║
║  Version: 1.0.0                           ║
║                                           ║
║  [GitHub] [Documentation]                 ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Version display
- Links to external resources
- Opens in default browser

---

## 🎭 Modals

### First Run Modal
```
╔═══════════════════════════════════════════╗
║  ⚠️  Welcome to Discord Auto Quest!      ║
║                                           ║
║  This is an automation tool that may      ║
║  violate Discord's Terms of Service...    ║
║                                           ║
║  [This software is provided...]          ║
║                                           ║
║  ┌─────────────────────────────────────┐ ║
║  │  I Understand and Accept            │ ║
║  └─────────────────────────────────────┘ ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Warning icon
- Clear disclaimer
- Prominent accept button
- Only shows once

### Confirmation Modal
```
╔═══════════════════════════════════════════╗
║  Clear History                            ║
║                                           ║
║  Are you sure you want to clear all       ║
║  history?                                 ║
║                                           ║
║  [ Yes ]  [ No ]                          ║
╚═══════════════════════════════════════════╝
```

**Features:**
- Simple question
- Two action buttons
- Backdrop blur effect
- Smooth fade-in animation

---

## 🎨 Theme Comparison

### Dark Theme (Default)
- Background: Very dark gray (#1E2124)
- Cards: Dark gray (#2C2F33)
- Text: White/light gray
- Accents: Discord colors (purple, pink)
- Easy on the eyes
- Matches Discord's style

### Light Theme
- Background: Light gray (#F9FAFB)
- Cards: White
- Text: Dark gray/black
- Accents: Same Discord colors
- Clean and bright
- Professional look

**Both themes feature:**
- Smooth transitions
- Consistent spacing
- Readable typography
- Accessible contrast ratios

---

## ✨ Animations & Effects

### Page Transitions
- Fade in on view change
- Slide up effect for cards
- Staggered animation for multiple items

### Button Effects
- Hover: Subtle lift with shadow
- Active: Press down effect
- Gradient buttons with shine

### Status Indicators
- Pulsing online dot
- Spinning loader during execution
- Smooth color transitions

### Number Counting
- Stats animate from 0 to target
- Smooth easing function
- 1-second duration

---

## 📱 Responsive Design

The app is designed to work well at different window sizes:

- **Minimum**: 1000x700px
- **Default**: 1400x900px
- **Responsive grid**: Adjusts cards based on width
- **Mobile-friendly**: (if web version is built)

---

## 🎯 Accessibility

- High contrast ratios for text
- Clear focus indicators
- Descriptive labels
- Keyboard navigation support
- Screen reader friendly
- Color not the only indicator

---

For actual screenshots, run the application and take screenshots of each view!

To capture:
1. Run `npm run dev`
2. Navigate to each view
3. Try both themes
4. Take screenshots for documentation

Recommended screenshot names:
- `dashboard-light.png`
- `dashboard-dark.png`
- `stats-panel.png`
- `history-panel.png`
- `settings-panel.png`
- `first-run-modal.png`

