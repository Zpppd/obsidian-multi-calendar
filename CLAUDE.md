# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Multi-Calendar Plugin — 一个支持多日历档案的 Obsidian 插件。允许用户创建多个独立日历（如"生活日历"、"工作日历"），每个日历拥有独立的笔记路径规则和模板配置。

当前状态：**Step 1 完成 — 插件可加载，在 Obsidian 右侧栏显示月视图 Grid（静态，无交互）。**

已完成文件：
- `manifest.json` / `package.json` / `tsconfig.json` / `esbuild.config.mjs` — 项目骨架
- `src/main.ts` — 插件入口，CalendarView（ItemView）用 `onLayoutReady` 挂载 Vue，防重复创建
- `src/view/App.tsx` — Vue 根组件，luxon 算 42 格日期网格，JSX 渲染 CSS Grid
- `src/shims-vue.ts` — 为 esbuild 注入 Vue 的 `h` 和 `Fragment`
- `styles.css` — Grid 布局、日列、周列、今天高亮样式（全 Obsidian CSS 变量）

详细架构设计、数据模型、组件树见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 开发方式

**以教程视角逐步推进，每一步都有可见的产出。**

- 不要预先定义"未来会用到"的类型、接口、工具类。当下一步需要用到某个东西时，才去创建它。
- 每个步骤的代码量尽量小，让用户能看到一个可运行、可验证的结果。
- 前面的步骤为后面的步骤铺路——不是提前铺，而是缺了再补。

## 沟通风格

- **代码解释要简洁**。只讲这个函数/类是干什么的、关键参数什么意思，不讲执行流程和调用链。
- **用户问到什么讲什么**，不主动展开还没被问到的东西。
- 用户负责写代码，Claude 负责出代码方案和解释。

## Build & Dev Commands

```bash
# 安装依赖
npm install

# 类型检查
npx tsc -noEmit -skipLibCheck

# 构建（开发模式，含 sourcemap）
node esbuild.config.mjs

# 构建（生产模式，minify）
node esbuild.config.mjs production

# 本地测试：将 dist/ 复制或符号链接到 Obsidian vault 的 .obsidian/plugins/multi-calendar/
```

构建产物：`dist/main.js` + `dist/styles.css` + `dist/manifest.json`（manifest.json 需手工编写，不通过构建生成）。

## Architecture

完整架构图见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。核心分层：

```
Plugin (main.ts)           ← Obsidian API 入口，注册 ItemView/Command/SettingTab
  ├── Core Layer           ← CalendarManager / NoteService / TemplateService / Database / FlushScheduler
  ├── State Layer (Pinia)  ← calendarStore (日历档案状态) + viewStore (视图状态)
  └── View Layer (Vue 3)   ← TSX 组件，通过 provide/inject 获取 plugin 实例
```

### Key Design Decisions

- **Vue TSX 而非 SFC**：esbuild 原生支持 TSX，零额外构建依赖。所有 `.vue` 文件实际用 `.tsx`，见 [TECH-STACK.md §四](docs/TECH-STACK.md)。
- **消除 if-else 链**：用 `profile.notes[noteType]` 索引替代参考项目中的长 if-else，见 [ARCHITECTURE.md §3.2](docs/ARCHITECTURE.md)。
- **CSS Grid 手写日历**：不用任何日历组件库，`<div>` + CSS Grid 实现，前缀 `mc-`。
- **FlushScheduler 防抖刷新**：从参考项目提取的独立类，1 秒防抖，供 Vue 响应式系统消费。
- **设置面板用原生 DOM API**：Obsidian 的 `PluginSettingTab` 是命令式 API，不使用 Vue。

### Data Model

```typescript
// 顶层设置：版本号 + 日历列表 + 当前激活 ID
PluginSettings { version, calendars: CalendarProfile[], activeCalendarId, ... }

// 日历档案：id/name/color + 五种笔记配置的 Map
CalendarProfile { id, name, color, notes: Record<NoteType, NoteConfig> }

// 五种笔记类型：DAILY | WEEKLY | MONTHLY | QUARTERLY | YEARLY
NoteConfig { enabled, pathPattern, templateFile }
```

### Component Tree

```
App.tsx
├── CalendarSwitcher.tsx   ← ◀ [名称 ▼] ▶ [+新增]（核心新组件）
├── DateNavigator.tsx      ← 年/季/月导航 + [今] + [月/年]切换
└── CalendarBody.tsx       ← MonthView / YearView 条件渲染
    ├── MonthView.tsx      ← CSS Grid, 周序号列 + 7列日期, 4-6行
    │   ├── WeekIndexCell  ← 周序号（单击选中，双击打开周记）
    │   └── DayCell ×7     ← 日期数字 + 调休标注 + 笔记统计点
    └── YearView.tsx       ← 12 个缩略月卡片
```

### Implementation Priority (from ARCHITECTURE.md)

| 阶段 | 内容 |
|------|------|
| P0 | 项目骨架（manifest/package/tsconfig/esbuild）+ 数据模型 + Database |
| P1 | CalendarManager + Pinia stores + CalendarView + App + CalendarSwitcher + MonthView + DayCell |
| P2 | NoteService + TemplateService + DateNavigator |
| P3 | YearView + MonthCard + MainSettingTab |
| P4 | 样式完善 + 边界处理 |

## Key Patterns

- **Plugin 实例传递**：Vue 组件通过 `inject<MultiCalendarPlugin>('plugin')` 获取插件实例，进而访问 `plugin.noteService`、`plugin.calendarManager` 等。
- **路径规则使用 luxon 格式**：`yyyy-MM-dd`、`yyyy-MM-W` 等，预览时用 `DateTime.now().toFormat(pattern)` 生成实际路径。
- **CSS 全用 Obsidian 变量**：不写死颜色，使用 `--text-muted`、`--background-modifier-hover`、`--interactive-accent` 等变量自动适配主题。
- **模板插件兼容**：TemplateService 使用策略模式，统一适配 Obsidian 核心模板插件和 Templater 社区插件，通过 `templatePlugin` 设置项切换。
