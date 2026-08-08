import { TFile } from "obsidian";
import type MultiCalendarPlugin from "../main";
import { TemplateUtil } from "./TemplateUtil";

// 无模板插件：直接在库根目录下查找模板文件
export class NoneTemplateUtil extends TemplateUtil {
    constructor(plugin: MultiCalendarPlugin) {
        super(plugin);
    }

    findTemplateFile(templateName: string): TFile | null {
        const file = this.plugin.app.vault.getAbstractFileByPath(templateName);
        return file instanceof TFile ? file : null;
    }
}
