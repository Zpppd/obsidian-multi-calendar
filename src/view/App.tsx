import { defineComponent } from "vue";
import CalendarSwitcher from "./header/CalendarSwitcher";
import DateNavigator from "./header/DateNavigator";
import SeasonQuarterBar from "./header/SeasonQuarterBar";
import CalendarBody from "./body/CalendarBody";

// Vue 根组件：Header（上行日历胶囊+季度条，下行翻月标题+今/视图）+ CalendarBody
export default defineComponent({
    name: "App",
    setup() {
        return () => {
            return (
                <div class="mc-container">
                    <div class="mc-header">
                        <div class="mc-header-row">
                            <CalendarSwitcher />
                            <SeasonQuarterBar />
                        </div>
                        <DateNavigator />
                    </div>
                    <CalendarBody />
                </div>
            );
        };
    },
});
