import { Router } from 'express';
import { gadgetFetch } from '../gadgetClient.js';
import { GET_EVENTS, GET_ORDERS, GET_AGGREGATES, GET_CLICKS } from '../gadgetQueries.js';
import type { 
  GadgetEventsResponse, 
  GadgetOrdersResponse, 
  GadgetAggregatesResponse, 
  GadgetClicksResponse 
} from '../../shared/types/gadget.js';

const router = Router();

// Helper function to build filters
function buildEventFilter(params: any) {
  const filters: any[] = [];
  
  if (params.shopDomain) {
    filters.push({
      shop: { domain: { equals: params.shopDomain } }
    });
  }
  
  if (params.eventType) {
    filters.push({
      eventType: { in: Array.isArray(params.eventType) ? params.eventType : [params.eventType] }
    });
  }
  
  // Temporarily disable date filtering to avoid GraphQL errors
  // if (params.from || params.to) {
  //   const dateFilter: any = {};
  //   if (params.from) dateFilter.gte = `${params.from}T00:00:00Z`;
  //   if (params.to) dateFilter.lte = `${params.to}T23:59:59Z`;
  //   filters.push({ occurredAt: dateFilter });
  // }
  
  return filters.length > 0 ? filters : undefined;
}

function buildOrderFilter(params: any) {
  const filters: any[] = [];
  
  if (params.shopDomain) {
    filters.push({
      shop: { domain: { equals: params.shopDomain } }
    });
  }
  
  // Temporarily disable date filtering to avoid GraphQL errors
  // if (params.from || params.to) {
  //   const dateFilter: any = {};
  //   if (params.from) dateFilter.gte = `${params.from}T00:00:00Z`;
  //   if (params.to) dateFilter.lte = `${params.to}T23:59:59Z`;
  //   filters.push({ createdAt: dateFilter });
  // }
  
  return filters.length > 0 ? filters : undefined;
}

function buildAggregateFilter(params: any) {
  const filters: any[] = [];
  
  if (params.shopDomain) {
    filters.push({
      shop: { domain: { equals: params.shopDomain } }
    });
  }
  
  // Temporarily disable date filtering to avoid GraphQL errors
  // if (params.from || params.to) {
  //   const dateFilter: any = {};
  //   if (params.from) dateFilter.gte = params.from;
  //   if (params.to) dateFilter.lte = params.to;
  //   filters.push({ date: dateFilter });
  // }
  
  return filters.length > 0 ? filters : undefined;
}

function buildClickFilter(params: any) {
  const filters: any[] = [];
  
  if (params.shopDomain) {
    filters.push({
      shop: { domain: { equals: params.shopDomain } }
    });
  }
  
  return filters.length > 0 ? filters : undefined;
}

// GET /api/gadget/events
router.get('/events', async (req, res) => {
  try {
    const { first = 50, after, shopDomain, eventType, from, to } = req.query;
    
    const variables: any = {
      first: parseInt(first as string),
      filter: buildEventFilter({ shopDomain, eventType, from, to })
    };
    
    if (after) {
      variables.after = after;
    }
    
    const response = await gadgetFetch<GadgetEventsResponse>(GET_EVENTS, variables);
    res.json(response);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/gadget/orders
router.get('/orders', async (req, res) => {
  try {
    const { first = 50, after, shopDomain, from, to } = req.query;
    
    const variables: any = {
      first: parseInt(first as string),
      filter: buildOrderFilter({ shopDomain, from, to })
    };
    
    if (after) {
      variables.after = after;
    }
    
    const response = await gadgetFetch<GadgetOrdersResponse>(GET_ORDERS, variables);
    res.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/gadget/aggregates
router.get('/aggregates', async (req, res) => {
  try {
    const { first = 30, after, shopDomain, from, to } = req.query;
    
    const variables: any = {
      first: parseInt(first as string),
      filter: buildAggregateFilter({ shopDomain, from, to })
    };
    
    if (after) {
      variables.after = after;
    }
    
    const response = await gadgetFetch<GadgetAggregatesResponse>(GET_AGGREGATES, variables);
    res.json(response);
  } catch (error) {
    console.error('Error fetching aggregates:', error);
    res.status(500).json({ error: 'Failed to fetch aggregates' });
  }
});

// GET /api/gadget/clicks
router.get('/clicks', async (req, res) => {
  try {
    const { first = 50, after, shopDomain } = req.query;
    
    const variables: any = {
      first: parseInt(first as string),
      filter: buildClickFilter({ shopDomain })
    };
    
    if (after) {
      variables.after = after;
    }
    
    const response = await gadgetFetch<GadgetClicksResponse>(GET_CLICKS, variables);
    res.json(response);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({ error: 'Failed to fetch clicks' });
  }
});

export default router;
