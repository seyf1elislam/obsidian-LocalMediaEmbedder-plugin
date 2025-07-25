import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { LocalMediaPluginSettings } from "./settings";

export class MediaServer {
	private server: http.Server | null = null;
	private port: number;
	private settings: LocalMediaPluginSettings;

	constructor(port: number, settings: LocalMediaPluginSettings) {
		this.port = port;
		this.settings = settings;
	}

	startServer() {
		this.server = http.createServer((req, res) => {
			const urlParams = new URLSearchParams(req.url?.split("?")[1] || "");
			const filePath = urlParams.get("q");

			if (!filePath) {
				res.writeHead(400, { "Content-Type": "text/plain" });
				res.end("File path not specified");
				return;
			}

			// Security: Validate and sanitize the file path
			if (!this.isValidMediaFile(filePath)) {
				res.writeHead(403, { "Content-Type": "text/plain" });
				res.end("Access denied: Invalid file path or unsupported file type");
				return;
			}

			const fullPath = path.resolve(filePath);

			// Additional security check: prevent directory traversal
			if (!this.isPathSafe(fullPath)) {
				res.writeHead(403, { "Content-Type": "text/plain" });
				res.end("Access denied: Path traversal detected");
				return;
			}

			if (!fs.existsSync(fullPath)) {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("File not found");
				return;
			}

			try {
				const stat = fs.statSync(fullPath);
				if (!stat.isFile()) {
					res.writeHead(403, { "Content-Type": "text/plain" });
					res.end("Access denied: Not a file");
					return;
				}

				const fileSize = stat.size;
				const ext = (fullPath.split(".").pop() || "mp4").toLowerCase();
				const contentType = this.getContentType(ext);

				if (!contentType) {
					res.writeHead(415, { "Content-Type": "text/plain" });
					res.end("Unsupported media type");
					return;
				}

				const head: http.OutgoingHttpHeaders = {
					"Content-Length": fileSize,
					"Content-Type": contentType,
				};

				// Add caching headers if enabled
				if (this.settings.enableCaching) {
					head["Cache-Control"] = "private, max-age=3600"; // 1 hour cache
					head["ETag"] = `"${stat.mtime.getTime()}-${fileSize}"`;
				}
				res.writeHead(200, head);
				fs.createReadStream(fullPath).pipe(res);
			} catch (error) {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end(`Server error: ${error.message}`);
			}
		});

		this.server.listen(this.port, "127.0.0.1", () => {
			// Listen only on localhost for security
			// console.log(`Media server running on port ${this.port}`);
		});
	}

	stopServer() {
		if (this.server) {
			this.server.close();
			this.server = null;
		}
	}

	private isValidMediaFile(filePath: string): boolean {
		// Check if the file has a valid media extension
		const ext = path.extname(filePath).toLowerCase();
		const validExtensions = [
			'.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg',
			'.mp4', '.webm', '.ogg', '.ogv', '.avi', '.mov',
			'.mp3', '.wav', '.oga', '.weba', '.m4a', '.flac'
		];
		return validExtensions.includes(ext);
	}

	private isPathSafe(fullPath: string): boolean {
		// Basic check to prevent obvious directory traversal attempts
		const normalizedPath = path.normalize(fullPath);
		return !normalizedPath.includes('..');
	}

	private getContentType(ext: string): string | null {
		const supportedTypes: { [key: string]: string } = {
			// Images
			png: "image/png",
			gif: "image/gif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			webp: "image/webp",
			svg: "image/svg+xml",

			// Videos
			mp4: "video/mp4",
			webm: "video/webm",
			ogg: "video/ogg",
			ogv: "video/ogg",
			avi: "video/x-msvideo",
			mov: "video/quicktime",
			
			// Audio
			oga: "audio/ogg",
			mp3: "audio/mpeg",
			wav: "audio/wav",
			weba: "audio/webm",
			m4a: "audio/mp4",
			flac: "audio/flac",
		};

		return supportedTypes[ext] || null;
	}
}
