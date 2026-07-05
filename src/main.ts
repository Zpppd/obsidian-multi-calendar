import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import { DateTime } from "luxon";
import { createApp, App as VueApp } from "vue";
import App from "./view/App";


// 视图类型 ID，registerView 和 setViewState 靠这个字符串对应
const VIEW_TYPE = "multi-calendar-view";

// 自定义面板：继承 ItemView，在 Obsidian 右侧栏显示一个内容区域
class CalendarView extends ItemView {
    private vueApp: VueApp | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    // 返回视图类型 ID，Obsidian 用它匹配已注册的视图
    getViewType(): string {
        return VIEW_TYPE;
    }

    // 面板标签上显示的文字
    getDisplayText(): string {
        return "多日历";
    }

    // 面板标签上的图标（Lucide 图标名，Obsidian 内置）
    getIcon(): string {
        return "calendar-days";
    }

    // 面板被打开时触发，在这里渲染内容
    async onOpen(): Promise<void> {
        this.vueApp = createApp(App);
        this.vueApp.mount(this.contentEl);
    }

    // 面板被关闭时触发
    async onClose(): Promise<void> {
        this.vueApp?.unmount();
    }
}

// 插件入口类，Obsidian 加载插件时 new 一个实例，然后调 onload()
export default class MultiCalendarPlugin extends Plugin {
    async onload(): Promise<void> {
        // 注册视图类型：告诉 Obsidian 这个 type 对应哪个视图类
        this.registerView(VIEW_TYPE, (leaf) => new CalendarView(leaf));

        this.app.workspace.onLayoutReady(async () => {
            const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
            if (existing.length > 0) {
                // 已有视图，复用
                return;
            }
            // 拿到右侧面板的一个槽位，把视图塞进去
            const leaf = this.app.workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE, active: false });
                this.app.workspace.revealLeaf(leaf);
            }
        })
    }

    async onunload(): Promise<void> { }
}
