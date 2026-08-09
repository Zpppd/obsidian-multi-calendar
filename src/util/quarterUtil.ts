import type MultiCalendarPlugin from "../main";

// 中英文季度名（chinese 模式）
const CHINESE_QUARTERS = ["春", "夏", "秋", "冬"];

// 根据配置返回季度显示文本：number → "第3季度"，chinese → "秋季"
export function getQuarterLabel(plugin: MultiCalendarPlugin, quarter: number): string {
    const settings = plugin.database.getSettings();
    if (settings.quarterNameMode === "chinese") {
        const season = CHINESE_QUARTERS[quarter - 1] ?? "";
        return `${season}季`;
    }
    return `第${quarter}季度`;
}
