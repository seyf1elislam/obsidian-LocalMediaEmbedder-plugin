import { embedMedia, onEditorMenu } from "functions";
import { Notice, Plugin, Editor, Menu } from "obsidian";
import { MediaServer } from "server";
import {
	LocalMediaPluginSettings,
	DEFAULT_SETTINGS,
	MyPluginSettingsTab,
} from "settings";

export default class EmbedMediaPlugin extends Plugin {
	settings: LocalMediaPluginSettings;
	private server: MediaServer;
	private toggleRibbon: HTMLElement;
	private statusElement: HTMLElement;
	private serverStatusUpdatedInterval_ID: number | NodeJS.Timeout;

	private serverRunning: boolean = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingsTab(this));
		// await this.saveSettings();

		// Initialize the MediaServer instance
		this.server = new MediaServer(this.settings.port);
		this.server.startServer();
		this.serverRunning = true;

		if (this.settings.showInRibbon) {
			this.toggleRibbon = this.addRibbonIcon(
				"server",
				"Toggle Media server",
				this.toggleServer
			);
		}

		this.addCommand({
			id: "embed-in-iframe-0",
			name: "Embed in Iframe tag",
			editorCallback(editor: Editor, ctx) {
				embedMedia(editor, this.settings, "iframe");
			},
		});
		this.addCommand({
			id: "embed-in-videotag-LocalMedia",
			name: "Embed in video tag",
			editorCallback(editor: Editor, ctx) {
				embedMedia(editor, this.settings, "video");
			},
		});
		this.addCommand({
			id: "embed-in-audiotag-LocalMedia",
			name: "Embed in audio tag",
			editorCallback(editor: Editor, ctx) {
				embedMedia(editor, this.settings, "audio");
			},
		});
		this.addCommand({
			id: "toggleserver-LocalMedia",
			name: "Toggle Local Media Server",
			callback: () => {
				this.toggleServer();
			},
		});
		this.addCommand({
			id: "embed-in-auto-localMedia",
			name: "Embed auto",
			editorCallback(editor: Editor, ctx) {
				embedMedia(editor, this.settings, "auto");
			},
		});

		//?======
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor) => {
					onEditorMenu(menu, editor, this.settings.showInMenuItem);
				}
			)
		);

		this.statusElement = this.addStatusBarItem();
		this.serverStatusUpdatedInterval_ID = setInterval(() => {
			const statusText = this.serverRunning
				? "Local Media Server Active🟢"
				: "Local Media Server ServerInactive 🔴";
			const statusElement = document.querySelector(
				"#local-media-server-status"
			);

			if (this.statusElement && statusElement) {
				statusElement.textContent = statusText;
			} else {
				this.statusElement.createEl("span", {
					text: statusText,
					attr: {
						id: "local-media-server-status",
						cls: "status-bar-item",
					},
				});
			}
		}, 1000);

		this.statusElement.addEventListener("click", () => {
			this.toggleServer();
		});
	}

	private toggleServer = () => {
		if (!this.serverRunning) {
			this.serverRunning = true;
			this.server.startServer();
			new Notice(
				`Local Media server started on port ${this.settings.port}`
			);
		} else {
			this.serverRunning = false;
			this.server.stopServer();
			new Notice("Local Media server stopped");
		}
	};
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	async unload() {
		this.server.stopServer();
		await this.saveSettings();
		clearInterval(this.serverStatusUpdatedInterval_ID);
		this.statusElement.remove();
	}
}
