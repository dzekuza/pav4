import { RequestHandler } from "express";
import { legacySearchHistoryService } from "../services/database";

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

    // Add to legacy search history
    await legacySearchHistoryService.addSearch(userKey, url);

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

    const historyRecords =
      await legacySearchHistoryService.getUserSearchHistory(userKey, 10);
    const history = historyRecords.map((record) => record.url);

    res.json({ history });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};
