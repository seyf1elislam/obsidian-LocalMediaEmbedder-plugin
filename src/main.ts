import { embedMedia, onEditorMenu } from "functions";
import { Notice, Plugin, Editor, Menu } from "obsidian";
import { MediaServer } from "server";
import {
	MyPluginSettings,
	DEFAULT_SETTINGS,
	MyPluginSettingsTab,
} from "settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private server: MediaServer;
	private startRibbon: HTMLElement;
	private stopRibbon: HTMLElement;
	private serverRunning: boolean = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingsTab(this));
		// await this.saveSettings();

		// Initialize the MediaServer instance
		this.server = new MediaServer(this.settings.port);
		this.server.startServer();

		if (this.settings.showInRibbon) {
			this.startRibbon = this.addRibbonIcon(
				"play-circle",
				"Start Media server",
				() => {
					if (!this.serverRunning) {
						this.server.startServer();
						this.serverRunning = true;
						new Notice(
							`Media server started on port ${this.settings.port}`
						);
					} else {
						new Notice("Server is already running");
					}
				}
			);

			this.stopRibbon = this.addRibbonIcon(
				"stop-circle",
				"Stop Media server",
				() => {
					if (this.serverRunning) {
						this.server.stopServer();
						this.serverRunning = false;
						new Notice("Media server stopped");
					} else {
						new Notice("Server is not running");
					}
				}
			);
		}

		this.addCommand({
			id: "embed-in-iframe-0",
			name: "Embed in Iframe tag",
			editorCallback(editor: Editor, ctx) {
				try {
					embedMedia(editor, this.settings, "iframe");
					console.log("successfully embeded in iframe");
				} catch (error) {
					console.log("error :", error);
				}
			},
		});
		this.addCommand({
			id: "embed-in-videotag-LocalMedia",
			name: "Embed in video tag",
			editorCallback(editor: Editor, ctx) {
				try {
					embedMedia(editor, this.settings, "video");
					console.log("successfully embeded in video");
				} catch (error) {
					console.log("error :", error);
				}
			},
		});
		this.addCommand({
			id: "embed-in-audiotag-LocalMedia",
			name: "Embed in audio tag",
			editorCallback(editor: Editor, ctx) {
				try {
					embedMedia(editor, this.settings, "audio");
					console.log("successfully embeded in audio");
				} catch (error) {
					console.log("error :", error);
				}
			},
		});
		this.addCommand({
			id: "embed-in-imagetag-LocalMedia",
			name: "Embed in image tag",
			editorCallback(editor: Editor, ctx) {
				try {
					embedMedia(editor, this.settings, "image");
					console.log("successfully embeded in image");
				} catch (error) {
					console.log("error :", error);
				}
			},
		});
		this.addCommand({
			id: "embed-in-auto-localMedia",
			name: "Embed auto",
			editorCallback(editor: Editor, ctx) {
				try {
					embedMedia(editor, this.settings, "auto");
					console.log("successfully embeded in auto");
				} catch (error) {
					console.log("error :", error);
				}
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
	}

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
		console.log("Server stopped");
	}
}
