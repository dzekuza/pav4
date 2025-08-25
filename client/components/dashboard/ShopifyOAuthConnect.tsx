import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Loader2,
  Unlink,
  RefreshCw
} from "lucide-react";

interface ShopifyOAuthStatus {
  isConnected: boolean;
  shop?: string;
  scopes?: string;
  lastConnected?: string;
  status?: string;
  webhookConfigured?: boolean;
}

interface ShopifyOAuthConnectProps {
  onConnect?: (shop: string) => void;
  onDisconnect?: () => void;
}

export function ShopifyOAuthConnect({ onConnect, onDisconnect }: ShopifyOAuthConnectProps) {
  const [shop, setShop] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<ShopifyOAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Check OAuth status on component mount and when component becomes visible
  useEffect(() => {
    checkOAuthStatus();
    
    // Check status when the component becomes visible (but only if not already connected)
    const handleVisibilityChange = () => {
      if (!document.hidden && (!status?.isConnected)) {
        checkOAuthStatus();
      }
    };
    
    // Set up periodic status check (every 60 seconds) only if not connected
    const statusInterval = setInterval(() => {
      if (!document.hidden && (!status?.isConnected)) {
        checkOAuthStatus();
      }
    }, 60000); // Changed from 10 seconds to 60 seconds
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(statusInterval);
    };
  }, [status?.isConnected]); // Add dependency to stop checking when connected

  // Check for URL parameters (success/error from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopifyConnected = urlParams.get('shopify_connected');
    const shopifyError = urlParams.get('shopify_error');
    const connectedShop = urlParams.get('shop');

    if (shopifyConnected && connectedShop) {
      setSuccess(`Successfully connected to ${connectedShop}!`);
      // Force immediate status check (only once)
      setTimeout(() => checkOAuthStatus(), 2000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (shopifyError) {
      setError('Failed to connect Shopify store. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Cleanup popup on component unmount
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, [popupWindow]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'SHOPIFY_OAUTH_SUCCESS':
            console.log('OAuth success message received:', event.data);
            setSuccess(`Successfully connected to ${event.data.shop}!`);
            // Force immediate status check (only once)
            setTimeout(() => checkOAuthStatus(), 2000);
            // Close popup if it's still open
            if (popupWindow && !popupWindow.closed) {
              popupWindow.close();
            }
            setPopupWindow(null);
            break;
          
          case 'SHOPIFY_OAUTH_ERROR':
            console.log('OAuth error message received:', event.data);
            setError(`Failed to connect Shopify store: ${event.data.error || 'Unknown error'}`);
            // Close popup if it's still open
            if (popupWindow && !popupWindow.closed) {
              popupWindow.close();
            }
            setPopupWindow(null);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [popupWindow]);

  const checkOAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await fetch('/api/shopify/oauth/status', {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Cache-Control': 'no-cache', // Prevent caching
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('OAuth status response:', data);
        setStatus(data);
        
        // Clear any success messages if status is disconnected
        if (!data.isConnected) {
          setSuccess(null);
        } else {
          // If connected, clear any error messages
          setError(null);
        }
      } else {
        const errorData = await response.json();
        console.error('OAuth status error response:', errorData);
        setError(errorData.error || 'Failed to check OAuth status');
      }
    } catch (error) {
      console.error('Failed to check OAuth status:', error);
      setError('Failed to check OAuth status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!shop.trim()) {
      setError('Please enter your Shopify store URL');
      return;
    }

    // Validate shop format
    const shopPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopPattern.test(shop.trim())) {
      setError('Please enter a valid Shopify store URL (e.g., your-store.myshopify.com)');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      // Get the OAuth URL from our backend
      const response = await fetch(`/api/shopify/oauth/connect?shop=${encodeURIComponent(shop.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.redirectUrl) {
          // Open popup window with OAuth URL
          openOAuthPopup(data.redirectUrl, shop.trim());
        } else {
          throw new Error('No redirect URL received');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start OAuth flow');
      }

    } catch (error) {
      console.error('Failed to start OAuth:', error);
      setError(error instanceof Error ? error.message : 'Failed to start OAuth flow. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const openOAuthPopup = (oauthUrl: string, shopDomain: string) => {
    // Close any existing popup
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }

    // Calculate popup dimensions
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open popup window
    const popup = window.open(
      oauthUrl,
      'shopify-oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      setError('Popup blocked! Please allow popups for this site and try again.');
      return;
    }

    setPopupWindow(popup);
    setSuccess('OAuth popup opened! Please complete the authorization in the popup window.');
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/shopify/oauth/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Shopify store disconnected successfully${data.previousShop ? ` (${data.previousShop})` : ''}`);
        setStatus({ isConnected: false });
        onDisconnect?.();
      } else {
        setError('Failed to disconnect Shopify store');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setError('Failed to disconnect Shopify store. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRetryConnect = () => {
    setError(null);
    setSuccess(null);
    handleConnect();
  };

  // Auto-fill shop if we have a connected store
  useEffect(() => {
    if (status?.shop && !shop) {
      setShop(status.shop);
    }
  }, [status?.shop, shop]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Shopify Store Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            {status.isConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-700">Connected to {status.shop}</p>
                  {status.lastConnected && (
                    <p className="text-sm text-gray-600">
                      Connected: {new Date(status.lastConnected).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="text-red-600 hover:text-red-700"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Not Connected</p>
                  <p className="text-sm text-gray-600">Connect your Shopify store to start tracking</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Connection Form */}
        {(!status?.isConnected || !status) && (
          <div className="space-y-4">
            <div>
              <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Store URL
              </label>
              <Input
                id="shop"
                type="text"
                placeholder="your-store.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Shopify store URL (e.g., your-store.myshopify.com)
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !shop.trim()}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 mr-2" />
                  Connect Shopify Store
                </>
              )}
            </Button>
          </div>
        )}

        {/* Permissions Info */}
        {(!status?.isConnected || !status) && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What we'll access:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Products and inventory</li>
              <li>• Orders and sales data</li>
              <li>• Customer information</li>
              <li>• Analytics and reports</li>
            </ul>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryConnect}
              className="mt-2"
            >
              Try Again
            </Button>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Checking connection status...</span>
          </div>
        )}

        {/* Manual Refresh Button */}
        {status && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={checkOAuthStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
