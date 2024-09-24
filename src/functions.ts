import { Notice, Editor, Menu, MenuItem } from "obsidian";
import { DEFAULT_SETTINGS } from "settings";

export type EmbedType = "video" | "iframe" | "audio" | "image" | "auto";

export function embedMedia(
	editor: Editor,
	settings: typeof DEFAULT_SETTINGS = DEFAULT_SETTINGS,
	embedType: EmbedType
) {
	const filePath = editor.getSelection();

	const port: number = settings.port || DEFAULT_SETTINGS.port;
	const baselink: string = settings.baselink || DEFAULT_SETTINGS.baselink;

	if (!filePath) {
		new Notice("File path not provided");
		return;
	}

	// Check if the file path is a valid file or link (starts with C:\ or / or https://)
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
		new Notice("File path or link not valid");
		return;
	}

	let embedCode: string;

	if (embedType === "auto") {
		if (filePath.match(/\.mp4$/)) {
			embedType = "video";
		} else if (filePath.match(/\.mp3$/)) {
			embedType = "audio";
		} else if (filePath.match(/\.png$|\.jpg$|\.jpeg$/)) {
			embedType = "image";
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
	} else if (embedType === "image") {
		// embedCode = `<img src="${url}" alt="image" width="640" height="360">`;
		embedCode = `![](${url})`;
	} else {
		embedCode = `<iframe src="${url}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
	}

	editor.replaceSelection(embedCode);
}

export function onEditorMenu(
	menu: Menu,
	editor: Editor,
	showInMenuItem: boolean = true
) {
	if (!showInMenuItem) return;

	menu.addItem((item: MenuItem) => {
		item.setTitle("Embed link in video tag [LocalMedia]")
			.setIcon("link")
			.onClick(async () => {
				if (!editor) return;
				embedMedia(editor, DEFAULT_SETTINGS, "video");
			});
	});
	menu.addItem((item: MenuItem) => {
		item.setTitle("Embed link in audio tag [LocalMedia]")
			.setIcon("link")
			.onClick(async () => {
				if (!editor) return;
				embedMedia(editor, DEFAULT_SETTINGS, "audio");
			});
	});
	menu.addItem((item: MenuItem) => {
		item.setTitle("Embed auto [LocalMedia]")
			.setIcon("link")
			.onClick(async () => {
				if (!editor) return;
				embedMedia(editor, DEFAULT_SETTINGS, "auto");
			});
	});
	return;
}
