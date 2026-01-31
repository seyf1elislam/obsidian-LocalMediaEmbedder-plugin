import { Notice, Editor, Menu, MenuItem, App } from "obsidian";
import { DEFAULT_SETTINGS } from "settings";
import { MediaBlockType, MediaType } from "types";

export function embedMediaAsCodeBlock(editor: Editor): void {
	try {
		let filePath = editor.getSelection();
		if (!filePath) {
			new Notice("File path not provided");
			return;
		}

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

export function onEditorMenu(
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
		let filePath: string = mediainfo.path;

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

		if (embedType === "video") {
			return `<video class="plyr-player" playsinline controls width="${width}" height="${height}">
    <source src="${url}" type="video/mp4">
</video>`;
		} else if (embedType === "audio") {
			return `<audio class="plyr-player" controls>
    <source src="${url}" type="audio/mpeg">
</audio>`;
		} else {
			return `<iframe class="plyr-player" src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
		}
	} catch (error) {
		console.log("Error:", error);
		return "";
	}
}

function isValidPath(filePath: string): boolean {
	const isWindowsPath = filePath.match(/^[A-Za-z]:(\\|\/)/) !== null;
	const isUnixPath = filePath.match(/^\//) !== null;
	const isLink = filePath.match(/^https?:\/\//) !== null;
	return isWindowsPath || isUnixPath || isLink;
}

export function determineEmbedType(filePath: string): MediaType {
	filePath = filePath.replace("file:///", "");
	if (filePath.match(/\.(mp4|webm|ogg)$/)) {
		return "video";
	} else if (filePath.match(/\.(mp3|wav|ogg)$/)) {
		return "audio";
	} else {
		return "iframe";
	}
}
