import { RequestHandler } from "express";

// Simple in-memory storage for search history (in production, use Redis or database)
const searchHistory = new Map<string, string[]>();

interface SearchHistoryRequest {
  url: string;
  userKey: string; // IP address or session ID
}

export const saveSearchHistory: RequestHandler = async (req, res) => {
  try {
    const { url, userKey }: SearchHistoryRequest = req.body;

    if (!url || !userKey) {
      return res.status(400).json({ error: "Missing url or userKey" });
    }

    // Get existing history for this user
    const existing = searchHistory.get(userKey) || [];

    // Add new URL if not already in recent history
    if (!existing.includes(url)) {
      existing.unshift(url); // Add to beginning

      // Keep only last 10 searches
      if (existing.length > 10) {
        existing.pop();
      }

      searchHistory.set(userKey, existing);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving search history:", error);
    res.status(500).json({ error: "Failed to save search history" });
  }
};

export const getSearchHistory: RequestHandler = async (req, res) => {
  try {
    const userKey = req.query.userKey as string;

    if (!userKey) {
      return res.status(400).json({ error: "Missing userKey" });
    }

    const history = searchHistory.get(userKey) || [];
    res.json({ history });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};
