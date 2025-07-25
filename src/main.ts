import { embedMediaAsCodeBlock, embedMediaWithFilePicker, onEditorMenu } from "functions";
import { embedMediOld } from "embedMedia_old";
import { Notice, Plugin, Editor, Menu } from "obsidian";
import { MediaServer } from "server";
import {
	LocalMediaPluginSettings,
	DEFAULT_SETTINGS,
	MyPluginSettingsTab,
} from "settings";
import { MediaBlockProcessor } from "media_blockproccessor";

export default class EmbedMediaPlugin extends Plugin {
	settings: LocalMediaPluginSettings;
	private server: MediaServer;
	private toggleRibbon: HTMLElement;
	private statusElement: HTMLElement;
	private serverRunning: boolean = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingsTab(this));
		// Initialize the MediaServer instance
		this.server = new MediaServer(this.settings.port, this.settings);
		try {
			this.server.startServer();
			this.serverRunning = true;
		} catch (error) {
			console.error("Failed to start media server:", error);
			new Notice(`Failed to start server: ${error.message}`);
			this.serverRunning = false;
		}

		this.toggleRibbon = this.addRibbonIcon(
			"server-crash",
			"Toggle media server",
			this.toggleServer
		);

		this.addCommand({
			id: "embed-in-iframe-0",
			name: "Embed in iframe tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(editor, this.settings, "iframe");
			},
		});
		this.addCommand({
			id: "embed-in-videotag-LocalMedia",
			name: "Embed in video tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(editor, this.settings, "video");
			},
		});
		this.addCommand({
			id: "embed-in-audiotag-LocalMedia",
			name: "Embed in audio tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(editor, this.settings, "audio");
			},
		});
		this.addCommand({
			id: "toggleserver-LocalMedia",
			name: "Toggle local media server",
			callback: () => {
				this.toggleServer();
			},
		});
		this.addCommand({
			id: "embed-in-auto-localMedia",
			name: "Embed auto",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(editor, this.settings, "auto");
			},
		});

		//?====== new code block embedding
		this.addCommand({
			id: "embed-in-codeblock-localMedia",
			name: "Embed as code block (from selection)",
			editorCallback(editor: Editor, ctx) {
				embedMediaAsCodeBlock(editor);
			},
		});

		this.addCommand({
			id: "embed-with-filepicker-localMedia",
			name: "Embed with file picker",
			editorCallback(editor: Editor, ctx) {
				embedMediaWithFilePicker(editor);
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

		this.updateStatusElement(); // Initialize the status element in the status bar
		this.updateRibbonIconColor(); // set the color of the ribbon icon

		this.statusElement.addEventListener("click", () => {
			this.toggleServer();
		});

		this.registerMarkdownCodeBlockProcessor("media", (source, el, ctx) => {
			const obj = new MediaBlockProcessor(this.app, this.settings);
			obj.run(source, el);
		});
	}

	private updateStatusElement = () => {
		const statusText = this.serverRunning ? "🟢" : "🔴";
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
				},
			});
		}
	};
	toggleServer = () => {
		if (!this.serverRunning) {
			try {
				// Recreate server with current settings
				this.server = new MediaServer(this.settings.port, this.settings);
				this.server.startServer();
				this.serverRunning = true;
				new Notice(
					`Local Media server started on port ${this.settings.port}`
				);
			} catch (error) {
				console.error("Failed to start media server:", error);
				new Notice(`Failed to start server: ${error.message}`);
				this.serverRunning = false;
			}
		} else {
			this.serverRunning = false;
			this.server.stopServer();
			new Notice("Local Media server stopped");
		}
		this.updateStatusElement();
		this.updateRibbonIconColor();
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
		try {
			this.server?.stopServer();
			await this.saveSettings();
			this.statusElement?.remove();
		} catch (error) {
			console.error("Error during plugin unload:", error);
		}
	}
	updateRibbonIconColor() {
		this.toggleRibbon.style.color = this.serverRunning
			? "rgb(36, 233, 36)"
			: "";
	}
}
