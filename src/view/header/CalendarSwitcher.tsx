import { defineComponent } from "vue";
import { useCalendarStore } from "../../stores/calendarStore";

// 日历切换器：◀ 名称 ▶
// 直接读 calendarStore，不需要 props；新增/管理日历请到设置面板
export default defineComponent({
    name: "CalendarSwitcher",
    setup() {
        const calendarStore = useCalendarStore();

        return () => {
            const name = calendarStore.activeProfile?.name ?? "";
            return (
                <div class="mc-calendar-switcher">
                    <span class="mc-header-btn" onClick={() => calendarStore.switchToPrev()}>{"<"}</span>
                    <span class="mc-header-calendar-name">{name}</span>
                    <span class="mc-header-btn" onClick={() => calendarStore.switchToNext()}>{">"}</span>
                </div>
            );
        };
    },
});
