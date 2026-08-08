import type { CalendarProfile } from "src/entity/CalendarProfile";
import type { Database } from "./Database";
import { createDefaultProfile } from "src/entity/CalendarProfile";

// 日历档案管理，CRUD+切换
export class CalendarManager {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    // 获取当前激活的日历档案
    getActiveProfile(): CalendarProfile {
        const settings = this.db.getSettings();
        const active = settings.calendars.find((c) => c.id === settings.activeCalendarId);
        if (!active) {
            throw new Error(`未找到激活的日历档案：${settings.activeCalendarId}`);
        }
        return active;
    }

    // 切换激活日历
    switchCalendar(id: string): void {
        const settings = this.db.getSettings();
        const exists = settings.calendars.some((c) => c.id === id);
        if (!exists) {
            throw new Error(`日历档案不存在：${id}`);
        }
        settings.activeCalendarId = id;
        this.db.saveSettings(settings);
    }

    // 创建新的日历档案
    createCalendar(name: string, color?: string): CalendarProfile {
        const profile = createDefaultProfile();
        profile.name = name;
        if (color) {
            profile.color = color;
        }
        const settings = this.db.getSettings();
        settings.calendars.push(profile);
        this.db.saveSettings(settings);

        return profile;
    }

    // 更新日历档案
    updateCalendar(id: string, patch: Partial<CalendarProfile>): void {
        const settings = this.db.getSettings();
        const index = settings.calendars.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error(`日历档案不存在：${id}`)
        }
        Object.assign(settings.calendars[index], patch);
        this.db.saveSettings(settings);
    }

    // 删除日历档案
    deleteCalendar(id: string): void {
        const settings = this.db.getSettings();
        if (settings.calendars.length <= 1) {
            throw new Error("至少保留一个日历档案");
        }
        const index = settings.calendars.findIndex(c => c.id === id);
        if (index === -1) return

        settings.calendars.splice(index, 1);
        if (settings.activeCalendarId === id) {
            settings.activeCalendarId = settings.calendars[0].id;
        }
        this.db.saveSettings(settings);
    }

    // 获取所有的日历档案
    listCalendars(): CalendarProfile[] {
        return this.db.getSettings().calendars;
    }

    // 切换到下一个（循环）
    switchToNext(): void {
        const settings = this.db.getSettings();
        const currentIndex = settings.calendars.findIndex(c => c.id === settings.activeCalendarId);
        const nextIndex = (currentIndex + 1) % settings.calendars.length;
        this.switchCalendar(settings.calendars[nextIndex].id);
    }

    // 切换到上一个（循环）
    switchToPrev(): void {
        const settings = this.db.getSettings();
        const currentIndex = settings.calendars.findIndex(c => c.id === settings.activeCalendarId);
        const nextIndex = (currentIndex - 1 + settings.calendars.length) % settings.calendars.length;
        this.switchCalendar(settings.calendars[nextIndex].id);
    }
}
