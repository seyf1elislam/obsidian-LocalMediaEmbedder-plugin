export type MediaType = "video" | "iframe" | "audio" | "auto" | "youtube";

export type MediaBlockType = {
	path: string;
	type?: MediaType;
	width?: number;
	height?: number;
	aspectRatio?: number;
};