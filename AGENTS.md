# Repository Guidelines

## Project Structure & Module Organization

```
src/
├── main.ts                        # Obsidian plugin entry point
├── shims-vue.ts                   # Vue JSX runtime injection for esbuild
├── base/
│   └── types.ts                   # NoteType, CalendarViewMode enums
├── entity/
│   ├── CalendarProfile.ts         # Calendar profile data model
│   └── PluginSettings.ts          # Top-level settings interface
├── core/
│   ├── CalendarManager.ts         # Calendar CRUD + switching
│   ├── Database.ts                # loadData() / saveData()
│   ├── NoteService.ts             # Note creation and path resolution
│   ├── TemplateService.ts         # Template plugin adapter (strategy pattern)
│   └── FlushScheduler.ts          # Debounced refresh scheduler (1s)
├── stores/
│   ├── calendarStore.ts           # Pinia store: profiles[], activeId
│   └── viewStore.ts               # Pinia store: selectedDate, viewMode
├── view/
│   ├── App.tsx                    # Vue root component
│   ├── CalendarView.ts            # Obsidian ItemView (mounts Vue app)
│   ├── header/
│   │   ├── CalendarSwitcher.tsx   # Calendar switcher with arrows + dropdown
│   │   └── DateNavigator.tsx      # Year/month/quarter navigation
│   ├── body/
│   │   ├── CalendarBody.tsx       # MonthView / YearView conditional render
│   │   ├── MonthView.tsx          # CSS Grid month view (42 cells)
│   │   ├── YearView.tsx           # 12 thumbnail month cards
│   │   ├── DayCell.tsx            # Individual date cell
│   │   └── MonthCard.tsx          # Month thumbnail in YearView
│   └── setting/
│       └── MainSettingTab.ts      # Settings panel (native DOM API)
└── util/
    ├── PathUtil.ts                # Path formatting with luxon
    └── TemplateUtil.ts            # Template strategy base class
```

## Build, Test, and Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Build with watch mode + inline sourcemaps
npm run build            # Production build (minified, no sourcemaps)
npm run typecheck        # TypeScript type checking (tsc -noEmit -skipLibCheck)
```

Build output goes to `dist/`: `main.js`, `styles.css`, `manifest.json`. The `obsidian` package is marked as external.

For local testing, copy or symlink `dist/` into an Obsidian vault at `.obsidian/plugins/multi-calendar/`. The Hot Reload community plugin is recommended for development.

## Coding Style & Naming Conventions

- **Language**: TypeScript strict mode, target ES2018.
- **UI**: Vue 3 Composition API via **TSX** (not `.vue` SFC). Use `defineComponent` with a render function returning JSX.
- **State**: Pinia stores with Setup Store syntax (`defineStore` + Composition API).
- **CSS**: Hand-written CSS Grid, prefix all classes with `mc-` (e.g., `.mc-day-cell`, `.mc-calendar-switcher`). Use Obsidian CSS variables (`--text-muted`, `--background-modifier-hover`, `--interactive-accent`) — never hardcode colors.
- **Path aliases**: `@/` maps to `src/` (configured in tsconfig, but esbuild does not resolve aliases — use relative imports).
- **Dates**: luxon `DateTime` exclusively; path patterns use luxon format tokens (e.g., `yyyy-MM-dd`).
- **Plugin instance**: Passed to Vue components via `provide('plugin', ...)` / `inject<MultiCalendarPlugin>('plugin')`.

## Commit & Pull Request Guidelines

Use **Conventional Commits** in Chinese:

```
feat：基础日历面板
docs：需求文档
fix：修复某问题
refactor：重构某模块
```

Keep commits small with visible, verifiable output. Each commit should represent one logical step.

## Architecture Overview

Four-layer architecture:

```
Plugin (main.ts)          ← Obsidian API entry (ItemView, Command, SettingTab)
  ├── Core Layer          ← CalendarManager, NoteService, TemplateService, Database, FlushScheduler
  ├── State Layer (Pinia) ← calendarStore + viewStore
  └── View Layer (Vue 3)  ← TSX components, consume stores and injected plugin
```

**Key design decisions**: Eliminate if-else chains via `profile.notes[noteType]` indexing; settings panel uses native DOM API (not Vue); CSS Grid for calendar rendering (no third-party calendar library).
