// 视图状态
import { ref } from "vue";
import { defineStore } from "pinia";
import { DateTime } from "luxon";
import type { CalendarViewMode } from "@/base/types";

export const useViewStore = defineStore("view", () => {
    const selectedDate = ref<DateTime>(DateTime.now());
    const viewMode = ref<CalendarViewMode>("month");
    const flushCounter = ref(0);

    function selectDate(date: DateTime) {
        selectedDate.value = date;
    }

    function toggleViewMode() {
        viewMode.value = viewMode.value === "month" ? "year" : "month";
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
        selectedDate, viewMode, flushCounter,
        selectDate, toggleViewMode, triggerFlush, goToToday,
        goToPrevMonth, goToNextMonth, goToPrevYear, goToNextYear,
    };
})