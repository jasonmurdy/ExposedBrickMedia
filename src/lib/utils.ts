import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface VideoInfo {
  type: "youtube" | "vimeo" | "direct";
  id?: string;
  embedUrl?: string;
  url: string;
}

export function parseVideoUrl(url: string): VideoInfo {
  if (!url) return { type: "direct", url: "" };

  const trimmed = url.trim();

  // YouTube checks
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtube.com/v/ID
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([^&\s?#]+)/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      id: ytMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      url: trimmed
    };
  }

  // Vimeo checks
  // Matches: vimeo.com/ID, player.vimeo.com/video/ID, vimeo.com/video/ID
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/video\/|vimeo\.com\/|player\.vimeo\.com\/video\/)([^&\s?#]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      type: "vimeo",
      id: id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      url: trimmed
    };
  }

  return {
    type: "direct",
    url: trimmed
  };
}
