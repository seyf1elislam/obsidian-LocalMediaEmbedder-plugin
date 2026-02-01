import { Notice, Editor, Menu, MenuItem, App } from "obsidian";
import * as fs from "fs";
import * as path from "path";
import { DEFAULT_SETTINGS, LocalMediaPluginSettings } from "settings";
import { MediaBlockType, MediaType } from "types";

export function cleanPath(path: string): string {
	if (!path || typeof path !== 'string') return path;
	
	let cleaned = path.trim();
	// Remove surrounding quotes
	if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
		cleaned = cleaned.substring(1, cleaned.length - 1).trim();
	}
	// Remove any actual newline characters and carriage returns
	cleaned = cleaned.replace(/[\n\r]+/g, '').trim();
	return cleaned;
}


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
		if (embedType === "video" || embedType === "iframe") {
			codeBlock += `width: ${640}
height: ${360}
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
        // Broaden search to include both the original element and the Plyr container
        const playerElements = viewContent.querySelectorAll('.plyr-player, .plyr');
        
        let foundPlayers: any[] = [];
        playerElements.forEach((el: any) => {
            if (el.plyr && !foundPlayers.includes(el.plyr)) {
                foundPlayers.push(el.plyr);
            }
        });

        let targetPlayer: any = null;

        // Choice 1: The one that is currently playing
        foundPlayers.forEach((p: any) => {
            if (p.playing) {
                targetPlayer = p;
            }
        });

        // Choice 2: If only one player total, use it
        if (!targetPlayer && foundPlayers.length === 1) {
            targetPlayer = foundPlayers[0];
        }

        // Choice 3: If multiple players and none playing, we might not know which one.
        // For now, take the first one found, but notify user if it's ambiguous.
        if (!targetPlayer && foundPlayers.length > 1) {
            targetPlayer = foundPlayers[0];
            new Notice("Multiple players found. Using the first one.");
        }

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
					//TODO replace tihs default with the actual settings
					// embedMediOld(editor, DEFAULT_SETTINGS, "auto");
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
            // Normalize path separators to forward slashes
            const normalizedPath = filePath.replace(/\\/g, "/");
            
            // Encode the path to handle spaces and special characters, but preserve the structure
            // We encode the whole path chunks safely if needed, but usually fixed replacement is enough for app protocol
             const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');

            // Construct the final app:// URL
            const resourcePath = app.vault.adapter.getResourcePath("__dummy__");
            const appIdMatches = resourcePath.match(/app:\/\/([^\/]+)\//);
            const appId = appIdMatches ? appIdMatches[1] : "local";
            url = `app://${appId}/${encodedPath}`;
		}

		let embedType: MediaType =
			mediainfo.type || determineEmbedType(filePath);

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

export function resolvePaths(mediainfo: MediaBlockType, settings: LocalMediaPluginSettings): string[] {
    let folderPath = cleanPath(mediainfo.path);
    if (folderPath.startsWith("file:///")) folderPath = folderPath.replace("file:///", "");
    
    // Check if it's a wildcard path
    let filterPattern = mediainfo.filter;
    let baseDir = folderPath;
    let fileGlob = "";

    const lastSlash = Math.max(folderPath.lastIndexOf("/"), folderPath.lastIndexOf("\\"));
    if (folderPath.includes("*")) {
        // Handle wildcards like C:\Videos\*.mp4
        if (lastSlash !== -1) {
            baseDir = folderPath.substring(0, lastSlash);
            fileGlob = folderPath.substring(lastSlash + 1);
        } else {
            baseDir = "."; // Fallback to current dir if no slash, though unlikely for absolute paths
            fileGlob = folderPath;
        }
        
        // Convert glob to regex: * -> .*, . -> \. and anchor it
        if (!filterPattern) {
            filterPattern = "^" + fileGlob.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$";
        }
    }

    try {
        if (!fs.existsSync(baseDir)) return [folderPath];
        const stats = fs.statSync(baseDir);
        
        if (!stats.isDirectory()) {
            return [folderPath];
        }

        const files = fs.readdirSync(baseDir);
        let regex: RegExp | null = null;
        if (filterPattern) {
            try {
                regex = new RegExp(filterPattern, "i");
            } catch (e) {
                new Notice("Invalid regex filter: " + filterPattern);
            }
        }

        const resolvedPaths = files
            .filter(file => {
                const fullPath = path.join(baseDir, file);
                try {
                    if (fs.statSync(fullPath).isDirectory()) return false;
                } catch (e) { return false; }

                // If it was a wildcard, we MUST match the pattern
                if (fileGlob && regex) {
                    return regex.test(file);
                }
                
                // If it's just a folder, we match by supported media types
                const type = determineEmbedType(file);
                const isMedia = type === "video" || type === "audio" || type === "youtube";
                
                if (regex) {
                    return isMedia && regex.test(file);
                }
                return isMedia;
            })
            .sort() // Sort alphabetically
            .map(file => path.join(baseDir, file))
            .slice(0, settings.maxEmbeds);

        return resolvedPaths.length > 0 ? resolvedPaths : [folderPath];
    } catch (error) {
        console.error("Error resolving paths:", error);
        return [folderPath];
    }
}

export function stringToHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

function isValidPath(filePath: string): boolean {
	const isWindowsPath = filePath.match(/^[A-Za-z]:(\\|\/)/) !== null;
	const isUnixPath = filePath.match(/^\//) !== null;
	const isLink = filePath.match(/^https?:\/\//) !== null;
	return isWindowsPath || isUnixPath || isLink;
}

export function determineEmbedType(filePath: string): MediaType {
	filePath = filePath.replace("file:///", "");
    
    if (filePath.includes("youtube.com") || filePath.includes("youtu.be")) {
        return "youtube";
    }

	if (filePath.match(/\.(mp4|webm|ogg)$/)) {
		return "video";
	} else if (filePath.match(/\.(mp3|wav|ogg)$/)) {
		return "audio";
	} else {
		return "iframe";
	}
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) {
        return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
}

export function parseTime(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parts[0] * 3600;
        seconds += parts[1] * 60;
        seconds += parts[2];
    } else if (parts.length === 2) {
        seconds += parts[0] * 60;
        seconds += parts[1];
    } else if (parts.length === 1) {
        seconds += parts[0];
    }
    return seconds;
}
