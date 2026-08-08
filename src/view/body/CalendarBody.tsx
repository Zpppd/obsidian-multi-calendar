import { defineComponent } from "vue";
import { useViewStore } from "../../stores/viewStore";
import MonthView from "./MonthView";
import YearView from "./YearView";

// 日历主体：按 viewMode 条件渲染 MonthView / YearView
export default defineComponent({
    name: "CalendarBody",
    setup() {
        const viewStore = useViewStore();

        return () => {
            if (viewStore.viewMode === "month") {
                return <MonthView />;
            }
            return <YearView />;
        };
    },
});
