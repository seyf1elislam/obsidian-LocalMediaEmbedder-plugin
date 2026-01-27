import { Editor, Notice } from "obsidian";
import { DEFAULT_SETTINGS } from "settings";
import { MediaType } from "types";
//deprecated function to embed media
export function embedMediOld(
	input: Editor | string,
	settings: typeof DEFAULT_SETTINGS = DEFAULT_SETTINGS,
	embedType: MediaType
): string | void {
	try {
		let filePath: string;

		if (typeof input === "string") {
			filePath = input;
		} else {
			filePath = input.getSelection();
		}



		if (!filePath) {
			new Notice("File path not provided");
			return;
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
			// If it's a file path, convert to app:// protocol
            const normalizedPath = filePath.replace(/\\/g, "/");
            const encodedPath = normalizedPath.split('/').map(part => encodeURIComponent(part)).join('/');
			url = `app://local/${encodedPath}`;
		} else {
			new Notice("The provided file path or link is not valid.");
			return;
		}

		let embedCode: string;

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
			embedCode = `<video width="640" height="360" controls>
    <source src="${url}" type="video/mp4">
    Your browser does not support the video tag.
</video>`;
		} else if (embedType === "audio") {
			embedCode = `<audio controls>
    <source src="${url}" type="audio/mpeg">
    Your browser does not support the audio tag.
</audio>`;
		} else {
			embedCode = `<iframe src="${url}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
		}

		if (typeof input === "string") {
			return embedCode;
		} else {
			input.replaceSelection(embedCode);
		}
	} catch (error) {
		console.log("Error :", error);
	}
}
