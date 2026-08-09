import { defineComponent, inject } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";

// 日期导航器：‹ 2026年8月 › + [今] + [月|年]
// 双击标题打开月记
export default defineComponent({
    name: "DateNavigator",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        function openMonthlyNote() {
            if (plugin) {
                plugin.noteService.openOrCreate(
                    DateTime.local(viewStore.selectedDate.year, viewStore.selectedDate.month, 1),
                    NoteType.MONTHLY
                );
            }
        }

        return () => {
            // 读取 flushCounter 让本组件对设置刷新响应
            void viewStore.flushCounter;
            const dt = viewStore.selectedDate;
            const isMonth = viewStore.viewMode === "month";

            return (
                <div class="mc-header-bottom">
                    <div class="mc-header-center">
                        <span class="mc-chev" onClick={() => viewStore.goToPrevMonth()}>‹</span>
                        <span class="mc-header-title" onDblclick={openMonthlyNote}>
                            {dt.year} 年 {dt.month} 月
                        </span>
                        <span class="mc-chev" onClick={() => viewStore.goToNextMonth()}>›</span>
                    </div>
                    <div class="mc-header-right">
                        <span class="mc-header-btn mc-header-today" onClick={() => viewStore.goToToday()}>今</span>
                        <span class="mc-seg">
                            <span
                                class={"mc-seg-item" + (isMonth ? " on" : "")}
                                onClick={() => viewStore.setViewMode("month")}
                            >
                                月
                            </span>
                            <span
                                class={"mc-seg-item" + (!isMonth ? " on" : "")}
                                onClick={() => viewStore.setViewMode("year")}
                            >
                                年
                            </span>
                        </span>
                    </div>
                </div>
            );
        };
    },
});
