import { defineComponent } from "vue";
import { DateTime } from "luxon";
import { useViewStore } from "../../stores/viewStore";
import MonthCard from "./MonthCard";

// 年视图：12 个缩略月卡片
export default defineComponent({
    name: "YearView",
    setup() {
        const viewStore = useViewStore();

        return () => {
            const year = viewStore.selectedDate.year;
            const months = Array.from({ length: 12 }, (_, i) =>
                DateTime.local(year, i + 1, 1)
            );

            return (
                <div class="mc-year-view">
                    {months.map((month, i) => (
                        <MonthCard month={month} key={i} />
                    ))}
                </div>
            );
        };
    },
});
