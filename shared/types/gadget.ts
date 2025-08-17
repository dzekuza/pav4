export type GadgetPageInfo = { hasNextPage: boolean; endCursor: string | null };
export type GadgetEdge<T> = { node: T; cursor: string };

export type GadgetEvent = {
  id: string;
  sessionId: string;
  eventType: string;
  path: string | null;
  productId?: string | null;
  variantId?: string | null;
  quantity?: number | null;
  value?: number | null;
  currency?: string | null;
  occurredAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  click?: { id: string; clickId: string; destinationUrl: string | null } | null;
  shop?: { id: string; domain: string } | null;
};

export type GadgetOrder = {
  id: string;
  orderId: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  sessionId: string;
  click?: { id: string; clickId: string; destinationUrl: string | null } | null;
  shop?: { id: string; domain: string } | null;
};

export type GadgetAggregate = {
  id: string;
  date: string;
  sessions: number;
  productViews: number;
  createdAt: string;
  updatedAt: string;
  shop?: { id: string; domain: string } | null;
};

export type GadgetClick = {
  id: string;
  clickId: string;
  destinationUrl: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  shop?: { id: string; domain: string } | null;
};

export type GadgetEventsResponse = {
  data: {
    events: {
      edges: GadgetEdge<GadgetEvent>[];
      pageInfo: GadgetPageInfo;
    };
  };
};

export type GadgetOrdersResponse = {
  data: {
    orders: {
      edges: GadgetEdge<GadgetOrder>[];
      pageInfo: GadgetPageInfo;
    };
  };
};

export type GadgetAggregatesResponse = {
  data: {
    aggregates: {
      edges: GadgetEdge<GadgetAggregate>[];
      pageInfo: GadgetPageInfo;
    };
  };
};

export type GadgetClicksResponse = {
  data: {
    clicks: {
      edges: GadgetEdge<GadgetClick>[];
      pageInfo: GadgetPageInfo;
    };
  };
};
