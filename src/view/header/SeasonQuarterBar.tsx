import { defineComponent, inject } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";
import { getQuarterLabel } from "../../util/quarterUtil";

// 季度条：‹ 秋季 ›，左右箭头切换季度，双击标签开季记
export default defineComponent({
    name: "SeasonQuarterBar",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        function openQuarterlyNote() {
            if (!plugin) return;
            const dt = viewStore.selectedDate;
            const quarter = Math.ceil(dt.month / 3);
            const month = (quarter - 1) * 3 + 1; // 1→1月, 2→4月, 3→7月, 4→10月
            plugin.noteService.openOrCreate(
                DateTime.local(dt.year, month, 1),
                NoteType.QUARTERLY
            );
        }

        return () => {
            // 读取 flushCounter 让本组件对设置刷新响应（季度命名改动）
            void viewStore.flushCounter;
            const dt = viewStore.selectedDate;
            const quarter = Math.ceil(dt.month / 3);
            const label = plugin ? getQuarterLabel(plugin, quarter) : `第${quarter}季度`;

            return (
                <div class="mc-season-bar">
                    <span class="mc-chev" onClick={() => viewStore.goToPrevQuarter()}>‹</span>
                    <span class="mc-season-label" onDblclick={openQuarterlyNote}>{label}</span>
                    <span class="mc-chev" onClick={() => viewStore.goToNextQuarter()}>›</span>
                </div>
            );
        };
    },
});
