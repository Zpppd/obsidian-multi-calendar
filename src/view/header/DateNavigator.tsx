import { defineComponent } from "vue";
import { useViewStore } from "../../stores/viewStore";

// 日期导航器：◀ 年 ▶ | [今] | ◀ 月 ▶
export default defineComponent({
    name: "DateNavigator",
    setup() {
        const viewStore = useViewStore();

        return () => {
            const dt = viewStore.selectedDate;
            return (
                <div class="mc-date-navigator">
                    <div class="mc-header-row">
                        <span class="mc-header-btn" onClick={() => viewStore.goToPrevYear()}>{"<"}</span>
                        <span class="mc-header-nav-label">{dt.year}年</span>
                        <span class="mc-header-btn" onClick={() => viewStore.goToNextYear()}>{">"}</span>
                    </div>
                    <span class="mc-header-btn" onClick={() => viewStore.goToToday()}>今</span>
                    <div class="mc-header-row">
                        <span class="mc-header-btn" onClick={() => viewStore.goToPrevMonth()}>{"<"}</span>
                        <span class="mc-header-nav-label">{dt.month}月</span>
                        <span class="mc-header-btn" onClick={() => viewStore.goToNextMonth()}>{">"}</span>
                        <span class="mc-header-btn" onClick={() => viewStore.toggleViewMode()}>
                            {viewStore.viewMode === "month" ? "年" : "月"}
                        </span>
                    </div>
                </div>
            );
        };
    },
});
