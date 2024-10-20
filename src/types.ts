export type MediaType = "video" | "iframe" | "audio" | "auto";

export type MediaBlockType = {
	path: string;
	type?: MediaType;
	width?: number;
	height?: number;
	aspectRatio?: number;
};