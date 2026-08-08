import { defineComponent, inject } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";
import DayCell from "./DayCell";
import WeekIndexCell from "./WeekIndexCell";

// 月视图：CSS Grid，周序号列 + 7 列日期，最多 6 行
export default defineComponent({
    name: "MonthView",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        return () => {
            const dt = viewStore.selectedDate;
            const today = DateTime.now();
            const firstDay = DateTime.local(dt.year, dt.month, 1);
            const startWeekday = firstDay.weekday;
            const gridStart = firstDay.minus({ days: startWeekday - 1 });

            // 生成 42 个日期格子的数据
            const days: Array<{ day: number; date: DateTime; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; hasNote: boolean }> = [];
            for (let i = 0; i < 42; i++) {
                const date = gridStart.plus({ days: i });
                days.push({
                    day: date.day,
                    date: date,
                    isCurrentMonth: date.month === dt.month && date.year === dt.year,
                    isToday: date.hasSame(today, "day"),
                    isSelected: date.hasSame(viewStore.selectedDate, "day"),
                    hasNote: plugin?.noteService.hasNote(date, NoteType.DAILY) ?? false,
                });
            }

            const weekLabels = ["周", "一", "二", "三", "四", "五", "六", "日"];

            return (
                <div class="mc-month-grid">
                    {/* 表头行 */}
                    {weekLabels.map(label => (
                        <div class="mc-weekday-label" key={label}>{label}</div>
                    ))}

                    {/* 数据行：6 周，每周 7 天 */}
                    {Array.from({ length: 6 }, (_, week) => (
                        <>
                            {/* 周序号：单击选中周，双击开周记 */}
                            <WeekIndexCell
                                weekNumber={days[week * 7].date.weekNumber}
                                monday={days[week * 7].date}
                            />
                            {Array.from({ length: 7 }, (_, day) => {
                                const d = days[week * 7 + day];
                                return (
                                    <DayCell
                                        date={d.date}
                                        day={d.day}
                                        isCurrentMonth={d.isCurrentMonth}
                                        isToday={d.isToday}
                                        isSelected={d.isSelected}
                                        hasNote={d.hasNote}
                                        onSelect={(date) => viewStore.selectDate(date)}
                                        onOpen={(date) => {
                                            if (plugin) {
                                                plugin.noteService.openOrCreate(date, NoteType.DAILY);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </>
                    ))}
                </div>
            );
        };
    },
});
