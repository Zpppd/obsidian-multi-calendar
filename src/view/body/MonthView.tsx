import { defineComponent, inject, ref, watch } from "vue";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import { useViewStore } from "../../stores/viewStore";
import DayCell from "./DayCell";
import WeekIndexCell from "./WeekIndexCell";
import { getLunarInfo } from "../../util/lunarUtil";

// 月视图：CSS Grid，周序号列 + 7 列日期，最多 6 行
export default defineComponent({
    name: "MonthView",
    setup() {
        const viewStore = useViewStore();
        const plugin = inject<MultiCalendarPlugin>("plugin");

        // 日期字符串 → 统计点数（异步加载，响应式）
        const dotMap = ref<Record<string, number>>({});
        // 日期字符串 → 节假日/农历信息（同步计算，响应式）
        const dayInfo = ref<Record<string, { isWorkday: boolean; isHoliday: boolean; holidayName: string; lunarMonth: string; lunarDay: string; lunarFestival: string; lunarJieqi: string }>>({});
        // 统计点颜色（从设置读取，响应式以便设置修改后刷新）
        const dotColor = ref(plugin?.database.getSettings().dotColor ?? "");

        // 生成 42 天日期数据
        function buildDays(dt: DateTime) {
            const today = DateTime.now();
            const firstDay = DateTime.local(dt.year, dt.month, 1);
            const startWeekday = firstDay.weekday;
            const gridStart = firstDay.minus({ days: startWeekday - 1 });

            const days: Array<{ day: number; date: DateTime; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isInSelectedWeek: boolean }> = [];
            for (let i = 0; i < 42; i++) {
                const date = gridStart.plus({ days: i });
                days.push({
                    day: date.day,
                    date: date,
                    isCurrentMonth: date.month === dt.month && date.year === dt.year,
                    isToday: date.hasSame(today, "day"),
                    isSelected: date.hasSame(viewStore.selectedDate, "day"),
                    // 仅当通过周序号选中时才整周高亮
                    isInSelectedWeek: viewStore.selectedByWeek && date.hasSame(viewStore.selectedDate, "week"),
                });
            }
            return days;
        }

        // 异步计算 42 天的统计点数
        async function loadDots(dt: DateTime) {
            if (!plugin) return;
            const days = buildDays(dt);
            const map: Record<string, number> = {};
            for (const d of days) {
                const key = d.date.toFormat("yyyy-MM-dd");
                const words = await plugin.noteService.countWords(d.date, NoteType.DAILY);
                if (words > 0) {
                    map[key] = plugin.noteService.getDotCount(words);
                }
            }
            dotMap.value = map;
        }

        // 同步计算 42 天的节假日/农历信息（按设置开关决定是否计算）
        function loadDayInfo(dt: DateTime) {
            if (!plugin) return;
            const settings = plugin.database.getSettings();
            const showLunar = settings.shouldDisplayLunarInfo ?? true;
            const showHoliday = settings.shouldDisplayHolidayInfo ?? true;

            if (!showLunar && !showHoliday) {
                dayInfo.value = {};
                return;
            }

            const days = buildDays(dt);
            const map: typeof dayInfo.value = {};
            for (const d of days) {
                const key = d.date.toFormat("yyyy-MM-dd");
                const y = d.date.year;
                const m = d.date.month;
                const day = d.date.day;
                const holiday = showHoliday ? plugin.holidayService.getHoliday(y, m, day) : null;
                const lunar = showLunar ? getLunarInfo(y, m, day) : null;
                map[key] = {
                    isWorkday: holiday?.isWorkday ?? false,
                    isHoliday: holiday?.isHoliday ?? false,
                    holidayName: holiday?.name ?? "",
                    lunarMonth: lunar?.monthText ?? "",
                    lunarDay: lunar?.dayText ?? "",
                    lunarFestival: lunar?.festival ?? "",
                    lunarJieqi: lunar?.jieqi ?? "",
                };
            }
            dayInfo.value = map;
        }

        // 日期变化或刷新信号时重新加载统计点和节假日/农历（设置改动会触发 forceFlush → flushCounter++）
        watch(
            () => viewStore.selectedDate.toFormat("yyyy-MM") + ":" + viewStore.flushCounter,
            () => {
                dotColor.value = plugin?.database.getSettings().dotColor ?? "";
                loadDayInfo(viewStore.selectedDate);
                loadDots(viewStore.selectedDate);
            },
            { immediate: true }
        );

        return () => {
            const dt = viewStore.selectedDate;
            const days = buildDays(dt);
            const weekLabels = ["周", "一", "二", "三", "四", "五", "六", "日"];

            return (
                <div
                    class="mc-month-grid"
                    style={dotColor.value ? { "--mc-dot-color": dotColor.value } : undefined}
                >
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
                                isSelected={viewStore.selectedByWeek && days[week * 7].date.hasSame(viewStore.selectedDate, "week")}
                            />
                            {Array.from({ length: 7 }, (_, day) => {
                                const d = days[week * 7 + day];
                                const key = d.date.toFormat("yyyy-MM-dd");
                                const info = dayInfo.value[key];
                                return (
                                    <DayCell
                                        date={d.date}
                                        day={d.day}
                                        isCurrentMonth={d.isCurrentMonth}
                                        isToday={d.isToday}
                                        isSelected={d.isSelected}
                                        isInSelectedWeek={d.isInSelectedWeek}
                                        dotCount={dotMap.value[key] ?? 0}
                                        isWorkday={info?.isWorkday ?? false}
                                        isHoliday={info?.isHoliday ?? false}
                                        holidayName={info?.holidayName ?? ""}
                                        lunarMonth={info?.lunarMonth ?? ""}
                                        lunarDay={info?.lunarDay ?? ""}
                                        lunarFestival={info?.lunarFestival ?? ""}
                                        lunarJieqi={info?.lunarJieqi ?? ""}
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
