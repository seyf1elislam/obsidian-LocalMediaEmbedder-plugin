export type MediaType = "video" | "iframe" | "audio" | "image" | "auto";

export type MediaBlockType = {
	path: string;
	type?: MediaType;
	width?: number;
	height?: number;
	aspectRatio?: number;
};