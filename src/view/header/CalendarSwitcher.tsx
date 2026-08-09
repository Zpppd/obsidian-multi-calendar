import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import { useCalendarStore } from "../../stores/calendarStore";

// 日历切换胶囊：● 名称 ▾，点击弹出下拉菜单切换日历
// 新增/管理日历请到设置面板
export default defineComponent({
    name: "CalendarSwitcher",
    setup() {
        const calendarStore = useCalendarStore();
        const dropdownOpen = ref(false);

        function toggleDropdown() {
            dropdownOpen.value = !dropdownOpen.value;
        }

        // 点击外部关闭下拉
        function onGlobalClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (!target.closest(".mc-cal-switcher")) {
                dropdownOpen.value = false;
            }
        }

        onMounted(() => document.addEventListener("click", onGlobalClick));
        onUnmounted(() => document.removeEventListener("click", onGlobalClick));

        return () => {
            const active = calendarStore.activeProfile;
            const activeColor = active?.color ?? "#4A90D9";

            return (
                <div class="mc-cal-switcher" onClick={toggleDropdown}>
                    <span class="mc-cal-dot" style={{ background: activeColor }} />
                    <span class="mc-cal-name">{active?.name ?? ""}</span>
                    <span class="mc-cal-caret">▾</span>
                    {dropdownOpen.value && (
                        <div class="mc-cal-menu">
                            {calendarStore.profiles.map(p => (
                                <div
                                    class={p.id === active?.id ? "mc-cal-menu-item on" : "mc-cal-menu-item"}
                                    key={p.id}
                                    onClick={() => calendarStore.switchTo(p.id)}
                                >
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };
    },
});
