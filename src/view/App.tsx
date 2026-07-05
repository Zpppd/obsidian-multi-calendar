import { defineComponent, ref } from "vue";
import { DateTime } from "luxon";

export default defineComponent({
    name: "App",
    setup() {
        // 当前显示的日期（响应式，导航用）
        const displayDate = ref(DateTime.now());
        function goToPrevYear() {
            displayDate.value = displayDate.value.minus({ years: 1 });
        }
        function goToNextYear() {
            displayDate.value = displayDate.value.plus({ years: 1 });
        }
        function goToPrevMonth() {
            displayDate.value = displayDate.value.minus({ months: 1 });
        }
        function goToNextMonth() {
            displayDate.value = displayDate.value.plus({ months: 1 });
        }
        function goToToday() {
            displayDate.value = DateTime.now();
        }
        function goToPrevCalendar() {
        }
        function goToNextCalendar() {
        }
        function toggleCalendarMenu() {
        }

        return () => {
            const dt = displayDate.value;
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

            return (
                <div class="mc-container">
                    <div class="mc-header">
                        <div class="mc-header-col">
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={goToPrevCalendar}>{"<"}</span>
                                <span class="mc-header-calendar-name" onClick={toggleCalendarMenu}>默认日历</span>
                                <span class="mc-header-btn" onClick={goToNextCalendar}>{">"}</span>
                            </div>
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={goToPrevYear}>{"<"}</span>
                                <span class="mc-header-nav-label">{dt.year}年</span>
                                <span class="mc-header-btn" onClick={goToNextYear}>{">"}</span>
                            </div>
                        </div>
                        <div class="mc-header-col">
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={goToToday}>今</span>
                            </div>
                            <div class="mc-header-row">
                                <span class="mc-header-btn" onClick={goToPrevMonth}>{"<"}</span>
                                <span class="mc-header-nav-label">{dt.month}月</span>
                                <span class="mc-header-btn" onClick={goToNextMonth}>{">"}</span>
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
                                    const cls = ["mc-day-cell", !d.isCurrentMonth && "mc-day-cell--other-month", d.isToday && "mc-day-cell--today"].filter(Boolean).join(" ");
                                    return <div class={cls}>{d.day}</div>;
                                })}
                            </>
                        ))}
                    </div>
                </div>
            )
        }
    }
});