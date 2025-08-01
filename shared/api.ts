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

export interface PriceComparison {
  title: string;
  store: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
  condition: string;
  assessment: {
    cost: number;
    value: number;
    quality: number;
    description: string;
  };
  // New fields from n8n response
  merchant?: string;
  stock?: string;
  reviewsCount?: number;
  deliveryPrice?: string;
  details?: string;
  returnPolicy?: string;
  rating?: number;
}

export interface Favorite {
  id: number;
  userId: number;
  title: string;
  price?: string;
  currency?: string;
  url: string;
  image?: string;
  store?: string;
  merchant?: string;
  stock?: string;
  rating?: number;
  reviewsCount?: number;
  deliveryPrice?: string;
  details?: string;
  returnPolicy?: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
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
    // New fields from n8n response
    merchant?: string;
    stock?: string;
    reviewsCount?: string;
    deliveryPrice?: string;
    details?: string;
    returnPolicy?: string;
    rating?: string;
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
    id: number;
    email: string;
    isAdmin: boolean;
  };
  error?: string;
}

export interface User {
  id: number;
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
    id: number;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    searchCount: number;
  }>;
}

export interface AffiliateUrl {
  id: number;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateStats {
  totalUrls: number;
  activeUrls: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
}

export interface AffiliateUrlsResponse {
  success: boolean;
  urls: AffiliateUrl[];
}

export interface AffiliateStatsResponse {
  success: boolean;
  stats: AffiliateStats;
}
