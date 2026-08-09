import type { CalendarProfile } from "./CalendarProfile";
import type { TemplatePluginType } from "src/base/types";

// 插件设置
export interface PluginSettings {
    version: string;  // 插件版本
    calendars: CalendarProfile[];  // 日历档案列表
    activeCalendarId: string;  // 当前激活的日历档案ID
    shouldConfirmBeforeCreate: boolean;  // 创建笔记前是否需要确认
    templatePlugin: TemplatePluginType;  // 模板插件类型
    // 笔记统计点配置
    dotColor: string;       // 统计点颜色
    wordsPerDot: number;    // 一个点代表多少字
    dotUpperLimit: number;  // 最多显示几个点
    // 显示开关
    shouldDisplayLunarInfo: boolean;    // 是否显示农历
    shouldDisplayHolidayInfo: boolean;  // 是否显示节假日/调休
    // 季度命名方式
    quarterNameMode: "number" | "chinese";  // number=第1季度, chinese=春季
}