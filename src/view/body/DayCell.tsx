import { defineComponent, type PropType } from "vue";
import { DateTime } from "luxon";

export default defineComponent({
    name: "DayCell",
    props: {
        date: {
            type: Object as PropType<DateTime>,
            required: true
        },
        day: {
            type: Number,
            required: true,
        },
        isCurrentMonth: {
            type: Boolean,
            default: true,
        },
        isToday: {
            type: Boolean,
            default: false
        },
        isSelected: {
            type: Boolean,
            default: false
        },
        isInSelectedWeek: {
            type: Boolean,
            default: false
        },
        dotCount: {
            type: Number,
            default: 0
        },
        // 节假日标注
        isWorkday: {
            type: Boolean,
            default: false
        },
        isHoliday: {
            type: Boolean,
            default: false
        },
        holidayName: {
            type: String,
            default: ""
        },
        // 农历信息
        lunarMonth: {
            type: String,
            default: ""
        },
        lunarDay: {
            type: String,
            default: ""
        },
        lunarFestival: {
            type: String,
            default: ""
        },
    },
    emits: ["select", "open"],
    setup(props, { emit }) {
        return () => {
            const cls = [
                "mc-day-cell",
                !props.isCurrentMonth && "mc-day-cell--other-month",
                props.isToday && "mc-day-cell--today",
                props.isSelected && "mc-day-cell--selected",
                props.isInSelectedWeek && "mc-day-cell--week-selected",
            ].filter(Boolean).join(" ");

            // 优先显示节假日名，其次农历节日，最后农历日
            const footerText = props.holidayName
                || props.lunarFestival
                || (props.lunarMonth ? `${props.lunarMonth} ${props.lunarDay}` : props.lunarDay);

            return (
                <div
                    class={cls}
                    onClick={() => emit("select", props.date)}
                    onDblclick={() => emit("open", props.date)}
                >
                    {/* 右上角：调休班/法定假休 */}
                    {(props.isWorkday || props.isHoliday) && (
                        <span class={"mc-day-cell-workday" + (props.isHoliday ? " mc-day-cell-workday--holiday" : "")}>
                            {props.isHoliday ? "休" : "班"}
                        </span>
                    )}
                    <span class="mc-day-cell-number">{props.day}</span>
                    {props.dotCount > 0 && (
                        <span class="mc-day-cell-dots">
                            {Array.from({ length: props.dotCount }, (_, i) => (
                                <span class="mc-day-cell-dot" key={i} />
                            ))}
                        </span>
                    )}
                    {footerText && <span class="mc-day-cell-footer">{footerText}</span>}
                </div>
            )
        }
    }
})
