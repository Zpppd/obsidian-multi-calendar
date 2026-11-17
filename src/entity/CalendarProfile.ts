import type { NoteType } from "src/base/types";

// 单个笔记类型的配置
export interface NoteConfig {
    enabled: boolean;
    pathPattern: string;  // 笔记路径
    templateFile: string;  // 所用模板
}

// 日历档案
export interface CalendarProfile {
    id: string;
    name: string;
    color: string;
    notes: Record<NoteType, NoteConfig>;  // 每种笔记类型的配置
}

// 生成日历 ID：纯 JS 实现，不依赖 crypto.randomUUID（移动端 WebView 非安全上下文下不可用）
function generateId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 默认日历档案
export function createDefaultProfile(): CalendarProfile {
    const defaultNoteConfig: NoteConfig = {
        enabled:false,
        pathPattern: "",
        templateFile: ""
    };

    return {
        id: generateId(),
        name: "默认日历",
        color: "#4A90D9",
        notes: {
            daily: { ...defaultNoteConfig },
            weekly: { ...defaultNoteConfig },
            monthly: { ...defaultNoteConfig },
            quarterly: { ...defaultNoteConfig },
            yearly: { ...defaultNoteConfig },
        }
    };
}