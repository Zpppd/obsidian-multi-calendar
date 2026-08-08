import { defineComponent, inject, type PropType } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";

// 年视图中的缩略月卡片：月份名 + 该月小日历
export default defineComponent({
    name: "MonthCard",
    props: {
        month: { type: Object as PropType<DateTime>, required: true },
    },
    setup(props) {
        const plugin = inject<MultiCalendarPlugin>("plugin");
        const viewStore = useViewStore();

        // 双击月份名 → 打开/创建月记
        function openMonthlyNote() {
            if (plugin) {
                plugin.noteService.openOrCreate(props.month, NoteType.MONTHLY);
            }
        }

        // 单击某天 → 跳转到该月月视图并选中
        function jumpToDay(date: DateTime) {
            viewStore.selectDate(date);
            viewStore.toggleViewMode(); // 切回月视图
        }

        return () => {
            const dt = props.month;
            const today = DateTime.now();
            const firstDay = DateTime.local(dt.year, dt.month, 1);
            const startWeekday = firstDay.weekday;
            const gridStart = firstDay.minus({ days: startWeekday - 1 });
            const daysInMonth = firstDay.daysInMonth ?? 30;
            const totalCells = Math.ceil((startWeekday - 1 + daysInMonth) / 7) * 7;

            // 生成该月小日历的所有格子
            const days: Array<{ day: number; date: DateTime; isCurrentMonth: boolean; isToday: boolean }> = [];
            for (let i = 0; i < totalCells; i++) {
                const date = gridStart.plus({ days: i });
                days.push({
                    day: date.day,
                    date: date,
                    isCurrentMonth: date.month === dt.month,
                    isToday: date.hasSame(today, "day"),
                });
            }

            const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

            return (
                <div class="mc-month-card">
                    <div class="mc-month-card-title" onDblclick={openMonthlyNote}>
                        {dt.month}月
                    </div>
                    <div class="mc-month-card-grid">
                        {weekLabels.map(label => (
                            <div class="mc-month-card-weekday" key={label}>{label}</div>
                        ))}
                        {days.map((d, i) => {
                            const cls = [
                                "mc-month-card-day",
                                !d.isCurrentMonth && "mc-month-card-day--other",
                                d.isToday && "mc-month-card-day--today",
                            ].filter(Boolean).join(" ");
                            return (
                                <div
                                    class={cls}
                                    key={i}
                                    onClick={() => d.isCurrentMonth && jumpToDay(d.date)}
                                >
                                    {d.day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };
    },
});
