import { defineComponent } from "vue";
import { useCalendarStore } from "../../stores/calendarStore";

// 日历切换器：◀ 名称 ▶ [+新增]
// 直接读 calendarStore，不需要 props
export default defineComponent({
    name: "CalendarSwitcher",
    setup() {
        const calendarStore = useCalendarStore();

        // 新增日历：弹输入框，输入名称后创建
        function handleAdd() {
            const name = window.prompt("输入新日历名称");
            if (name?.trim()) {
                calendarStore.addProfile(name.trim());
            }
        }

        return () => {
            const name = calendarStore.activeProfile?.name ?? "";
            return (
                <div class="mc-calendar-switcher">
                    <span class="mc-header-btn" onClick={() => calendarStore.switchToPrev()}>{"<"}</span>
                    <span class="mc-header-calendar-name">{name}</span>
                    <span class="mc-header-btn" onClick={() => calendarStore.switchToNext()}>{">"}</span>
                    <span class="mc-header-btn mc-header-btn--add" onClick={handleAdd}>+</span>
                </div>
            );
        };
    },
});
