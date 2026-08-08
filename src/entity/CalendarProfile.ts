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

// 默认日历档案
export function createDefaultProfile(): CalendarProfile {
    const defaultNoteConfig: NoteConfig = {
        enabled:false,
        pathPattern: "",
        templateFile: ""
    };

    return {
        id: crypto.randomUUID(),
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