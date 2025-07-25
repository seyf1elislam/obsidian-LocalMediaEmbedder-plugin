import { Notice, Editor, Menu, MenuItem } from "obsidian";
import { DEFAULT_SETTINGS } from "settings";
import { MediaBlockType, MediaType } from "types";

export function embedMediaAsCodeBlock(editor: Editor): void {
	try {
		let filePath = editor.getSelection();
		if (!filePath) {
			new Notice("Please select a file path first, or use the file picker command.");
			return;
		}

		filePath = filePath.replace("file:///", "");

		const embedType = determineEmbedType(filePath);

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
		new Notice(`Embedded ${embedType} media successfully`);
	} catch (error) {
		console.error("Error embedding media:", error);
		new Notice(`Error embedding media: ${error.message}`);
	}
}

export function embedMediaWithFilePicker(editor: Editor): void {
	try {
		// Create a file input element
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'video/*,audio/*,image/*,.mp4,.webm,.ogg,.ogv,.avi,.mov,.mp3,.wav,.m4a,.flac,.png,.gif,.jpg,.jpeg,.webp,.svg';
		
		fileInput.onchange = (event: Event) => {
			const target = event.target as HTMLInputElement;
			const file = target.files?.[0];
			
			if (file) {
				// Note: In browser environments, we can't get the full file path for security reasons
				// Users will need to manually edit the path in the code block
				const fileName = file.name;
				const embedType = determineEmbedType(fileName);
				
				let codeBlock = `\`\`\`media
path: ${fileName}
type: ${embedType}
`;
				if (embedType === "video" || embedType === "iframe") {
					codeBlock += `width: ${640}
height: ${360}
`;
				}

				codeBlock += `\`\`\``;

				editor.replaceSelection(codeBlock);
				new Notice(`Embedded ${embedType} media template. Please edit the path to the full file path.`);
			}
		};
		
		// Trigger the file picker
		fileInput.click();
	} catch (error) {
		console.error("Error with file picker:", error);
		new Notice(`Error opening file picker: ${error.message}`);
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
			return '<p style="color: red;">Error: File path not provided</p>';
		}

		if (filePath.startsWith("file:///"))
			filePath = filePath.replace("file:///", "");
		filePath = decodeURIComponent(filePath);

		if (!isValidPath(filePath)) {
			return '<p style="color: red;">Error: The provided file path or link is not valid or not a supported media format.</p>';
		}

		let url: string;
		if (filePath.match(/^https?:\/\//)) {
			url = filePath;
		} else {
			const encodedPath = encodeURIComponent(filePath);
			url = `${baselink}:${port}/?q=${encodedPath}`;
		}

		const embedType: MediaType =
			mediainfo.type || determineEmbedType(filePath);

		const width = mediainfo.width ?? settings.defaultWidth ?? DEFAULT_SETTINGS.defaultWidth;
		const height = mediainfo.height ?? settings.defaultHeight ?? DEFAULT_SETTINGS.defaultHeight;

		// Generate appropriate HTML based on media type
		switch (embedType) {
			case "video":
				return `<video width="${width}" height="${height}" controls preload="metadata">
    <source src="${url}" type="video/mp4">
    Your browser does not support the video tag.
</video>`;
			
			case "audio":
				return `<audio controls preload="metadata" style="width: 100%; max-width: ${width}px;">
    <source src="${url}" type="audio/mpeg">
    Your browser does not support the audio tag.
</audio>`;
			
			case "image":
				return `<img src="${url}" alt="Local media" style="max-width: ${width}px; max-height: ${height}px;" loading="lazy">`;
			
			case "iframe":
			default:
				return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
		}
	} catch (error) {
		console.error("Error generating media view:", error);
		return `<p style="color: red;">Error: Failed to generate media view - ${error.message}</p>`;
	}
}

function isValidPath(filePath: string): boolean {
	// Check for valid URL
	if (filePath.match(/^https?:\/\//)) {
		try {
			new URL(filePath);
			return true;
		} catch {
			return false;
		}
	}

	// Check for valid local file paths
	const isWindowsPath = filePath.match(/^[A-Za-z]:(\\|\/)/) !== null;
	const isUnixPath = filePath.match(/^\//) !== null;
	
	// Additional security checks
	if (isWindowsPath || isUnixPath) {
		// Prevent directory traversal attempts
		if (filePath.includes('..') || filePath.includes('~')) {
			return false;
		}
		// Check for valid file extension
		const ext = filePath.split('.').pop()?.toLowerCase();
		const validExtensions = [
			'png', 'gif', 'jpg', 'jpeg', 'webp', 'svg',
			'mp4', 'webm', 'ogg', 'ogv', 'avi', 'mov',
			'mp3', 'wav', 'oga', 'weba', 'm4a', 'flac'
		];
		return ext ? validExtensions.includes(ext) : false;
	}
	
	return false;
}

export function determineEmbedType(filePath: string): MediaType {
	filePath = filePath.replace("file:///", "");
	const ext = filePath.split('.').pop()?.toLowerCase();
	
	if (!ext) return "iframe";
	
	// Video formats
	if (['mp4', 'webm', 'ogg', 'ogv', 'avi', 'mov'].includes(ext)) {
		return "video";
	}
	
	// Audio formats  
	if (['mp3', 'wav', 'oga', 'weba', 'm4a', 'flac'].includes(ext)) {
		return "audio";
	}
	
	// Image formats
	if (['png', 'gif', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
		return "image";
	}
	
	// Default to iframe for unknown formats
	return "iframe";
}
