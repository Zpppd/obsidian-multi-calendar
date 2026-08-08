import { TFile, normalizePath } from "obsidian";
import type MultiCalendarPlugin from "../main";
import { TemplateUtil } from "./TemplateUtil";

// Obsidian 核心模板插件适配：模板文件放在核心模板插件的"模板文件夹"配置里
export class ObsidianTemplateUtil extends TemplateUtil {
    constructor(plugin: MultiCalendarPlugin) {
        super(plugin);
    }

    findTemplateFile(templateName: string): TFile | null {
        // 读取核心模板插件的"模板文件夹"配置
        // （internalPlugins 不在 App 的类型定义里，运行时存在，故用断言访问）
        const internalPlugins = (this.plugin.app as unknown as { internalPlugins: { getPluginById(id: string): { instance?: { options?: { folder?: string } } } } }).internalPlugins;
        const templatesPlugin = internalPlugins.getPluginById("templates");
        const folder = templatesPlugin?.instance?.options?.folder ?? "";
        const path = normalizePath(folder ? `${folder}/${templateName}` : templateName);
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        return file instanceof TFile ? file : null;
    }
}
