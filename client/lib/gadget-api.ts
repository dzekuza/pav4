// Gadget API client for fetching events and analytics data
// Base configuration
const GADGET_API_URL = import.meta.env.VITE_GADGET_GRAPHQL_ENDPOINT || 'https://itrcks--development.gadget.app/api/graphql';
const GADGET_API_KEY = import.meta.env.VITE_GADGET_API_KEY || 'gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn';

// Types for events and analytics
export interface Event {
  id: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'begin_checkout' | 'checkout_completed' | 'purchase';
  occurredAt: string;
  sessionId: string;
  path: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  value?: number;
  currency?: string;
  orderId?: string;
  cartToken?: string;
  checkoutId?: string;
  ipAddress?: string;
  userAgent?: string;
  shop: {
    id: string;
    name: string;
    myshopifyDomain: string;
  };
  click?: {
    id: string;
    clickId: string;
    destinationUrl: string;
  };
  rawData?: any;
}

export interface EventsResponse {
  events: {
    edges: Array<{
      node: Event;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

export interface EventStats {
  totalEvents: number;
  eventTypeBreakdown: Record<string, number>;
  totalValue: number;
  recentEvents: number;
  rawEvents: Event[];
}

export interface Shop {
  id: string;
  name: string;
  myshopifyDomain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API client class
class GadgetAPIClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = GADGET_API_URL;
    this.apiKey = GADGET_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Gadget API key not found. Please set VITE_GADGET_API_KEY environment variable.');
    }
  }

  private async makeRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Gadget API key is required');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  // Fetch events for a specific shop
  async fetchEvents(shopId: string, options?: {
    first?: number;
    after?: string;
    eventType?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<EventsResponse> {
    const query = `
      query GetEvents(
        $shopId: GadgetID!
        $first: Int
        $after: String
        $filter: EventFilterInput
      ) {
        events(
          first: $first
          after: $after
          filter: $filter
        ) {
          edges {
            node {
              id
              eventType
              occurredAt
              sessionId
              path
              productId
              variantId
              quantity
              value
              currency
              orderId
              cartToken
              checkoutId
              ipAddress
              userAgent
              shop {
                id
                name
                myshopifyDomain
              }
              click {
                id
                clickId
                destinationUrl
              }
              rawData
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    // Build filter
    const filter: any = {
      shop: { id: { equals: shopId } }
    };

    if (options?.eventType?.length) {
      filter.eventType = { in: options.eventType };
    }

    if (options?.dateFrom || options?.dateTo) {
      filter.occurredAt = {};
      if (options.dateFrom) {
        filter.occurredAt.greaterThanOrEqual = options.dateFrom;
      }
      if (options.dateTo) {
        filter.occurredAt.lessThanOrEqual = options.dateTo;
      }
    }

    const variables = {
      shopId,
      first: options?.first || 50,
      after: options?.after,
      filter
    };

    return this.makeRequest<EventsResponse>(query, variables);
  }

  // Fetch event statistics
  async fetchEventStats(shopId: string, dateFrom?: string, dateTo?: string): Promise<EventStats> {
    const query = `
      query GetEventStats(
        $shopId: GadgetID!
        $filter: EventFilterInput
      ) {
        events(filter: $filter, first: 250) {
          edges {
            node {
              id
              eventType
              occurredAt
              value
              currency
            }
          }
        }
      }
    `;

    const filter: any = {
      shop: { id: { equals: shopId } }
    };

    if (dateFrom || dateTo) {
      filter.occurredAt = {};
      if (dateFrom) filter.occurredAt.greaterThanOrEqual = dateFrom;
      if (dateTo) filter.occurredAt.lessThanOrEqual = dateTo;
    }

    const result = await this.makeRequest<{ events: { edges: Array<{ node: Event }> } }>(query, { shopId, filter });
    const events = result.events.edges.map(edge => edge.node);

    // Calculate stats
    const totalEvents = events.length;
    const eventTypeBreakdown = events.reduce((acc: Record<string, number>, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    const totalValue = events.reduce((sum, event) => {
      return sum + (event.value || 0);
    }, 0);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentEvents = events.filter((event) => {
      return new Date(event.occurredAt) > oneDayAgo;
    }).length;

    return {
      totalEvents,
      eventTypeBreakdown,
      totalValue,
      recentEvents,
      rawEvents: events
    };
  }

  // Fetch shop information
  async fetchShop(shopId: string): Promise<Shop> {
    const query = `
      query GetShop($shopId: GadgetID!) {
        shop(id: $shopId) {
          id
          name
          myshopifyDomain
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.makeRequest<{ shop: Shop }>(query, { shopId });
    return result.shop;
  }

  // Fetch all shops
  async fetchShops(): Promise<Shop[]> {
    const query = `
      query GetShops {
        shops(first: 100) {
          edges {
            node {
              id
              name
              myshopifyDomain
              isActive
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.makeRequest<{ shops: { edges: Array<{ node: Shop }> } }>(query);
    return result.shops.edges.map(edge => edge.node);
  }

  // Fetch orders for a shop
  async fetchOrders(shopId: string, options?: {
    first?: number;
    after?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const query = `
      query GetOrders(
        $shopId: GadgetID!
        $first: Int
        $after: String
        $filter: ShopifyOrderFilterInput
      ) {
        shopifyOrders(
          first: $first
          after: $after
          filter: $filter
        ) {
          edges {
            node {
              id
              orderId
              orderNumber
              totalPrice
              currency
              createdAt
              updatedAt
              shop {
                id
                name
                myshopifyDomain
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const filter: any = {
      shop: { id: { equals: shopId } }
    };

    if (options?.dateFrom || options?.dateTo) {
      filter.createdAt = {};
      if (options.dateFrom) filter.createdAt.greaterThanOrEqual = options.dateFrom;
      if (options.dateTo) filter.createdAt.lessThanOrEqual = options.dateTo;
    }

    const variables = {
      shopId,
      first: options?.first || 50,
      after: options?.after,
      filter
    };

    return this.makeRequest(query, variables);
  }
}

// Export singleton instance
export const gadgetAPI = new GadgetAPIClient();

// Export individual functions for convenience
export const fetchEvents = (shopId: string, options?: Parameters<GadgetAPIClient['fetchEvents']>[1]) => 
  gadgetAPI.fetchEvents(shopId, options);

export const fetchEventStats = (shopId: string, dateFrom?: string, dateTo?: string) => 
  gadgetAPI.fetchEventStats(shopId, dateFrom, dateTo);

export const fetchShop = (shopId: string) => 
  gadgetAPI.fetchShop(shopId);

export const fetchShops = () => 
  gadgetAPI.fetchShops();

export const fetchOrders = (shopId: string, options?: Parameters<GadgetAPIClient['fetchOrders']>[1]) => 
  gadgetAPI.fetchOrders(shopId, options);
