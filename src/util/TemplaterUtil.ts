import { TFile, normalizePath } from "obsidian";
import type MultiCalendarPlugin from "../main";
import { TemplateUtil } from "./TemplateUtil";

// Templater 社区插件适配：模板文件放在 Templater 的"模板文件夹"配置里
export class TemplaterUtil extends TemplateUtil {
    constructor(plugin: MultiCalendarPlugin) {
        super(plugin);
    }

    findTemplateFile(templateName: string): TFile | null {
        // 读取 Templater 插件的 templates_folder 配置
        // （plugins 不在 App 的类型定义里，运行时存在，故用断言访问）
        const plugins = (this.plugin.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins.plugins;
        const templater = plugins["templater-obsidian"];
        const folder = (templater as { settings?: { templates_folder?: string } } | undefined)?.settings?.templates_folder ?? "";
        const path = normalizePath(folder ? `${folder}/${templateName}` : templateName);
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        return file instanceof TFile ? file : null;
    }
}
