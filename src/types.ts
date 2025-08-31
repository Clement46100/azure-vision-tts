export type VisionCaption = {
text: string;
confidence?: number;
};


export type VisionResult = {
caption?: VisionCaption;
tags?: { name: string; confidence?: number }[];
objects?: { name: string; confidence?: number }[];
raw?: unknown;
};