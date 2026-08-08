import { defineComponent } from "vue";
import CalendarSwitcher from "./header/CalendarSwitcher";
import DateNavigator from "./header/DateNavigator";
import CalendarBody from "./body/CalendarBody";

// Vue 根组件：CalendarSwitcher + DateNavigator + CalendarBody
export default defineComponent({
    name: "App",
    setup() {
        return () => {
            return (
                <div class="mc-container">
                    <div class="mc-header">
                        <CalendarSwitcher />
                        <DateNavigator />
                    </div>
                    <CalendarBody />
                </div>
            );
        };
    },
});
