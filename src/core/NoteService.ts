import { TFile, Modal, normalizePath } from "obsidian";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../main";
import type { NoteType } from "src/base/types";

// 创建笔记前的确认弹窗
class ConfirmModal extends Modal {
    private onConfirm: () => void;

    constructor(plugin: MultiCalendarPlugin, onConfirm: () => void) {
        super(plugin.app);
        this.onConfirm = onConfirm;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl("p", { text: "确定创建这条笔记吗？" });
        contentEl.createEl("button", { text: "创建" }).addEventListener("click", () => {
            this.onConfirm();
            this.close();
        });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

// 笔记服务：根据日历档案的路径规则，打开或创建笔记
export class NoteService {
    private plugin: MultiCalendarPlugin;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
    }

    // 获取笔记文件路径，未启用或未配置路径时返回 null
    getNotePath(date: DateTime, noteType: NoteType): string | null {
        const profile = this.plugin.calendarManager.getActiveProfile();
        const config = profile.notes[noteType];
        if (!config.enabled || !config.pathPattern) {
            return null;
        }
        const folderAndName = date.toFormat(config.pathPattern);
        return normalizePath(`${folderAndName}.md`);
    }

    // 检查笔记是否存在
    hasNote(date: DateTime, noteType: NoteType): boolean {
        const path = this.getNotePath(date, noteType);
        if (!path) return false;
        return this.plugin.app.vault.getAbstractFileByPath(path) instanceof TFile;
    }

    // 打开已有笔记，或创建新笔记
    async openOrCreate(date: DateTime, noteType: NoteType): Promise<void> {
        const path = this.getNotePath(date, noteType);
        if (!path) {
            return;
        }

        // 已有笔记：直接打开
        const existing = this.plugin.app.vault.getAbstractFileByPath(path);
        if (existing instanceof TFile) {
            await this.plugin.app.workspace.getLeaf(false).openFile(existing);
            return;
        }

        // 新建笔记：先确认再创建
        const settings = this.plugin.database.getSettings();
        const doCreate = async () => {
            await this.ensureFolder(path);
            const file = await this.plugin.app.vault.create(path, "");
            // 创建后套用模板（若配置了模板文件）
            await this.plugin.templateService.insertTemplate(file, noteType);
            await this.plugin.app.workspace.getLeaf(false).openFile(file);
        };

        if (settings.shouldConfirmBeforeCreate) {
            new ConfirmModal(this.plugin, doCreate).open();
        } else {
            await doCreate();
        }
    }

    // 确保父级目录存在（路径可以包含多级文件夹）
    private async ensureFolder(path: string): Promise<void> {
        const folderPath = path.substring(0, path.lastIndexOf("/"));
        if (!folderPath) return;

        const parts = folderPath.split("/");
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.plugin.app.vault.getAbstractFileByPath(current)) {
                await this.plugin.app.vault.createFolder(current);
            }
        }
    }
}
