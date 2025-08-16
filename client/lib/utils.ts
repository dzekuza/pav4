import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to get the appropriate redirect URL for business domains
export function getRedirectUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");

    // Use the redirect API which will handle business domains automatically
    return `/api/redirect?to=${encodeURIComponent(url)}`;
  } catch {
    // If URL parsing fails, fall back to the redirect API
    return `/api/redirect?to=${encodeURIComponent(url)}`;
  }
}
