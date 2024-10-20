import { Notice, Editor, Menu, MenuItem } from "obsidian";
import { DEFAULT_SETTINGS } from "settings";
import { MediaBlockType, MediaType } from "types";

export function embedMediaAsCodeBlock(editor: Editor): void {
	try {
		const filePath = editor.getSelection();
		if (!filePath) {
			new Notice("File path not provided");
			return;
		}

		const decodedFilePath = decodeURIComponent(filePath);
		let embedType = "auto";
		if (decodedFilePath.match(/\.(mp4|webm|ogg)$/)) {
			embedType = "video";
		} else if (decodedFilePath.match(/\.(mp3|wav|ogg)$/)) {
			embedType = "audio";
		} else {
			embedType = "iframe";
		}

		let codeBlock = `\`\`\`media
path: ${decodedFilePath}
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
	mediainfo: MediaBlockType,
	settings: typeof DEFAULT_SETTINGS = DEFAULT_SETTINGS
): string {
	try {
		let filePath: string = mediainfo.path;

		const port: number = settings.port || DEFAULT_SETTINGS.port;
		const baselink: string = settings.baselink || DEFAULT_SETTINGS.baselink;

		if (!filePath) {
			new Notice("File path not provided");
			return "";
		}

		filePath = decodeURIComponent(filePath);
		if (filePath.startsWith("file:///")) {
			filePath = filePath.replace("file:///", "");
		}
		// Check if the file path is a valid file or link (starts with C:\ or / or https:// or http://)
		const isWindowsPath = filePath.match(/^[A-Za-z]:(\\|\/)/);
		const isUnixPath = filePath.match(/^\//);
		const isLink = filePath.match(/^https?:\/\//);

		let url: string;

		if (isLink) {
			// If it's a link, embed it directly without adding anything
			url = filePath;
		} else if (isWindowsPath || isUnixPath) {
			// If it's a file path, prepend the local server address
			const encodedPath = encodeURIComponent(filePath);
			url = `${baselink}:${port}/?q=${encodedPath}`;
		} else {
			new Notice("The provided file path or link is not valid.");
			return "";
		}

		let embedCode: string;
		let embedType: MediaType = mediainfo.type || "auto";

		if (embedType === "auto") {
			if (filePath.match(/\.(mp4|webm|ogg)$/)) {
				embedType = "video";
			} else if (filePath.match(/\.(mp3|wav|ogg)$/)) {
				embedType = "audio";
			} else {
				embedType = "iframe";
			}
		}

		if (embedType === "video") {
			embedCode = `<video width="${mediainfo.width ?? 640}" height=${
				mediainfo.height ?? 360
			}" controls>
    <source src="${url}" type="video/mp4">
    Your browser does not support the video tag.
</video>`;
		} else if (embedType === "audio") {
			embedCode = `<audio controls>
    <source src="${url}" type="audio/mpeg">
    Your browser does not support the audio tag.
</audio>`;
		} else {
			embedCode = `<iframe src="${url}" width="${
				mediainfo.width ?? 640
			}" height=${
				mediainfo.height ?? 360
			}" frameborder="0" allowfullscreen></iframe>`;
		}

		return embedCode;
	} catch (error) {
		console.log("Error :", error);
		return "";
	}
}
