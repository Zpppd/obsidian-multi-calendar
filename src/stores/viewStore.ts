// 视图状态
import { ref } from "vue";
import { defineStore } from "pinia";
import { DateTime } from "luxon";
import type { CalendarViewMode } from "@/base/types";

export const useViewStore = defineStore("view", () => {
    const selectedDate = ref<DateTime>(DateTime.now());
    const viewMode = ref<CalendarViewMode>("month");
    const flushCounter = ref(0);
    // 是否通过点击周序号选中（true=整周高亮，false=仅选中当天）
    const selectedByWeek = ref(false);

    function selectDate(date: DateTime) {
        selectedDate.value = date;
        selectedByWeek.value = false;
    }

    // 通过周序号选中该周（整周高亮）
    function selectWeek(date: DateTime) {
        selectedDate.value = date;
        selectedByWeek.value = true;
    }

    function toggleViewMode() {
        viewMode.value = viewMode.value === "month" ? "year" : "month";
    }

    function setViewMode(mode: CalendarViewMode) {
        viewMode.value = mode;
    }

    // 前/后一个季度（±3 个月，跨年自动，Q1↔Q4 循环）
    function goToPrevQuarter() {
        selectedDate.value = selectedDate.value.minus({ months: 3 });
    }

    function goToNextQuarter() {
        selectedDate.value = selectedDate.value.plus({ months: 3 });
    }

    function triggerFlush() {
        flushCounter.value++;
    }

    function goToToday() {
        selectedDate.value = DateTime.now();
    }

    function goToPrevMonth() {
        selectedDate.value = selectedDate.value.minus({ months: 1 });
    }

    function goToNextMonth() {
        selectedDate.value = selectedDate.value.plus({ months: 1 });
    }

    function goToPrevYear() {
        selectedDate.value = selectedDate.value.minus({ years: 1 });
    }

    function goToNextYear() {
        selectedDate.value = selectedDate.value.plus({ years: 1 });
    }

    return {
        selectedDate, viewMode, flushCounter, selectedByWeek,
        selectDate, selectWeek, toggleViewMode, setViewMode, triggerFlush, goToToday,
        goToPrevMonth, goToNextMonth, goToPrevYear, goToNextYear,
        goToPrevQuarter, goToNextQuarter,
    };
})