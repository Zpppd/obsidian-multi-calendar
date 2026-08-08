import { TFile } from "obsidian";
import type MultiCalendarPlugin from "../main";
import type { NoteType, TemplatePluginType } from "src/base/types";
import { TemplateUtil } from "../util/TemplateUtil";
import { NoneTemplateUtil } from "../util/NoneTemplateUtil";
import { ObsidianTemplateUtil } from "../util/ObsidianTemplateUtil";
import { TemplaterUtil } from "../util/TemplaterUtil";

// 模板服务：根据 templatePlugin 设置选择对应适配器，负责查找和插入模板
export class TemplateService {
    private plugin: MultiCalendarPlugin;
    private util: TemplateUtil;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
        const type = plugin.database.getSettings().templatePlugin;
        this.util = this.createUtil(type);
    }

    // 切换模板插件策略
    setPlugin(type: TemplatePluginType): void {
        this.util = this.createUtil(type);
    }

    private createUtil(type: TemplatePluginType): TemplateUtil {
        switch (type) {
            case "obsidian":
                return new ObsidianTemplateUtil(this.plugin);
            case "templater":
                return new TemplaterUtil(this.plugin);
            default:
                return new NoneTemplateUtil(this.plugin);
        }
    }

    // 获取当前日历档案中指定笔记类型的模板文件
    getTemplateFile(noteType: NoteType): TFile | null {
        const profile = this.plugin.calendarManager.getActiveProfile();
        const templateName = profile.notes[noteType].templateFile;
        if (!templateName) return null;
        return this.util.findTemplateFile(templateName);
    }

    // 将模板内容插入到指定笔记
    async insertTemplate(file: TFile, noteType: NoteType): Promise<void> {
        const templateFile = this.getTemplateFile(noteType);
        if (!templateFile) return;
        const content = await this.util.readTemplate(templateFile);
        await this.plugin.app.vault.modify(file, content);
    }
}
