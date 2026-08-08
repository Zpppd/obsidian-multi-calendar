import type { PluginSettings } from "@/entity/PluginSettings";
import {createDefaultProfile} from "@/entity/CalendarProfile";

interface DataAdapter{
    loadData(): Promise<PluginSettings | null>;
    saveData(data: PluginSettings): Promise<void>;
}

// 数据持久化
export class Database{
    private adapter: DataAdapter;
    private settings: PluginSettings | null = null;

    constructor(adapter: DataAdapter){
        this.adapter = adapter;
    }

    // 初始化加载已有数据，或创建默认配置
    async init(): Promise<void>{
        const existing = await this.adapter.loadData();
        if(existing){
            this.settings = existing;
        }else{
            const defaultProfile = createDefaultProfile();
            this.settings = {
                version: "1.0.0",
                calendars: [defaultProfile],
                activeCalendarId: defaultProfile.id,
                shouldConfirmBeforeCreate: false,
                templatePlugin: "obsidian",
                dotColor: "#4A90D9",
                wordsPerDot: 100,
                dotUpperLimit: 3
            };
            await this.adapter.saveData(this.settings);
        }
    }

    // 获取当前设置
    getSettings(): PluginSettings {
        if(!this.settings){
            throw new Error("Database 尚未初始化，请先调用init()方法");
        }
        return this.settings;
    }

    // 保存当前设置
    async saveSettings(settings: PluginSettings): Promise<void>{
        this.settings = settings;
        await this.adapter.saveData(settings);
    }
}