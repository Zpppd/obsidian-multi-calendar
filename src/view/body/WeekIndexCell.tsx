import { defineComponent, inject, type PropType } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";

// 周序号格子：单击选中该周，双击打开/创建周记
export default defineComponent({
    name: "WeekIndexCell",
    props: {
        weekNumber: { type: Number, required: true },
        monday: { type: Object as PropType<DateTime>, required: true },
    },
    setup(props) {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        // 单击选中该周（选中周的周一）
        function handleSelect() {
            viewStore.selectDate(props.monday);
        }

        // 双击打开/创建周记
        function handleOpen() {
            if (plugin) {
                plugin.noteService.openOrCreate(props.monday, NoteType.WEEKLY);
            }
        }

        return () => (
            <div
                class="mc-week-index"
                onClick={handleSelect}
                onDblclick={handleOpen}
            >
                {props.weekNumber}
            </div>
        );
    },
});
