import { embedMediaAsCodeBlock, onEditorMenu, formatTime, parseTime, insertVideoTimestamp } from "functions";
import { Plugin, Editor, Menu, Notice } from "obsidian";
import {
	LocalMediaPluginSettings,
	DEFAULT_SETTINGS,
	MyPluginSettingsTab,
} from "settings";
import { MediaBlockProcessor } from "media_blockproccessor";

// @ts-ignore
import Plyr from 'plyr';

export default class EmbedMediaPlugin extends Plugin {
	settings: LocalMediaPluginSettings;

	async onload() {

		await this.loadSettings();
		this.addSettingTab(new MyPluginSettingsTab(this));

		//?====== new
		this.addCommand({
			id: "embed-in-codeblock-localMedia",
			name: "Embed as code block",
			editorCallback(editor: Editor, ctx) {
				embedMediaAsCodeBlock(editor);
			},
		});

		//?======
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor) => {
					onEditorMenu(this.app, menu, editor);
				}
			)
		);

		this.registerMarkdownCodeBlockProcessor("media", (source, el, ctx) => {
			const obj = new MediaBlockProcessor(this.app, this.settings);
			obj.run(source, el);
		});

        this.registerMarkdownPostProcessor((el, ctx) => {
            const players = el.querySelectorAll('.plyr-player');
            players.forEach(playerEl => {
                // To avoid double initialization if MediaBlockProcessor already did it
                if (!(playerEl as any).plyr) {
                    new Plyr(playerEl as HTMLElement);
                }
            });
        });

        // Register the click event for timestamp links
        this.registerDomEvent(document, "click", (evt: MouseEvent) => {
            const target = evt.target as HTMLElement;
            if (target && target.classList.contains("timestamp-seek")) {
                const dataTime = target.getAttribute("data-seconds");
                const mediaId = target.getAttribute("data-media-id");
                
                if (dataTime) {
                    const seconds = parseFloat(dataTime);
                    const activeLeaf = this.app.workspace.activeLeaf;
                    if (activeLeaf) {
                        const viewContent = activeLeaf.view.containerEl;
                        const players = viewContent.querySelectorAll('.plyr-player');
                        let targetPlayer: any = null;
                        
                        // If we have a mediaId, find the exact player
                        if (mediaId) {
                            players.forEach((p: any) => {
                                 const pId = p.plyr?.media?.getAttribute("data-media-id");
                                 if (pId === mediaId) {
                                     targetPlayer = p.plyr;
                                 }
                            });
                        }
                        
                        // Fallback to active/first player if no specific ID or not found
                        if (!targetPlayer) {
                            players.forEach((p: any) => {
                                 if (p.plyr && p.plyr.playing) {
                                    targetPlayer = p.plyr;
                                 }
                            });
                            if (!targetPlayer && players.length > 0) {
                                targetPlayer = (players[0] as any).plyr;
                            }
                        }

                        if (targetPlayer) {
                            targetPlayer.currentTime = seconds;
                            targetPlayer.play();
                        }
                    }
                }
            }
        });

        this.addCommand({
            id: "insert-video-timestamp",
            name: "Insert video timestamp",
            editorCallback: (editor: Editor, view: any) => {
                insertVideoTimestamp(this.app, editor);
            }
        });

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
		await this.saveSettings();
	}
}
