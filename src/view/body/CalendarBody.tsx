import { defineComponent } from "vue";
import { useViewStore } from "../../stores/viewStore";
import MonthView from "./MonthView";

// 日历主体：按 viewMode 条件渲染 MonthView / YearView（YearView 待 P3 实现）
export default defineComponent({
    name: "CalendarBody",
    setup() {
        const viewStore = useViewStore();

        return () => {
            if (viewStore.viewMode === "month") {
                return <MonthView />;
            }
            // YearView 尚未实现，先占位
            return <div class="mc-placeholder">年视图开发中</div>;
        };
    },
});
