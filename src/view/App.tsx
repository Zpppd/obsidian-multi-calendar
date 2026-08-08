import { defineComponent, ref } from "vue";
import { DateTime } from "luxon";
import { useCalendarStore } from "../stores/calendarStore";
import { useViewStore } from "../stores/viewStore";
import DayCell from "./body/DayCell";

export default defineComponent({
    name: "App",
    setup() {
        const calendarStore = useCalendarStore();
        const viewStore = useViewStore();

        return () => {
            const dt = viewStore.selectedDate;
            const today = DateTime.now();
            const firstDay = DateTime.local(dt.year, dt.month, 1);
            const startWeekday = firstDay.weekday;
            const gridStart = firstDay.minus({ days: startWeekday - 1 });

            // 生成42个日期格子的数据
            const days: Array<{ day: number; date: DateTime; isCurrentMonth: boolean; isToday: boolean }> = [];
            for (let i = 0; i < 42; i++) {
                const date = gridStart.plus({ days: i });
                days.push({
                    day: date.day,
                    date: date,
                    isCurrentMonth: date.month === dt.month && date.year === dt.year,
                    isToday: date.hasSame(today, 'day')
                });
            }

            const weekLabels = ['周', '一', '二', '三', '四', '五', '六', '日'];
            const calendarName = calendarStore.activeProfile?.name ?? '';

            return (
                <div class="mc-container">
                    <div class="mc-header">
                        <div class="mc-header-col">
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={() => calendarStore.switchToPrev()}>{"<"}</span>
                                <span class="mc-header-calendar-name">{calendarName}</span>
                                <span class="mc-header-btn" onClick={() => calendarStore.switchToNext()}>{">"}</span>
                            </div>
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={() => viewStore.goToPrevYear()}>{"<"}</span>
                                <span class="mc-header-nav-label">{dt.year}年</span>
                                <span class="mc-header-btn" onClick={() => viewStore.goToNextYear()}>{">"}</span>
                            </div>
                        </div>
                        <div class="mc-header-col">
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={() => viewStore.goToToday()}>今</span>
                            </div>
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={() => viewStore.goToPrevMonth()}>{"<"}</span>
                                <span class="mc-header-nav-label">{dt.month}月</span>
                                <span class="mc-header-btn" onClick={() => viewStore.goToNextMonth()}>{">"}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mc-month-grid">
                        {/* 表头行 */}
                        {weekLabels.map(label => (<div class="mc-weekday-label">{label}</div>))}

                        {/* 数据行：6 周，每周 7 天 */}
                        {Array.from({ length: 6 }, (_, week) => (
                            <>
                                {/* 周序号：该周第一个日期 */}
                                <div class="mc-week-index">{days[week * 7].date.weekNumber}</div>
                                {Array.from({ length: 7 }, (_, day) => {
                                    const d = days[week * 7 + day];
                                    return (
                                        <DayCell
                                            date={d.date}
                                            day={d.day}
                                            isCurrentMonth={d.isCurrentMonth}
                                            isToday={d.isToday}
                                            isSelected={false}
                                            onSelect={(date) => viewStore.selectDate(date)}
                                        />
                                    )
                                })}
                            </>
                        ))}
                    </div>
                </div>
            )
        }
    }
});