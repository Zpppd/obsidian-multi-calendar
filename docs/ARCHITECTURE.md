# 架构设计方案

## 一、整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     Plugin (main.ts)                     │
│  注册 ItemView / Command / SettingTab                   │
├─────────────────────────────────────────────────────────┤
│                      Core Layer                          │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐        │
│  │CalendarManager│ │NoteService│ │TemplateService│       │
│  │ 日历档案 CRUD │ │笔记创建   │ │模板引擎适配   │       │
│  └──────┬───────┘ └────┬─────┘ └──────┬───────┘        │
│         │              │              │                  │
│  ┌──────┴──────────────┴──────────────┴───────┐        │
│  │              Database                       │        │
│  │         loadData() / saveData()             │        │
│  └──────────────────┬─────────────────────────┘        │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────┐       │
│  │            FlushScheduler                    │       │
│  │          防抖刷新调度器                        │       │
│  └─────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────┤
│                      State Layer (Pinia)                 │
│  ┌──────────────────┐  ┌─────────────────────┐         │
│  │  calendarStore   │  │     viewStore        │         │
│  │  - profiles[]    │  │  - selectedDate      │         │
│  │  - activeId      │  │  - viewMode          │         │
│  │  - activeProfile │  │  - flushCounter      │         │
│  └──────────────────┘  └─────────────────────┘         │
├─────────────────────────────────────────────────────────┤
│                      View Layer (Vue 3)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   App.vue                         │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │           CalendarSwitcher.vue              │  │  │
│  │  │     ◀ [生活日历] ▶ [+]                     │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │           DateNavigator.vue                 │  │  │
│  │  │  ◀ 2026年 ▶ ◀ 3季度 ▶ ◀ 7月 ▶ [今] [年]  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │         MonthView / YearView               │  │  │
│  │  │              (条件渲染)                      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                 Obsidian Plugin API                      │
│         app.vault / app.workspace / ItemView            │
└─────────────────────────────────────────────────────────┘
```

## 二、数据模型设计

### 2.1 顶层设置

```typescript
// entity/PluginSettings.ts
interface PluginSettings {
    version: number;                        // 数据版本号（用于迁移）
    calendars: CalendarProfile[];           // 所有日历档案
    activeCalendarId: string;               // 当前激活的日历 ID
    shouldConfirmBeforeCreate: boolean;     // 创建笔记前是否确认
    templatePlugin: TemplatePluginType;     // 模板插件选择
}

type TemplatePluginType = "none" | "obsidian" | "templater";
```

### 2.2 日历档案

```typescript
// entity/CalendarProfile.ts
interface CalendarProfile {
    id: string;                             // 唯一标识
    name: string;                           // 用户命名，如"生活日历"
    color: string;                          // 标记颜色，如 "#4A90D9"
    notes: Record<NoteType, NoteConfig>;    // 五种笔记配置
}

enum NoteType {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
}

interface NoteConfig {
    enabled: boolean;       // 是否启用
    pathPattern: string;    // 路径规则，如 "工作日报/yyyy-MM-dd"
    templateFile: string;   // 模板文件名，如 "work-daily.md"
}
```

### 2.3 defaults 与迁移

首次安装时创建默认配置：

```typescript
function createDefaultProfile(): CalendarProfile {
    return {
        id: crypto.randomUUID(),
        name: "默认日历",
        color: "#4A90D9",
        notes: {
            daily:     { enabled: false, pathPattern: "", templateFile: "" },
            weekly:    { enabled: false, pathPattern: "", templateFile: "" },
            monthly:   { enabled: false, pathPattern: "", templateFile: "" },
            quarterly: { enabled: false, pathPattern: "", templateFile: "" },
            yearly:    { enabled: false, pathPattern: "", templateFile: "" },
        }
    };
}
```

## 三、核心模块设计

### 3.1 CalendarManager

```typescript
// core/CalendarManager.ts
class CalendarManager {
    private plugin: MultiCalendarPlugin;

    // 获取当前激活的日历档案
    getActiveProfile(): CalendarProfile;

    // 切换激活日历
    switchCalendar(id: string): void;

    // CRUD
    createCalendar(name: string, color?: string): CalendarProfile;
    updateCalendar(id: string, patch: Partial<CalendarProfile>): void;
    deleteCalendar(id: string): void;       // 至少保留一个

    // 列表
    listCalendars(): CalendarProfile[];

    // 切换顺序（支持左右箭头）
    switchToNext(): void;
    switchToPrev(): void;
}
```

### 3.2 NoteService

```typescript
// core/NoteService.ts
class NoteService {
    private plugin: MultiCalendarPlugin;

    // 获取笔记文件路径（从 activeProfile 的 notes[noteType] 读取 pathPattern）
    getNotePath(date: DateTime, noteType: NoteType): string | null;

    // 检查笔记是否存在
    hasNote(date: DateTime, noteType: NoteType): boolean;

    // 打开已有笔记，或创建新笔记
    async openOrCreate(date: DateTime, noteType: NoteType): Promise<void>;

    // 获取模板文件名
    getTemplateFile(noteType: NoteType): string | null;
}
```

**关键：不再有 if-else 链。** 所有配置通过 `activeProfile.notes[noteType]` 索引获取。

### 3.3 TemplateService

```typescript
// core/TemplateService.ts
class TemplateService {
    private plugin: MultiCalendarPlugin;
    private templateUtil: TemplateUtil;  // 策略模式，按 templatePlugin 切换实现

    // 更新模板插件策略
    setPlugin(type: TemplatePluginType): void;

    // 插入模板到当前活动笔记
    insertTemplate(noteType: NoteType): void;

    // 获取模板文件
    getTemplateFile(noteType: NoteType): TAbstractFile | null;
}
```

### 3.4 FlushScheduler

```typescript
// core/FlushScheduler.ts
class FlushScheduler {
    private requestCounter: number;
    private lastRequestTime: number;
    private flushCounter: number;
    private listeners: Set<() => void>;

    // 请求刷新（1 秒防抖）
    requestFlush(): void;

    // 强制立即刷新
    forceFlush(): void;

    // 供 Vue 组件注册刷新回调
    onFlush(callback: () => void): () => void;
}
```

参考项目的防抖机制，独立出来，职责单一。

## 四、Pinia Store 设计

### 4.1 calendarStore

```typescript
// stores/calendarStore.ts
export const useCalendarStore = defineStore('calendar', () => {
    const profiles = ref<CalendarProfile[]>([]);
    const activeId = ref<string>('');

    // 计算属性：当前激活的日历档案
    const activeProfile = computed(() =>
        profiles.value.find(p => p.id === activeId.value)
    );

    // 计算属性：当前日历的序号（用于切换时显示"第 2/3 个"）
    const activeIndex = computed(() =>
        profiles.value.findIndex(p => p.id === activeId.value)
    );

    // 操作
    function switchTo(id: string) { activeId.value = id; }
    function switchToNext() { /* 循环到下一个 */ }
    function switchToPrev() { /* 循环到上一个 */ }
    function addProfile(name: string) { /* 创建并 push */ }
    function updateProfile(id: string, patch: Partial<CalendarProfile>) { /* 更新 */ }
    function removeProfile(id: string) { /* 删除，至少保留一个 */ }

    return {
        profiles, activeId, activeProfile, activeIndex,
        switchTo, switchToNext, switchToPrev,
        addProfile, updateProfile, removeProfile,
    };
});
```

### 4.2 viewStore

```typescript
// stores/viewStore.ts
export const useViewStore = defineStore('view', () => {
    const selectedDate = ref<DateTime>(DateTime.now());
    const viewMode = ref<CalendarViewMode>('month');
    const flushCounter = ref<number>(0);

    function selectDate(date: DateTime) { selectedDate.value = date; }
    function toggleViewMode() {
        viewMode.value = viewMode.value === 'month' ? 'year' : 'month';
    }
    function triggerFlush() { flushCounter.value++; }
    function goToToday() { selectedDate.value = DateTime.now(); }
    function goToPrevMonth() { selectedDate.value = selectedDate.value.minus({ months: 1 }); }
    function goToNextMonth() { selectedDate.value = selectedDate.value.plus({ months: 1 }); }
    function goToPrevYear() { selectedDate.value = selectedDate.value.minus({ years: 1 }); }
    function goToNextYear() { selectedDate.value = selectedDate.value.plus({ years: 1 }); }

    return {
        selectedDate, viewMode, flushCounter,
        selectDate, toggleViewMode, triggerFlush, goToToday,
        goToPrevMonth, goToNextMonth, goToPrevYear, goToNextYear,
    };
});
```

## 五、组件设计

### 5.1 组件树

```
App.vue
├── CalendarSwitcher.vue              ★ 核心新组件
│   ├── props: 无（直接读 calendarStore）
│   ├── 渲染：◀ 日历名称 ▶ [+]
│   └── 交互：
│       ├── ◀ → calendarStore.switchToPrev()
│       ├── ▶ → calendarStore.switchToNext()
│       ├── 点击名称 → 编辑名称（内联 input）
│       └── + → 弹出输入框，输入名称后 calendarStore.addProfile()
│
├── DateNavigator.vue                  ← 参考 CalendarViewHeader.tsx
│   ├── YearNavigator    ◀ 2026年 ▶
│   ├── MonthNavigator   ◀ 7月 ▶
│   ├── QuarterNavigator ◀ 3季度 ▶
│   ├── TodayButton      [今]
│   └── ViewModeToggle   [月] / [年]
│
└── CalendarBody.vue                   ← 条件渲染
    ├── MonthView.vue (if viewMode === 'month')
    │   ├── MonthViewHeader    ← 周 | 一 | 二 | 三 | 四 | 五 | 六 | 日
    │   └── MonthViewRow × N   ← 4-6 行
    │       ├── WeekIndexCell  ← 周序号
    │       └── DayCell × 7    ← 日期格子
    │
    └── YearView.vue (if viewMode === 'year')
        └── MonthCard × 12     ← 12 个缩略月卡片
```

### 5.2 核心组件详细设计

#### CalendarSwitcher.vue

```
┌──────────────────────────────────────────┐
│  <  [生活日历 ▼]  >  [+ 新增]           │
│     ┌──────────┐                         │
│     │ 生活日历  │  ← 当前激活（● 标记）   │
│     ├──────────┤                         │
│     │ 工作日历  │                         │
│     ├──────────┤                         │
│     │ 学习日历  │                         │
│     └──────────┘                         │
└──────────────────────────────────────────┘
```

两种交互方式（同时支持）：
- **箭头切换**：点击 `<` `>` 即时切换到上一个/下一个日历
- **下拉菜单**：点击日历名称弹出下拉菜单，可快速跳转到任意日历

状态管理：
```typescript
const calendarStore = useCalendarStore();
// 渲染时读取 calendarStore.profiles 和 calendarStore.activeId
// 切换时调用 calendarStore.switchTo() 等
```

#### DayCell 日期格子设计

这是最核心的日历渲染单元，完全手写，结构如下：

```
┌─────────────┐
│     15       │  ← 日期数字 (.day-cell-number)
│    班        │  ← 调休标注 (.day-cell-badge, 可选)
│    ··        │  ← 笔记统计点 (.day-cell-dots)
└─────────────┘
```

```typescript
// 组件接口
interface DayCellProps {
    date: DateTime;             // 本格子的日期
    isCurrentMonth: boolean;    // 是否属于当前月（不属于则灰色）
    isToday: boolean;           // 是否是今天
    isSelected: boolean;        // 是否被用户选中
}

// 交互
// 单击 → viewStore.selectDate(date)
// 双击 → noteService.openOrCreate(date, NoteType.DAILY)
```

#### MonthView 布局设计

使用 CSS Grid，而非 `<table>`：

```css
.month-view-grid {
    display: grid;
    grid-template-columns: 40px repeat(7, 1fr);  /* 第一列周序号, 后7列日期 */
    grid-template-rows: auto repeat(6, 1fr);      /* 第一行表头, 最多6行 */
    gap: 2px;
}
```

```html
<!-- MonthView 的 DOM 结构 -->
<div class="month-view-grid">
    <!-- 表头行 -->
    <div class="header-cell week-col">周</div>
    <div class="header-cell">一</div>
    <div class="header-cell">二</div>
    ...
    <div class="header-cell">日</div>

    <!-- 数据行 × N（循环渲染） -->
    <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
        <WeekIndexCell :date="week.monday" />
        <DayCell v-for="(day, dayIndex) in week.days" :key="dayIndex"
                 :date="day.date"
                 :is-current-month="day.isCurrentMonth"
                 :is-today="day.isToday"
                 :is-selected="day.isSelected" />
    </template>
</div>
```

#### YearView 设计

参考现有项目的年视图：12 个缩略月卡片，每个卡片显示该月的小日历 + 月份名。双击月份名打开月记。

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   1月     │ │   2月     │ │   3月     │ │   4月     │
│ 一 二...  │ │ 一 二...  │ │ 一 二...  │ │ 一 二...  │
│ ...       │ │ ...       │ │ ...       │ │ ...       │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   5月     │ │   6月     │ │   7月     │ │   8月     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
...
```

## 六、Vue 与 Obsidian 集成设计

### 6.1 ItemView 挂载

```typescript
// view/CalendarView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';

export const VIEW_TYPE = "multi-calendar-view";

export class CalendarView extends ItemView {
    private vueApp: VueApp | null = null;

    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return "多日历"; }
    getIcon() { return "lucide-calendar-check"; }

    async onOpen() {
        const pinia = createPinia();
        this.vueApp = createApp(App);
        this.vueApp.use(pinia);

        // 注入 plugin 实例，供所有组件通过 inject 访问
        this.vueApp.provide('plugin', this.plugin);

        // 挂载到 Obsidian 提供的 DOM 容器
        // containerEl.children[1] 是 Obsidian ItemView 的内容区域
        this.vueApp.mount(this.containerEl.children[1]);
    }

    async onClose() {
        this.vueApp?.unmount();
    }

    // 被 FlushScheduler 调用以刷新整个视图
    flush() {
        // Vue 的响应式系统会自动处理，这里只需触发 store 中的计数器
        // 但如果需要完全重新渲染：
        this.vueApp?.unmount();
        this.onOpen();
    }
}
```

### 6.2 Plugin 注入

使用 Vue 的 `provide/inject` 传递 plugin 实例：

```typescript
// 在 setup 中获取
import { inject } from 'vue';
import type MultiCalendarPlugin from '../main';

const plugin = inject<MultiCalendarPlugin>('plugin')!;
// 现在可以访问 plugin.noteService, plugin.calendarManager 等
```

## 七、样式体系设计

### 7.1 CSS 命名规范

使用 `mc-` 前缀（multi-calendar），避免与 Obsidian 和其他插件的样式冲突：

```css
.mc-calendar-switcher { }
.mc-calendar-switcher-name { }
.mc-date-navigator { }
.mc-month-view-grid { }
.mc-day-cell { }
.mc-day-cell--today { }
.mc-day-cell--selected { }
.mc-day-cell--other-month { }
```

### 7.2 使用 Obsidian CSS 变量

```css
.mc-calendar-switcher {
    border-bottom: 1px solid var(--background-modifier-border);
    padding: 6px 0;
}

.mc-day-cell:hover {
    background: var(--background-modifier-hover);
}

.mc-day-cell--selected {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
}

.mc-day-cell--today {
    font-weight: bold;
    color: var(--interactive-accent);
}
```

### 7.3 暗色/亮色主题适配

不写死颜色，全部使用 Obsidian CSS 变量，自动适配主题。

## 八、设置面板设计

### 8.1 布局

```
┌───────────────────────────────────────────────┐
│ 日历管理                                       │
│ ┌───────────────────────────────────────────┐ │
│ │ ☰ 生活日历  ●  [#4A90D9]  [✎] [🗑]     │ │
│ │ ☰ 工作日历     [#FF6B6B]  [✎] [🗑]     │ │
│ │ ☰ 学习日历     [#51CF66]  [✎] [🗑]     │ │
│ └───────────────────────────────────────────┘ │
│                          [+ 新增日历]         │
├───────────────────────────────────────────────┤
│ 正在编辑：生活日历          [设为当前日历]     │
│                                               │
│ 日历名称: [生活日历          ]                │
│ 标记颜色: [■] #4A90D9                         │
│                                               │
│ ─── 每日笔记 ───          [开关 ON]           │
│ 路径规则: [生活日记/yyyy-MM-dd           ]    │
│ 预览: → 生活日记/2026-07-04.md               │
│ 模板文件: [life-daily-template.md        ]    │
│                                               │
│ ─── 每周笔记 ───          [开关 OFF]          │
│ ...                                           │
└───────────────────────────────────────────────┘
```

### 8.2 组件实现

设置面板不使用 Vue（Obsidian 的 `PluginSettingTab` 是命令式的 DOM API）：

```typescript
// view/setting/MainSettingTab.ts
export class MainSettingTab extends PluginSettingTab {
    display() {
        const { containerEl } = this;
        containerEl.empty();

        // 日历管理区 — 使用 DOM API
        this.renderCalendarManagement(containerEl);

        // 笔记配置区 — 动态更新，根据选中的日历显示
        this.renderNoteConfigs(containerEl);
    }

    private renderCalendarManagement(container: HTMLElement) {
        // 使用 Obsidian 的 Setting API
        new Setting(container)
            .setName("日历管理")
            .setHeading();

        const calendars = this.plugin.calendarManager.listCalendars();
        for (const cal of calendars) {
            new Setting(container)
                .setName(cal.name)
                .addButton(btn => btn.setIcon("pencil").onClick(() => this.renameCalendar(cal.id)))
                .addButton(btn => btn.setIcon("trash").onClick(() => this.deleteCalendar(cal.id)));
        }

        new Setting(container)
            .addButton(btn => btn.setButtonText("+ 新增日历").onClick(() => this.addCalendar()));
    }

    private renderNoteConfigs(container: HTMLElement) {
        // 当前编辑的日历的笔记配置
        // 为 DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY 各自渲染一组：
        //   toggle(enable/disable)
        //   input(pathPattern)
        //   input(templateFile)
        //   preview(实际路径)
    }
}
```

## 九、文件列表（完整）

```
obsidian-multi-calendar/
├── README.md
├── docs/
│   ├── REQUIREMENTS.md              ← 需求说明
│   ├── TECH-STACK.md                ← 技术选型与要求
│   ├── REFERENCE-ANALYSIS.md        ← 参考项目分析
│   └── ARCHITECTURE.md              ← 架构设计（本文件）
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── styles.css
└── src/
    ├── main.ts                       # 插件入口
    ├── base/
    │   └── types.ts                  # NoteType, CalendarViewMode 等枚举
    ├── core/
    │   ├── CalendarManager.ts        # 日历档案 CRUD + 切换
    │   ├── NoteService.ts            # 笔记创建/打开
    │   ├── TemplateService.ts        # 模板引擎适配
    │   ├── Database.ts               # 数据持久化
    │   └── FlushScheduler.ts         # 防抖刷新
    ├── entity/
    │   ├── CalendarProfile.ts        # 日历档案数据模型
    │   └── PluginSettings.ts         # 顶层设置接口
    ├── stores/
    │   ├── calendarStore.ts          # Pinia 日历状态
    │   └── viewStore.ts              # Pinia 视图状态
    ├── view/
    │   ├── CalendarView.ts           # Obsidian ItemView
    │   ├── App.tsx                   # Vue 根组件
    │   ├── header/
    │   │   ├── CalendarSwitcher.tsx  # 日历切换器 ★ 核心
    │   │   └── DateNavigator.tsx     # 日期导航
    │   ├── body/
    │   │   ├── CalendarBody.tsx      # MonthView / YearView 条件渲染
    │   │   ├── MonthView.tsx         # 月视图
    │   │   ├── YearView.tsx          # 年视图
    │   │   ├── DayCell.tsx           # 日期格子
    │   │   └── MonthCard.tsx         # 年度视图中的月份缩略卡
    │   └── setting/
    │       └── MainSettingTab.ts     # 设置面板
    └── util/
        ├── PathUtil.ts               # 路径工具
        └── TemplateUtil.ts           # 模板工具（策略模式基类）
```

## 十、实现优先级

| 优先级 | 模块 | 理由 |
|--------|------|------|
| P0 | 项目骨架 + 构建配置 | 没有这个什么都跑不起来 |
| P0 | 数据模型 + Database | 所有功能的基础 |
| P1 | CalendarManager + Pinia stores | 核心业务逻辑 |
| P1 | CalendarView + App + CalendarSwitcher | 最简可用 UI |
| P1 | MonthView + DayCell | 月视图是主要功能 |
| P2 | NoteService + TemplateService | 笔记创建/模板 |
| P2 | DateNavigator | 导航交互 |
| P3 | YearView + MonthCard | 年视图补充 |
| P3 | MainSettingTab | 设置面板 |
| P4 | 样式完善 + 边界处理 | 打磨 |
