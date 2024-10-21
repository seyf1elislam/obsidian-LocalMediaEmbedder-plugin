import { Notice, Editor, Menu, MenuItem } from "obsidian";
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
			const encodedPath = encodeURIComponent(filePath);
			url = `${baselink}:${port}/?q=${encodedPath}`;
		}

		let embedType: MediaType =
			mediainfo.type || determineEmbedType(filePath);

		const width = mediainfo.width ?? 640;
		const height = mediainfo.height ?? 360;

		if (embedType === "video") {
			return `<video width="${width}" height="${height}" controls>
    <source src="${url}" type="video/mp4">
    Your browser does not support the video tag.
</video>`;
		} else if (embedType === "audio") {
			return `<audio controls>
    <source src="${url}" type="audio/mpeg">
    Your browser does not support the audio tag.
</audio>`;
		} else {
			return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
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
