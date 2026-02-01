import { embedMediaAsCodeBlock, onEditorMenu, insertVideoTimestamp } from "ui_generators";
import { Plugin, Editor, Menu, Notice } from "obsidian";
import {
	LocalMediaPluginSettings,
	DEFAULT_SETTINGS,
	MyPluginSettingsTab,
} from "settings";
import { MediaBlockProcessor } from "media_blockproccessor";
import { findActivePlayer, findPlayerById } from "player_manager";
import Plyr from "plyr";

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
                    const player = new Plyr(playerEl as HTMLElement);
                    (playerEl as any).plyr = player;

                    if (player.elements.container) {
                        (player.elements.container as any).plyr = player;
                        const mediaId = playerEl.getAttribute("data-media-id");
                        if (mediaId) {
                            player.elements.container.setAttribute("data-media-id", mediaId);
                        }
                    }
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
                        
                        let targetPlayer: Plyr | null = null;
                        
                        // If we have a mediaId, find the exact player
                        if (mediaId) {
                            targetPlayer = findPlayerById(viewContent, mediaId);
                        }
                        
                        // Fallback to active/first player if no specific ID or not found
                        if (!targetPlayer) {
                            targetPlayer = findActivePlayer(viewContent);
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
