import { TFile } from "obsidian";
import type MultiCalendarPlugin from "../main";
import { TemplateUtil } from "./TemplateUtil";

// Templater 社区插件适配：调用 Templater 的 append_template_to_active_file 执行模板（会解析 <% tp... %>）
export class TemplaterUtil extends TemplateUtil {
    private folder: string;

    constructor(plugin: MultiCalendarPlugin) {
        super(plugin);
        // 读取 Templater 插件的 templates_folder 配置
        // （plugins 不在 App 的类型定义里，运行时存在，故用断言访问）
        const plugins = (plugin.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins.plugins;
        const templater = plugins["templater-obsidian"];
        this.folder = (templater as { settings?: { templates_folder?: string } } | undefined)?.settings?.templates_folder ?? "";
    }

    resolveTemplatePath(templateName: string): string {
        return this.folder ? `${this.folder}/${templateName}` : templateName;
    }

    // 调用 Templater 的 append_template_to_active_file，让插件执行模板并追加到当前活动笔记
    async insertTemplateIntoActiveNote(templateFile: TFile): Promise<void> {
        const templaterPlugin = (this.plugin.app as unknown as {
            plugins: { plugins: { "templater-obsidian"?: { templater: { append_template_to_active_file(file: TFile): Promise<void> } } } };
        }).plugins.plugins["templater-obsidian"];
        if (templaterPlugin) {
            await templaterPlugin.templater.append_template_to_active_file(templateFile);
        }
    }
}
