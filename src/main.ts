import { embedMediaAsCodeBlock, onEditorMenu, formatTime, parseTime } from "functions";
import { embedMediOld } from "embedMedia_old";
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

		this.addCommand({
			id: "embed-in-iframe-0",
			name: "Embed in iframe tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(this.app, editor, this.settings, "iframe");
			},
		});
		this.addCommand({
			id: "embed-in-videotag-LocalMedia",
			name: "Embed in video tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(this.app, editor, this.settings, "video");
			},
		});
		this.addCommand({
			id: "embed-in-audiotag-LocalMedia",
			name: "Embed in audio tag",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(this.app, editor, this.settings, "audio");
			},
		});

		this.addCommand({
			id: "embed-in-auto-localMedia",
			name: "Embed auto",
			editorCallback(editor: Editor, ctx) {
				embedMediOld(this.app, editor, this.settings, "auto");
			},
		});

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
					onEditorMenu(menu, editor, this.settings.showInMenuItem);
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
                if (dataTime) {
                    const seconds = parseFloat(dataTime);
                    
                    // Find the player 
                    // Strategy: Look for the active player in the current view
                    // Try to find a player in the active leaf's view
                    const activeLeaf = this.app.workspace.activeLeaf;
                    if (activeLeaf) {
                        const viewContent = activeLeaf.view.containerEl;
                        const players = viewContent.querySelectorAll('.plyr-player');
                        
                        // Heuristic: Use the first playing player, or the first player if none playing
                        let targetPlayer: any = null;
                        
                        players.forEach((p: any) => {
                             if (p.plyr && p.plyr.playing) {
                                targetPlayer = p.plyr;
                             }
                        });
                        
                        if (!targetPlayer && players.length > 0) {
                            targetPlayer = (players[0] as any).plyr;
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
                const activeLeaf = this.app.workspace.activeLeaf;
                if (activeLeaf) {
                     const viewContent = activeLeaf.view.containerEl;
                     // Look for plyr in the PREVIEW mode or EDIT mode container
                     // Note: IF we are in Source Mode, the player might not be rendered unless in Live Preview
                     
                     const players = viewContent.querySelectorAll('.plyr-player');
                     let targetPlayer: any = null;
                        
                     // Same heuristic
                     players.forEach((p: any) => {
                          if (p.plyr && p.plyr.playing) {
                             targetPlayer = p.plyr;
                          }
                     });
                     
                     if (!targetPlayer && players.length > 0) {
                         targetPlayer = (players[0] as any).plyr;
                     }
                     
                     
                     if (targetPlayer) {
                         const time = targetPlayer.currentTime;
                         const formatted = formatTime(time);
                         // Insert HTML span: <span class="timestamp-seek" data-seconds="123">MM:SS</span>
                         editor.replaceSelection(`<span class="timestamp-seek" data-seconds="${time.toFixed(0)}">${formatted}</span> `);
                     } else {
                         new Notice("No active video player found.");
                     }
                }
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
