import { API_URL } from "../config/api";

/**
 * Resolve food image URLs returned by the API.
 * Absolute URLs and data/blob URLs are kept unchanged; server-relative paths
 * are resolved against the backend rather than the frontend website origin.
 */
export function resolveFoodImage(image) {
  if (typeof image !== "string" || !image.trim()) return "";
  const value = image.trim();

  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) return `${window.location.protocol}${value}`;

  return `${API_URL}/${value.replace(/^\/+/, "")}`;
}
