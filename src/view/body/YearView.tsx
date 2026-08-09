import { defineComponent, inject } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";
import MonthCard from "./MonthCard";

// 年视图：年份标题 + 12 个缩略月卡片（主要用于切换月份/年份）
export default defineComponent({
    name: "YearView",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        // 双击年份 → 打开/创建该年的年记
        function openYearlyNote() {
            if (!plugin) return;
            const year = viewStore.selectedDate.year;
            plugin.noteService.openOrCreate(DateTime.local(year, 1, 1), NoteType.YEARLY);
        }

        return () => {
            const year = viewStore.selectedDate.year;
            const months = Array.from({ length: 12 }, (_, i) =>
                DateTime.local(year, i + 1, 1)
            );

            return (
                <div class="mc-year-view">
                    <div class="mc-year-title">
                        <span class="mc-chev" onClick={() => viewStore.goToPrevYear()}>‹</span>
                        <span onDblclick={openYearlyNote}>{year}年</span>
                        <span class="mc-chev" onClick={() => viewStore.goToNextYear()}>›</span>
                    </div>
                    {months.map((month, i) => (
                        <MonthCard month={month} key={i} />
                    ))}
                </div>
            );
        };
    },
});
