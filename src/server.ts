import * as http from "http";
import * as fs from "fs";

export class MediaServer {
	private server: http.Server | null = null;
	private port: number;

	constructor(port: number) {
		this.port = port;
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

			const fullPath = filePath;

			if (!fs.existsSync(fullPath)) {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("File not found");
				return;
			}

			const stat = fs.statSync(fullPath);
			const fileSize = stat.size;

			const ext = (fullPath.split(".").pop() || "mp4").toLowerCase(); // Normalize and ensure default

			const supportedTypes: { [key: string]: string } = {
				png: "image/png",
				gif: "image/gif",
				jpg: "image/jpeg",
				jpeg: "image/jpeg",

				mp4: "video/mp4",
				webm: "video/webm",
				ogg: "video/ogg",
				// ogg: 'audio/ogg',
				ogv: "video/ogg",
				
				oga: "audio/ogg",
				mp3: 'audio/mpeg',
				wav: 'audio/wav',
				weba: 'audio/webm',
			};

			const head = {
				"Content-Length": fileSize,
				"Content-Type": supportedTypes[ext] || "plain/text",
			};
			res.writeHead(200, head);
			fs.createReadStream(fullPath).pipe(res);
		});

		this.server.listen(this.port, "0.0.0.0", () => {
			// console.log(`Video server running on port ${this.port}`);
		});
	}

	stopServer() {
		if (this.server) {
			this.server.close();
			this.server = null;
		}
	}
}
