import { RequestHandler } from "express";
import { affiliateService } from "../services/database";
import { requireAdminAuth } from "../middleware/admin-auth";

// Get all affiliate URLs
export const getAllAffiliateUrls: RequestHandler = async (req, res) => {
  try {
    const urls = await affiliateService.getAllAffiliateUrls();
    res.json({ success: true, urls });
  } catch (error) {
    console.error("Error fetching affiliate URLs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch affiliate URLs" });
  }
};

// Get affiliate statistics
export const getAffiliateStats: RequestHandler = async (req, res) => {
  try {
    const stats = await affiliateService.getAffiliateStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching affiliate stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch affiliate stats" });
  }
};

// Create new affiliate URL
export const createAffiliateUrl: RequestHandler = async (req, res) => {
  try {
    const { name, url, description, isActive } = req.body;

    if (!name || !url) {
      return res.status(400).json({ 
        success: false, 
        error: "Name and URL are required" 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid URL format" 
      });
    }

    const affiliateUrl = await affiliateService.createAffiliateUrl({
      name,
      url,
      description,
      isActive,
    });

    res.status(201).json({ 
      success: true, 
      affiliateUrl,
      message: "Affiliate URL created successfully" 
    });
  } catch (error) {
    console.error("Error creating affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to create affiliate URL" });
  }
};

// Update affiliate URL
export const updateAffiliateUrl: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, isActive } = req.body;

    if (!name || !url) {
      return res.status(400).json({ 
        success: false, 
        error: "Name and URL are required" 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid URL format" 
      });
    }

    const affiliateUrl = await affiliateService.updateAffiliateUrl(parseInt(id), {
      name,
      url,
      description,
      isActive,
    });

    res.json({ 
      success: true, 
      affiliateUrl,
      message: "Affiliate URL updated successfully" 
    });
  } catch (error) {
    console.error("Error updating affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to update affiliate URL" });
  }
};

// Delete affiliate URL
export const deleteAffiliateUrl: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await affiliateService.deleteAffiliateUrl(parseInt(id));
    
    res.json({ 
      success: true, 
      message: "Affiliate URL deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to delete affiliate URL" });
  }
};

// Track affiliate click (public endpoint)
export const trackAffiliateClick: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    await affiliateService.incrementClicks(parseInt(id));
    
    // Redirect to the affiliate URL
    const affiliateUrl = await affiliateService.getAffiliateUrlById(parseInt(id));
    if (affiliateUrl && affiliateUrl.isActive) {
      res.redirect(affiliateUrl.url);
    } else {
      res.status(404).json({ success: false, error: "Affiliate URL not found or inactive" });
    }
  } catch (error) {
    console.error("Error tracking affiliate click:", error);
    res.status(500).json({ success: false, error: "Failed to track click" });
  }
};

// Track affiliate conversion (webhook endpoint)
export const trackAffiliateConversion: RequestHandler = async (req, res) => {
  try {
    const { id, revenue = 0 } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: "Affiliate URL ID is required" 
      });
    }

    await affiliateService.addConversion(parseInt(id), parseFloat(revenue));
    
    res.json({ 
      success: true, 
      message: "Conversion tracked successfully" 
    });
  } catch (error) {
    console.error("Error tracking affiliate conversion:", error);
    res.status(500).json({ success: false, error: "Failed to track conversion" });
  }
}; 