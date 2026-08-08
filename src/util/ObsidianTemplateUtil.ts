import { TFile } from "obsidian";
import type MultiCalendarPlugin from "../main";
import { TemplateUtil } from "./TemplateUtil";

// Obsidian 核心模板插件适配：调用插件自己的 insertTemplate 执行模板（会替换 {{date}} 等变量）
export class ObsidianTemplateUtil extends TemplateUtil {
    private folder: string;

    constructor(plugin: MultiCalendarPlugin) {
        super(plugin);
        // 读取核心模板插件的"模板文件夹"配置
        // （internalPlugins 不在 App 的类型定义里，运行时存在，故用断言访问）
        const internalPlugins = (plugin.app as unknown as { internalPlugins: { getPluginById(id: string): { instance?: { options?: { folder?: string } } } } }).internalPlugins;
        const templatesPlugin = internalPlugins.getPluginById("templates");
        this.folder = templatesPlugin?.instance?.options?.folder ?? "";
    }

    resolveTemplatePath(templateName: string): string {
        return this.folder ? `${this.folder}/${templateName}` : templateName;
    }

    // 调用核心模板插件的 insertTemplate，让插件执行变量替换并插入当前活动笔记
    async insertTemplateIntoActiveNote(templateFile: TFile): Promise<void> {
        const internalPlugins = (this.plugin.app as unknown as {
            internalPlugins: { plugins: { templates: { instance: { insertTemplate(file: TFile): void } } } };
        }).internalPlugins;
        internalPlugins.plugins.templates.instance.insertTemplate(templateFile);
    }
}
