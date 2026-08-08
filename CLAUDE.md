# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Multi-Calendar Plugin — 一个支持多日历档案的 Obsidian 插件。允许用户创建多个独立日历（如"生活日历"、"工作日历"），每个日历拥有独立的笔记路径规则和模板配置。

当前状态：**P0 全部完成** — 项目骨架 + 数据模型 + Database + CalendarManager + Pinia stores + 基础月视图。

已实现的模块：
- `manifest.json` / `package.json` / `tsconfig.json` / `esbuild.config.mjs` — 项目骨架
- `src/base/types.ts` — NoteType 枚举、CalendarViewMode、TemplatePluginType
- `src/entity/CalendarProfile.ts` — CalendarProfile 接口 + NoteConfig 接口 + createDefaultProfile()
- `src/entity/PluginSettings.ts` — PluginSettings 接口（version/calendars/activeCalendarId/templatePlugin）
- `src/core/Database.ts` — 数据持久化，loadData/saveData 封装，init 时自动创建默认配置
- `src/core/CalendarManager.ts` — 日历档案 CRUD + 切换（switchToNext/switchToPrev 循环切换）
- `src/stores/calendarStore.ts` — Pinia store，代理 CalendarManager 操作，自动 refresh
- `src/stores/viewStore.ts` — Pinia store，日期导航 / 视图模式 / 刷新计数器
- `src/view/App.tsx` — Vue 根组件，Header（左右两列：日历切换 + 年导航 + 今按钮 + 月导航）+ 42 格月视图 Grid
- `src/view/body/DayCell.tsx` — 日期格子组件，单击 select / 双击 open
- `src/shims-vue.ts` — 为 esbuild 注入 Vue 的 `h` 和 `Fragment`
- `styles.css` — 全 Obsidian CSS 变量，mc- 前缀

下一步：**P1 — CalendarSwitcher + DateNavigator + MonthView 抽离 + CalendarBody + 双击创建笔记**

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

# 构建（开发模式，含 sourcemap，自动 watch）
node esbuild.config.mjs

# 构建（生产模式，minify）
node esbuild.config.mjs production

# 本地测试：将 dist/ 复制或符号链接到 Obsidian vault 的 .obsidian/plugins/multi-calendar/
```

构建产物：`dist/main.js` + `dist/styles.css` + `dist/manifest.json`（manifest.json 需手工编写，不通过构建生成）。

开发时 Obsidian 端安装 Hot Reload 社区插件实现热重载，无需手动开关插件。

## Architecture

完整架构图见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。核心分层：

```
Plugin (main.ts)           ← Obsidian API 入口，注册 ItemView/Command/SettingTab
  ├── Core Layer           ← CalendarManager / NoteService / TemplateService / Database / FlushScheduler
  ├── State Layer (Pinia)  ← calendarStore (日历档案状态) + viewStore (视图状态)
  └── View Layer (Vue 3)   ← TSX 组件，通过 provide/inject 获取 plugin 实例
```

### Key Design Decisions

- **Vue TSX 而非 SFC**：esbuild 原生支持 TSX，零额外构建依赖。所有视图组件用 `.tsx` 文件 + `defineComponent` + render 函数，见 [docs/TECH-STACK.md §四](docs/TECH-STACK.md)。
- **消除 if-else 链**：用 `profile.notes[noteType]` 索引替代参考项目中的长 if-else，见 [ARCHITECTURE.md §3.2](docs/ARCHITECTURE.md)。
- **CSS Grid 手写日历**：不用任何日历组件库，`<div>` + CSS Grid 实现，前缀 `mc-`。
- **FlushScheduler 防抖刷新**：从参考项目提取的独立类，1 秒防抖，供 Vue 响应式系统消费。
- **设置面板用原生 DOM API**：Obsidian 的 `PluginSettingTab` 是命令式 API，不使用 Vue。
- **Database 使用 DataAdapter 接口**：构造函数接收 `{ loadData, saveData }` 对象，解耦 Obsidian 的 `Plugin` 类，便于测试。
- **ID 生成使用 `crypto.randomUUID()`**：现代浏览器/Electron 内置，无需额外依赖。
- **calendarStore 直接访问 CalendarManager 的私有字段 `manager["db"]`**：这是 Pinia store 与 Core 层之间的约定，类型安全通过 `CalendarManager` 的公开方法保证。

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

### 当前文件结构

```
src/
├── main.ts                       # 插件入口，注册 ItemView + provide('plugin')
├── shims-vue.ts                  # esbuild JSX 注入（h / Fragment）
├── base/
│   └── types.ts                  # NoteType 枚举, CalendarViewMode, TemplatePluginType
├── core/
│   ├── Database.ts               # 数据持久化，DataAdapter 接口
│   └── CalendarManager.ts        # 日历档案 CRUD + 循环切换
├── entity/
│   ├── CalendarProfile.ts        # CalendarProfile / NoteConfig 接口 + createDefaultProfile
│   └── PluginSettings.ts         # PluginSettings 接口
├── stores/
│   ├── calendarStore.ts          # Pinia: 日历档案状态，代理 CalendarManager
│   └── viewStore.ts              # Pinia: 日期导航 + 视图模式 + 刷新计数器
└── view/
    ├── App.tsx                   # Vue 根组件：Header + 42 格月视图 Grid
    └── body/
        └── DayCell.tsx           # 日期格子，单击 select / 双击 open
```

### 导入路径约定

项目中混用三种导入方式（由 tsconfig.json 的 `paths` 和 `baseUrl` 支持，esbuild 能正确解析）：
- `@/` 别名：`import type { PluginSettings } from "@/entity/PluginSettings"`（tsconfig paths 映射）
- `src/` 绝对路径：`import type { CalendarProfile } from "src/entity/CalendarProfile"`（baseUrl 指向 `.`）
- 相对路径：`import type { CalendarProfile } from "./CalendarProfile"`（同目录下）

### Implementation Priority (from ARCHITECTURE.md)

| 阶段 | 内容 | 状态 |
|------|------|------|
| P0 | 项目骨架（manifest/package/tsconfig/esbuild）| ✅ 完成 |
| P0 | 数据模型（types/CalendarProfile/PluginSettings）| ✅ 完成 |
| P0 | Database + CalendarManager | ✅ 完成 |
| P0 | Pinia stores（calendarStore + viewStore）| ✅ 完成 |
| P0 | 基础月视图（App.tsx + DayCell.tsx）| ✅ 完成 |
| P1 | CalendarSwitcher 组件（独立文件）| 🔜 下一步 |
| P1 | DateNavigator 组件（独立文件）| 🔜 下一步 |
| P1 | CalendarBody + MonthView 抽离 | 🔜 下一步 |
| P1 | 双击创建笔记（NoteService）| 🔜 下一步 |
| P2 | TemplateService + 模板插件适配 | |
| P3 | YearView + MonthCard + MainSettingTab | |
| P4 | 样式完善 + 边界处理 | |

## Key Patterns

- **Plugin 实例传递**：Vue 组件通过 `inject<MultiCalendarPlugin>('plugin')` 获取插件实例，进而访问 `plugin.database`、`plugin.calendarManager` 等。
- **路径规则使用 luxon 格式**：`yyyy-MM-dd`、`yyyy-MM-W` 等，预览时用 `DateTime.now().toFormat(pattern)` 生成实际路径。
- **CSS 全用 Obsidian 变量**：不写死颜色，使用 `--text-muted`、`--background-modifier-hover`、`--interactive-accent` 等变量自动适配主题。
- **模板插件兼容**：TemplateService 使用策略模式，统一适配 Obsidian 核心模板插件和 Templater 社区插件，通过 `templatePlugin` 设置项切换。
- **Pinia 与 Core 层协作**：calendarStore 内部持有 CalendarManager 实例，通过 `init()` 注册，操作后调用 `refresh()` 从 Database 重新读取同步状态。
- **DayCell 事件**：`onClick → emit('select', date)` 选中日期，`onDblclick → emit('open', date)` 打开/创建笔记。