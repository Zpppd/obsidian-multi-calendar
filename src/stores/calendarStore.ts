// 日历档案状态
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { CalendarProfile } from "src/entity/CalendarProfile";
import type { CalendarManager } from "@/core/CalendarManager";

export const useCalendarStore = defineStore("calendar", () => {
    const profiles = ref<CalendarProfile[]>([]);
    const activeId = ref<string>();

    const activeProfile = computed(() => 
        profiles.value.find(p => p.id === activeId.value)
    )

    const activeIndex = computed(() => 
        profiles.value.findIndex(p => p.id === activeId.value)
    )

    let manager: CalendarManager | null = null;

    // 用 CalendarManager 初始化
    function init(mgr: CalendarManager) {
        manager = mgr;
        const settings = mgr["db"].getSettings();
        profiles.value = settings.calendars;
        activeId.value = settings.activeCalendarId;
    }

    // 刷新列表（从 Database 重新读取）
    function refresh() {
        if (!manager) return;
        const settings = manager["db"].getSettings();
        profiles.value = settings.calendars;
        activeId.value = settings.activeCalendarId;
    }

    function switchTo(id: string) {
        manager?.switchCalendar(id);
        refresh();
    }

    function switchToNext() {
        manager?.switchToNext();
        refresh();
    }

    function switchToPrev() {
        manager?.switchToPrev();
        refresh();
    }

    function addProfile(name: string) {
        manager?.createCalendar(name);
        refresh();
    }

    function updateProfile(id: string, patch: Partial<CalendarProfile>) {
        manager?.updateCalendar(id, patch);
        refresh();
    }

    function removeProfile(id: string) {
        manager?.deleteCalendar(id);
        refresh();
    }

    return {
        profiles,
        activeId,
        activeProfile,
        activeIndex,
        init,
        refresh,
        switchTo,
        switchToNext,
        switchToPrev,
        addProfile,
        updateProfile,
        removeProfile,
    }
})