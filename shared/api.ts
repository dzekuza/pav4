/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Product comparison types
 */
export interface ScrapeRequest {
  url: string;
  requestId: string;
}

export interface ProductData {
  title: string;
  price: number;
  currency: string;
  image: string;
  url: string;
  store: string;
}

export interface PriceComparison extends ProductData {
  rating?: number;
  availability?: string;
  reviews?: number;
  inStock?: boolean;
  condition?: string;
  verified?: boolean;
  position?: number;
  assessment?: {
    cost?: number;
    value?: number;
    quality?: number;
    description?: string;
  };
}

export interface ScrapeResponse {
  originalProduct: ProductData;
  comparisons: PriceComparison[];
}

/**
 * Search history types
 */
export interface SearchHistoryRequest {
  url: string;
  userKey: string;
}

export interface SearchHistoryResponse {
  history: string[];
}
