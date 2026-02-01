import * as fs from "fs";
import * as path from "path";
import { Notice } from "obsidian";
import { MediaBlockType, MediaType } from "./types";
import { LocalMediaPluginSettings } from "./settings";
import { cleanPath } from "./utils";

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

export function isValidPath(filePath: string): boolean {
	const isWindowsPath = filePath.match(/^[A-Za-z]:(\\|\/)/) !== null;
	const isUnixPath = filePath.match(/^\//) !== null;
	const isLink = filePath.match(/^https?:\/\//) !== null;
	return isWindowsPath || isUnixPath || isLink;
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
            } catch {
                new Notice("Invalid regex filter: " + filterPattern);
            }
        }

        const resolvedPaths = files
            .filter(file => {
                const fullPath = path.join(baseDir, file);
                try {
                    if (fs.statSync(fullPath).isDirectory()) return false;
                } catch { return false; }

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
