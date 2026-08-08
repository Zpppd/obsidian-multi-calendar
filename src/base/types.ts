// 五种笔记类型
export enum NoteType {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly",
    QUARTERLY = "quarterly"
}

// 视图模式
export type CalendarViewMode = "month" | "year";

// 模板插件类型（默认 Obsidian 核心模板）
export type TemplatePluginType = "obsidian" | "templater";
