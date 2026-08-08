import { EventRef } from "obsidian";
import type MultiCalendarPlugin from "../main";

// 防抖刷新调度器：
// 监听 vault 笔记增删改事件，1 秒防抖后触发刷新回调（供 Vue 响应式系统消费）
export class FlushScheduler {
    private plugin: MultiCalendarPlugin;
    private timer: number | null = null;
    private readonly delay: number;
    private listeners: Set<() => void> = new Set();
    private eventRefs: EventRef[] = [];

    constructor(plugin: MultiCalendarPlugin, delay = 1000) {
        this.plugin = plugin;
        this.delay = delay;
        this.registerVaultEvents();
    }

    // 注册 vault 事件：笔记增删改都会触发刷新
    private registerVaultEvents(): void {
        const { app } = this.plugin;
        this.eventRefs.push(app.vault.on("create", () => this.requestFlush()));
        this.eventRefs.push(app.vault.on("delete", () => this.requestFlush()));
        this.eventRefs.push(app.vault.on("rename", () => this.requestFlush()));
        this.eventRefs.push(app.vault.on("modify", () => this.requestFlush()));
    }

    // 插件卸载时清理事件监听
    dispose(): void {
        for (const ref of this.eventRefs) {
            this.plugin.app.vault.offref(ref);
        }
        this.eventRefs = [];
        this.listeners.clear();
    }

    // 请求刷新（防抖）
    requestFlush(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
        }
        this.timer = window.setTimeout(() => {
            this.timer = null;
            this.flush();
        }, this.delay);
    }

    // 强制立即刷新
    forceFlush(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
        this.flush();
    }

    // 供 Vue 组件注册刷新回调
    onFlush(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private flush(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
