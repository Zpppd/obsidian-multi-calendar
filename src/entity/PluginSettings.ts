import type { CalendarProfile } from "./CalendarProfile";
import type { TemplatePluginType } from "src/base/types";

// 插件设置
export interface PluginSettings {
    version: string;  // 插件版本
    calendars: CalendarProfile[];  // 日历档案列表
    activeCalendarId: string;  // 当前激活的日历档案ID
    shouldConfirmBeforeCreate: boolean;  // 创建笔记前是否需要确认
    templatePlugin: TemplatePluginType;  // 模板插件类型
}