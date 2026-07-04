# 参考项目分析：dust-obsidian-calendar

## 一、项目概况

| 项 | 内容 |
|---|------|
| 名称 | @nano-dust/dust-calendar |
| 作者 | 纳米级尘埃 |
| 版本 | 1.4.0-local（本地修复版） |
| 技术栈 | React 18 + Redux Toolkit + TypeScript + luxon + esbuild |
| 位置 | `dust-obsidian-calendar-master/` |

## 二、项目结构

```
dust-obsidian-calendar-master/src/
├── main.ts                          # 插件入口，注册视图、命令、设置面板
├── base/
│   └── enum.ts                      # NoteType, CalendarViewType, TodoAnnotationMode 等枚举
├── core/                            # 核心逻辑
│   ├── Database.ts                  # 数据持久化（loadData/saveData）
│   ├── CalendarViewController.ts    # 刷新调度器 + 农历/节假日设置
│   ├── NoteController.ts            # 笔记 CRUD，大量的 if-else 判断 noteType
│   ├── TemplateController.ts        # 模板查找/插入，同样大量的 if-else
│   ├── NoteStatisticController.ts   # 笔记字数统计
│   ├── HolidayService.ts            # 中国节假日调休数据
│   └── ViewController.ts            # 视图相关设置代理
├── entity/                          # 数据模型
│   ├── PluginSetting.ts             # 所有设置的扁平类（~45 个字段）
│   ├── SelectedItem.ts              # 用户选中的日期/周/月/季/年
│   ├── DayListOfMonthView.ts        # 月视图日期列表计算
│   ├── DayItemFooterEntity.ts       # 日期格子底部信息（农历/节日）
│   ├── NoteInfo.ts                  # 笔记元信息
│   └── NoteStatistic.ts             # 笔记统计信息
├── util/                            # 工具类
│   ├── Path.ts / PathUtil.ts        # 路径操作
│   ├── TemplateUtil.ts              # 模板工具基类
│   ├── ObsidianTemplateUtil.ts      # Obsidian 核心模板插件适配
│   ├── TemplaterUtil.ts             # Templater 社区插件适配
│   └── util.ts                      # 通用工具函数
└── view/                            # UI 层
    ├── CalendarView.tsx             # Obsidian ItemView 容器，mount/unmount React 根节点
    ├── context.ts                   # React Context（传递 plugin 实例）
    ├── calendar_view/
    │   ├── CalendarViewImpl.tsx     # 顶层组件，根据 viewType 渲染 MonthView 或 YearView
    │   ├── CalendarViewHeader.tsx   # 导航栏：年/季/月切换器 + "今"按钮 + 月/年视图切换
    │   ├── MonthView.tsx            # 月视图：WeekHeader + MonthViewRow × N
    │   ├── YearView.tsx             # 年视图：12 个月缩略卡
    │   └── StatisticLabel.tsx       # 字数统计点
    ├── setting/
    │   ├── MainSettingTab.tsx       # 设置面板，注册 15+ 个设置项
    │   ├── NotePattern.tsx          # 笔记路径规则输入组件
    │   ├── NoteTemplate.tsx         # 模板文件名输入组件
    │   └── ...                      # 各种下拉/滑块组件
    └── redux/
        ├── store.ts                 # Redux store 配置
        ├── hooks.ts                 # useSelector/useDispatch 类型包装
        ├── selectedItemSlice.ts     # 当前选中日期状态
        └── calendarViewType.ts      # 月视图/年视图切换状态
```

## 三、数据模型（现有）

```typescript
// PluginSetting.ts — 所有设置字段
class PluginSetting {
    // 显示设置
    shouldDisplayLunarInfo: boolean;
    shouldDisplayHolidayInfo: boolean;
    fontSizeChangeMode: FontSizeChangeMode;
    immutableFontSizeFactor: number;
    quarterNameMode: QuarterNameMode;
    wordsPerDot: number;
    dotUpperLimit: number;
    todoAnnotationMode: TodoAnnotationMode;

    // 创建设置
    shouldConfirmBeforeCreatingNote: boolean;
    templatePlugin: TemplatePlugin;

    // 每日笔记 (×5 套，日/周/月/季/年，每套 3 个字段 = 15 个字段)
    dailyNoteOption: boolean;
    dailyNotePattern: string;
    dailyTemplateFilename: string;
    weeklyNoteOption: boolean;
    weeklyNotePattern: string;
    weeklyTemplateFilename: string;
    // ... 月/季/年同理 ...
}
```

**问题所在：** 这 15 个笔记配置字段只有一套。如果用户想要"生活日记"和"工作日报"两套配置，现有数据结构无法支持。

### 核心逻辑模式

所有涉及 NoteType 的方法都使用长 if-else 链：

```typescript
// NoteController.ts 中的典型模式
public getNotePattern(noteType: NoteType): string {
    if (noteType === NoteType.DAILY) {
        return setting.dailyNotePattern;
    } else if (noteType === NoteType.WEEKLY) {
        return setting.weeklyNotePattern;
    } else if (noteType === NoteType.MONTHLY) {
        return setting.monthlyNotePattern;
    }
    // ...
}
```

新项目改进方式：「NoteType → Config」直接用 Map/Object 索引，消除 if-else。

### 刷新调度机制

```typescript
// CalendarViewController.ts
// 防抖策略：1 秒内多次 requestFlush() 只执行一次
// forceFlush() 跳过防抖立即刷新
// 刷新通过增加 counter 值 + 触发事件实现，React 组件监听 counter 变化重新渲染
```

这个机制设计合理，新项目独立为 `FlushScheduler` 类。

## 四、日历视图实现分析

日历视图**完全手写**，没有使用任何第三方日历组件库。

### MonthView 结构

```
MonthViewHeader              ← 固定表头：周 | 一 | 二 | 三 | 四 | 五 | 六 | 日
MonthViewRow × N (4~6)       ← 每月 4-6 周
  ├── WeekIndexItem          ← 周序号（可点击选中，双击打开周记）
  ├── DayItem × 7            ← 周一到周日
  │     ├── DayItemBody      ← 日期数字 + 调休标注（班/休）
  │     ├── DayItemFooter    ← 农历/节气/节日
  │     └── StatisticLabel   ← 笔记字数统计点
  └── ...
```

### 关键交互

| 操作 | 触发区域 | 行为 |
|------|---------|------|
| 单击日期格子 | DayItem | 选中该日期（高亮） |
| 双击日期格子 | DayItem | 打开/创建对应类型的笔记 |
| 单击周序号 | WeekIndexItem | 选中该周 |
| 双击周序号 | WeekIndexItem | 打开/创建周记 |
| 双击月份名 | MonthItem (Header) | 打开/创建月记 |
| 双击年份名 | YearItem (Header) | 打开/创建年记 |
| 点击"今" | TodayItem (Header) | 跳转到今天 |
| 点击"月"/"年" | ViewSelector (Header) | 切换月视图/年视图 |

### 样式体系

所有样式使用 CSS 类名，前缀 `d-`（dust 缩写），依赖 Obsidian 的 CSS 变量：
- `--text-muted`, `--background-modifier-hover`, `--background-modifier-border` 等
- 自定义 CSS 变量：`--d-font-size-factor`, `--d-font-size-custom-enable`

新项目使用独立的前缀和 CSS 变量体系。

## 五、构建流程

```
TypeScript 源码
    ↓ tsc -noEmit -skipLibCheck        ← 类型检查
    ↓ esbuild (esbuild.config.mjs)      ← 打包
    ↓
dist/main.js + styles.css + manifest.json  ← Obsidian 插件产物
```

仅 `main.ts` 作为入口，所有依赖被打包进 `main.js`，`obsidian` 包被标记为 external。

## 六、可借鉴的设计

| 设计 | 借鉴程度 | 说明 |
|------|---------|------|
| luxon 日期格式化 | 完全借鉴 | 路径规则模板语法完全一致 |
| 防抖刷新调度 | 借鉴并改进 | 独立成 FlushScheduler 类 |
| Obsidian 模板/Templater 适配 | 借鉴 | 模板插件兼容层设计 |
| 月视图 CSS Grid 布局 | 借鉴布局思路 | 用 div 而非 table |
| 周序号 + 日期格子的组合行 | 借鉴 | 一周一行的结构 |
| 设置面板的结构 | 借鉴部分 | Obdisian Setting API 用法 |

## 七、需要在新项目中避免的问题

| 问题 | 描述 | 改进方式 |
|------|------|---------|
| 扁平设置导致不可扩展 | 45 个字段全平铺在 PluginSetting | 使用嵌套结构 CalendarProfile.notes[NoteType] |
| 大量 if-else | NoteController 和 TemplateController 充斥类型判断 | 使用 Object/Map 索引 |
| CalendarViewController 职责混乱 | 同时处理刷新、农历设置、节假日设置 | 拆分为 FlushScheduler + 各自独立的 controller |
| 没有类型安全的索引 | `setting.dailyXxx` 等命名约定依赖 | 用 `notes[NoteType.DAILY]` 类型安全索引 |
| 硬编码的 NoteType 映射 | 添加新笔记类型需要改 5+ 个文件 | CalendarProfile 中的 notes Map 统一管理 |
