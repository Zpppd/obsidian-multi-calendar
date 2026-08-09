import { defineComponent, inject } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";
import { getQuarterLabel } from "../../util/quarterUtil";

// 日期导航器：◀ 年 ▶ | [今] | ◀ 月 ▶
// 双击年份打开年记，双击季度打开季记，双击月份打开月记
export default defineComponent({
    name: "DateNavigator",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        function openYearlyNote() {
            if (plugin) {
                plugin.noteService.openOrCreate(
                    DateTime.local(viewStore.selectedDate.year, 1, 1),
                    NoteType.YEARLY
                );
            }
        }

        function openQuarterlyNote() {
            if (plugin) {
                const dt = viewStore.selectedDate;
                const quarter = Math.ceil(dt.month / 3);
                const month = (quarter - 1) * 3 + 1; // 1→1月, 2→4月, 3→7月, 4→10月
                plugin.noteService.openOrCreate(
                    DateTime.local(dt.year, month, 1),
                    NoteType.QUARTERLY
                );
            }
        }

        function openMonthlyNote() {
            if (plugin) {
                plugin.noteService.openOrCreate(
                    DateTime.local(viewStore.selectedDate.year, viewStore.selectedDate.month, 1),
                    NoteType.MONTHLY
                );
            }
        }

        return () => {
            // 读取 flushCounter 让本组件对设置刷新响应（设置改动 → forceFlush → flushCounter++）
            void viewStore.flushCounter;
            const dt = viewStore.selectedDate;
            const quarter = Math.ceil(dt.month / 3);
            const quarterLabel = plugin ? getQuarterLabel(plugin, quarter) : `${quarter}季度`;
            return (
                <div class="mc-date-navigator">
                    <div class="mc-header-row">
                        <span class="mc-header-btn" onClick={() => viewStore.goToPrevYear()}>{"<"}</span>
                        <span class="mc-header-nav-label" onDblclick={openYearlyNote}>{dt.year}年</span>
                        <span class="mc-header-btn" onClick={() => viewStore.goToNextYear()}>{">"}</span>
                    </div>
                    <span class="mc-header-btn" onClick={() => viewStore.goToToday()}>今</span>
                    <div class="mc-header-row">
                        <span class="mc-header-btn" onClick={() => viewStore.goToPrevMonth()}>{"<"}</span>
                        <span class="mc-header-nav-label" onDblclick={openMonthlyNote}>{dt.month}月</span>
                        <span class="mc-header-btn" onClick={() => viewStore.goToNextMonth()}>{">"}</span>
                        <span class="mc-header-btn" onClick={() => viewStore.toggleViewMode()}>
                            {viewStore.viewMode === "month" ? "年" : "月"}
                        </span>
                    </div>
                    <div class="mc-header-row mc-header-quarter-row">
                        <span class="mc-header-nav-label mc-header-quarter" onDblclick={openQuarterlyNote}>
                            {quarterLabel}
                        </span>
                    </div>
                </div>
            );
        };
    },
});
