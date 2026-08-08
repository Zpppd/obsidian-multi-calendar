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
        hasNote: {
            type: Boolean,
            default: false
        }
    },
    emits: ["select", "open"],
    setup(props, { emit }) {
        return () => {
            const cls = [
                "mc-day-cell",
                !props.isCurrentMonth && "mc-day-cell--other-month",
                props.isToday && "mc-day-cell--today",
                props.isSelected && "mc-day-cell--selected",
            ].filter(Boolean).join(" ");

            return (
                <div
                    class={cls}
                    onClick={() => emit("select", props.date)}
                    onDblclick={() => emit("open", props.date)}
                >
                    <span class="mc-day-cell-number">{props.day}</span>
                    {props.hasNote && <span class="mc-day-cell-dot" />}
                </div>
            )
        }
    }
})
