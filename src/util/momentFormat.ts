import { moment } from "obsidian";

// Obsidian 的 moment 类型是命名空间，运行时是函数，这里统一收口调用
export function formatMoment(date: Date, pattern: string): string {
    const m = (moment as unknown as (input?: Date) => {
        format(pattern: string): string;
    });
    return m(date).format(pattern);
}
