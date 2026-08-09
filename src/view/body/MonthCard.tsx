import { defineComponent, inject, type PropType } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";

// 年视图中的月份卡片：仅显示月份名（精简版，不含日期格子）
export default defineComponent({
    name: "MonthCard",
    props: {
        month: { type: Object as PropType<DateTime>, required: true },
    },
    setup(props) {
        const plugin = inject<MultiCalendarPlugin>("plugin");
        const viewStore = useViewStore();

        // 单击 → 跳转到该月月视图
        function jumpToMonth() {
            viewStore.selectDate(props.month);
            viewStore.setViewMode("month");
        }

        // 双击 → 打开/创建月记
        function openMonthlyNote() {
            if (plugin) {
                plugin.noteService.openOrCreate(props.month, NoteType.MONTHLY);
            }
        }

        return () => (
            <div
                class="mc-month-card"
                onClick={jumpToMonth}
                onDblclick={openMonthlyNote}
            >
                <div class="mc-month-card-title">{props.month.month}月</div>
            </div>
        );
    },
});
