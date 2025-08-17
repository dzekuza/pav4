import express from 'express';
import { requireBusinessAuth } from '../middleware/business-auth.js';

const router = express.Router();

// Helper function to fetch Shopify data
async function fetchShopifyData(endpoint: string, shopDomain: string, accessToken: string, params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, value.toString());
    }
  });
  
  const url = `https://${shopDomain}/admin/api/2024-01${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// GET /api/shopify/orders
router.get('/orders', requireBusinessAuth, async (req, res) => {
  try {
    const { shopDomain, accessToken, limit, status, created_at_min, created_at_max } = req.query;
    
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'shopDomain and accessToken are required' });
    }
    
    const params: Record<string, any> = {};
    if (limit) params.limit = limit;
    if (status) params.status = status;
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    
    const data = await fetchShopifyData('/orders.json', shopDomain as string, accessToken as string, params);
    res.json(data);
  } catch (error) {
    console.error('Shopify orders error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify orders' });
  }
});

// GET /api/shopify/products
router.get('/products', requireBusinessAuth, async (req, res) => {
  try {
    const { shopDomain, accessToken, limit, status } = req.query;
    
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'shopDomain and accessToken are required' });
    }
    
    const params: Record<string, any> = {};
    if (limit) params.limit = limit;
    if (status) params.status = status;
    
    const data = await fetchShopifyData('/products.json', shopDomain as string, accessToken as string, params);
    res.json(data);
  } catch (error) {
    console.error('Shopify products error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify products' });
  }
});

// GET /api/shopify/customers
router.get('/customers', requireBusinessAuth, async (req, res) => {
  try {
    const { shopDomain, accessToken, limit } = req.query;
    
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'shopDomain and accessToken are required' });
    }
    
    const params: Record<string, any> = {};
    if (limit) params.limit = limit;
    
    const data = await fetchShopifyData('/customers.json', shopDomain as string, accessToken as string, params);
    res.json(data);
  } catch (error) {
    console.error('Shopify customers error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify customers' });
  }
});

// GET /api/shopify/shop
router.get('/shop', requireBusinessAuth, async (req, res) => {
  try {
    const { shopDomain, accessToken } = req.query;
    
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'shopDomain and accessToken are required' });
    }
    
    const data = await fetchShopifyData('/shop.json', shopDomain as string, accessToken as string);
    res.json(data);
  } catch (error) {
    console.error('Shopify shop error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify shop info' });
  }
});

export default router;
