import { App, Editor, View, parseYaml } from "obsidian";
import { MediaType, MediaBlockType } from "types";
import { LocalMediaPluginSettings } from "settings";
import { generateMediaView, cleanPath, resolvePaths } from "functions";
// @ts-ignore
import Plyr from 'plyr';

export class MediaBlockProcessor {
	app: App;
	settings: LocalMediaPluginSettings;

	constructor(app: App, settings: LocalMediaPluginSettings) {
		this.app = app;
		this.settings = settings;
	}

	
	async run(source: string, el: HTMLElement) {
		try {
			const data: MediaBlockType = this.parseMediaInfo(source);
			const resolvedPaths = resolvePaths(data, this.settings);
            
            const viewMode = data.view || "list";
            let itemsHtml = "";
            for (const resolvedPath of resolvedPaths) {
                const itemData = { ...data, path: resolvedPath };
                itemsHtml += `<div class="local-media-item">
                    ${generateMediaView(this.app, itemData, this.settings)}
                </div>`;
            }

            el.innerHTML = `<div class="local-media-view-${viewMode}">
                ${itemsHtml}
            </div>`;
            
            // Initialize Plyr for the newly added elements
            const players = el.querySelectorAll('.plyr-player');
            players.forEach(playerEl => {
                const player = new Plyr(playerEl as HTMLElement, {
                    // Optional: add config here
                });
                (playerEl as any).plyr = player;
                
                // Also attach to the container so we can find it easily
                if (player.elements.container) {
                    (player.elements.container as any).plyr = player;
                    // Copy mediaId to container if possible
                    const mediaId = playerEl.getAttribute("data-media-id");
                    if (mediaId) {
                        player.elements.container.setAttribute("data-media-id", mediaId);
                    }
                }
            });
		} catch (error) {
			el.createEl("p", { text: `Error parsing YAML: ${error.message}` });
		}
	}

	private parseMediaInfo(source: string): MediaBlockType {
		const parsed = parseYaml(source);
		let path = cleanPath(parsed.path || parsed.inputpath);

		if (!path || path.length < 3) {
			throw new Error("Invalid path provided.");
		}

		return {
			path: path,
			type: parsed.type as MediaType,
			width: parsed.width,
			height: parsed.height,
            filter: parsed.filter,
            view: parsed.view as "list" | "grid",
		};
	}
}
