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
  userLocation?: LocationInfo; // Optional user location for local dealers
}

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city?: string;
  currency: string;
  timeZone: string;
}

export interface LocalDealer {
  name: string;
  url: string;
  country: string;
  region: string;
  searchUrlPattern: string;
  currency: string;
  priority: number;
}

export interface LocationResponse {
  location: LocationInfo;
  localDealers: LocalDealer[];
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
  isLocal?: boolean; // Whether this is a local dealer
  distance?: string; // Distance from user (for local dealers)
  assessment?: {
    cost?: number;
    value?: number;
    quality?: number;
    description?: string;
  };
}

export interface ScrapeResponse {
  originalProduct?: ProductData;
  product?: ProductData; // N8N format
  comparisons: PriceComparison[];
  // N8N webhook response format
  mainProduct?: {
    title: string;
    price: string;
    image: string;
    url: string | null;
  };
  suggestions?: Array<{
    title: string;
    standardPrice: string | null;
    discountPrice: string | null;
    site: string;
    link: string;
    image: string;
  }>;
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

/**
 * Authentication types
 */
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface UserSearchHistory {
  url: string;
  title: string;
  requestId: string;
  timestamp: Date;
}

export interface UserSearchHistoryResponse {
  history: UserSearchHistory[];
}

export interface AdminUsersResponse {
  users: Array<{
    id: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    searchCount: number;
  }>;
}
