import { App, Editor, Notice, Menu, MenuItem } from "obsidian";
import { MediaBlockType, MediaType } from "./types";
import { DEFAULT_SETTINGS, LocalMediaPluginSettings } from "./settings";
import { cleanPath, stringToHash, formatTime } from "./utils";
import { determineEmbedType, isValidPath } from "./media_utils";
import { findActivePlayer } from "./player_manager";

export function embedMediaAsCodeBlock(editor: Editor): void {
	try {
		let filePath = editor.getSelection();
		if (!filePath) {
			new Notice("File path not provided");
			return;
		}

		filePath = cleanPath(filePath);
		filePath = filePath.replace("file:///", "");

		let embedType = determineEmbedType(filePath);

		let codeBlock = `\`\`\`media
path: ${filePath}
type: ${embedType}
`;
		if (embedType === "video" || embedType === "iframe" || embedType === "youtube") {
			codeBlock += `width: ${640}
height: ${360}
`;
		}

        if (filePath.includes("*") || filePath.endsWith("/") || filePath.endsWith("\\")) {
            codeBlock += `view: list
`;
        }

		codeBlock += `\`\`\``;

		editor.replaceSelection(codeBlock);
	} catch (error) {
		console.log("Error:", error);
	}
}

export function insertVideoTimestamp(app: App, editor: Editor): void {
    const activeLeaf = app.workspace.activeLeaf;
    if (activeLeaf) {
        const viewContent = activeLeaf.view.containerEl;
        const targetPlayer = findActivePlayer(viewContent);

        if (targetPlayer) {
            const time = targetPlayer.currentTime;
            const formatted = formatTime(time);
            
            // Try to get mediaId from original, container, or media element
            let mediaId = "";
            
            const checks = [
                targetPlayer.elements?.original,
                targetPlayer.elements?.container,
                targetPlayer.media
            ];

            for (const el of checks) {
                if (el) {
                    const id = el.getAttribute("data-media-id");
                    if (id) {
                        mediaId = id;
                        break;
                    }
                }
            }
            
            // Fallback: If no mediaId found but it's a youtube player, we can hash the source URL if available
            if (!mediaId && targetPlayer.provider === 'youtube' && targetPlayer.source) {
                mediaId = stringToHash(targetPlayer.source);
            }

            editor.replaceSelection(`<span class="timestamp-seek" data-media-id="${mediaId}" data-seconds="${time.toFixed(0)}">${formatted}</span> `);
        } else {
            new Notice("No active video player found in this note.");
        }
    }
}

export function generateMediaView(
	app: App,
	mediainfo: MediaBlockType,
	settings: typeof DEFAULT_SETTINGS = DEFAULT_SETTINGS
): string {
    try {
		let filePath: string = cleanPath(mediainfo.path);

		if (!filePath) {
			new Notice("File path not provided");
			return "";
		}

		if (filePath.startsWith("file:///"))
			filePath = filePath.replace("file:///", "");
		filePath = decodeURIComponent(filePath);

		if (!isValidPath(filePath)) {
			new Notice("The provided file path or link is not valid.");
			return "";
		}

		let url: string;
		if (filePath.match(/^https?:\/\//)) {
			url = filePath;
		} else {
            // Convert to app:// URL for local files
            const normalizedPath = filePath.replace(/\\/g, "/");
            const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');
            
            // Use dummy file to get adapter resource path logic
            const resourcePath = app.vault.adapter.getResourcePath("__dummy__");
            const appIdMatches = resourcePath.match(/app:\/\/([^\/]+)\//);
            const appId = appIdMatches ? appIdMatches[1] : "local";
            url = `app://${appId}/${encodedPath}`;
		}

		let embedType: MediaType = mediainfo.type || determineEmbedType(filePath);

		const width = mediainfo.width ?? 640;
		const height = mediainfo.height ?? 360;
        const mediaId = stringToHash(filePath);

        const widthStyle = typeof width === 'number' ? `${width}px` : width;
        const heightStyle = typeof height === 'number' ? `${height}px` : height;

        let style = `width: ${widthStyle}; max-width: 100%;`;
        if (embedType !== "audio") {
            style += ` height: ${heightStyle};`;
        }

		let playerHtml = "";
		if (embedType === "video") {
			playerHtml = `<video data-media-id="${mediaId}" class="plyr-player" playsinline controls>
    <source src="${url}" type="video/mp4">
</video>`;
		} else if (embedType === "audio") {
			playerHtml = `<audio data-media-id="${mediaId}" class="plyr-player" controls>
    <source src="${url}" type="audio/mpeg">
</audio>`;
		} else if (embedType === "youtube") {
            playerHtml = `<div data-media-id="${mediaId}" class="plyr-player plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${url}"></div>`;
        } else {
			playerHtml = `<iframe data-media-id="${mediaId}" class="plyr-player" src="${url}" frameborder="0" allowfullscreen></iframe>`;
		}

        return `<div class="local-media-container" style="${style} margin: 0 auto; overflow: hidden;">
            ${playerHtml}
        </div>`;
	} catch (error) {
		console.log("Error:", error);
		return "";
	}
}

export function onEditorMenu(
    app: App,
	menu: Menu,
	editor: Editor,
	showInMenuItem: boolean = true
) {
	if (!showInMenuItem) return;
	try {
		menu.addItem((item: MenuItem) => {
			item.setTitle("Embed selected media path")
				.setIcon("link")
				.onClick(async () => {
					if (!editor) return;
					embedMediaAsCodeBlock(editor);
				});
		});

        menu.addItem((item: MenuItem) => {
            item.setTitle("Insert video timestamp")
                .setIcon("timer")
                .onClick(() => {
                    insertVideoTimestamp(app, editor);
                });
        });
	} catch (error) {
		console.log("Error :", error);
	}
	return;
}
