import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import { DateTime } from "luxon";
import { createApp, App as VueApp } from "vue";
import App from "./view/App";
import { Database } from "./core/Database";
import { createPinia } from "pinia";
import { CalendarManager } from "./core/CalendarManager";
import { NoteService } from "./core/NoteService";
import { TemplateService } from "./core/TemplateService";
import { FlushScheduler } from "./core/FlushScheduler";
import { useCalendarStore } from "./stores/calendarStore";
import { useViewStore } from "./stores/viewStore";
import { MainSettingTab } from "./view/setting/MainSettingTab";

// 视图类型 ID，registerView 和 setViewState 靠这个字符串对应
const VIEW_TYPE = "multi-calendar-view";

// 自定义面板：继承 ItemView，在 Obsidian 右侧栏显示一个内容区域
class CalendarView extends ItemView {
    private vueApp: VueApp | null = null;
    private plugin: MultiCalendarPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: MultiCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;
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
        const pinia = createPinia();

        // 初始化 store：显式传入 pinia 实例，Pinia 才能找到它
        const calendarStore = useCalendarStore(pinia);
        calendarStore.init(this.plugin.calendarManager);
        const viewStore = useViewStore(pinia);

        // FlushScheduler 触发视图刷新（笔记增删改后防抖刷新）
        this.plugin.flushScheduler.onFlush(() => viewStore.triggerFlush());

        // 设置面板修改数据后，通过 plugin 刷新此视图的 store
        this.plugin.onViewRefresh(() => {
            calendarStore.refresh();
        });

        this.vueApp = createApp(App);
        this.vueApp.use(pinia);
        // 将插件实例传给 Vue 组件，方便在组件中调用插件方法
        this.vueApp.provide("plugin", this.plugin);
        this.vueApp.mount(this.contentEl);
    }

    // 面板被关闭时触发
    async onClose(): Promise<void> {
        this.vueApp?.unmount();
    }

}

// 插件入口类，Obsidian 加载插件时 new 一个实例，然后调 onload()
export default class MultiCalendarPlugin extends Plugin {
    database!: Database;
    calendarManager!: CalendarManager;
    noteService!: NoteService;
    templateService!: TemplateService;
    flushScheduler!: FlushScheduler;

    // 视图刷新回调：设置面板修改数据后，通知所有打开的日历视图刷新 store
    private refreshCallbacks: Set<() => void> = new Set();

    // 注册视图刷新回调（CalendarView 打开时调用）
    onViewRefresh(callback: () => void): void {
        this.refreshCallbacks.add(callback);
    }

    // 触发所有视图刷新（设置面板修改数据后调用）
    notifyViewRefresh(): void {
        for (const cb of this.refreshCallbacks) {
            cb();
        }
        // 同时强制刷新（通知 Vue 组件重新读取设置，如统计点颜色/字数）
        this.flushScheduler.forceFlush();
    }

    async onload(): Promise<void> {
        this.database = new Database(this);
        await this.database.init();
        this.calendarManager = new CalendarManager(this.database);
        this.noteService = new NoteService(this);
        this.templateService = new TemplateService(this);
        this.flushScheduler = new FlushScheduler(this);
        // 注册设置面板
        this.addSettingTab(new MainSettingTab(this.app, this));
        // 注册视图类型：告诉 Obsidian 这个 type 对应哪个视图类
        this.registerView(VIEW_TYPE, (leaf) => new CalendarView(leaf, this));

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

    async onunload(): Promise<void> {
        this.flushScheduler.dispose();
    }
}
