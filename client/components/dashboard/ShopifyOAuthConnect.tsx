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
  Settings,
  Unlink
} from "lucide-react";

interface ShopifyOAuthStatus {
  isConnected: boolean;
  shop?: string;
  scopes?: string;
  lastConnected?: string;
  error?: string;
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
  const [popupCheckInterval, setPopupCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Check OAuth status on component mount
  useEffect(() => {
    checkOAuthStatus();
  }, []);

  // Check for URL parameters (success/error from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopifyConnected = urlParams.get('shopify_connected');
    const shopifyError = urlParams.get('shopify_error');
    const connectedShop = urlParams.get('shop');

    if (shopifyConnected && connectedShop) {
      setSuccess(`Successfully connected to ${connectedShop}!`);
      checkOAuthStatus();
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
      if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
      }
    };
  }, [popupWindow, popupCheckInterval]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'shopify-oauth-success':
            console.log('OAuth success message received:', event.data);
            setSuccess(`Successfully connected to ${event.data.shop}!`);
            checkOAuthStatus();
            break;
          
          case 'shopify-oauth-error':
            console.log('OAuth error message received:', event.data);
            setError('Failed to connect Shopify store. Please try again.');
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkOAuthStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/shopify/oauth/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        const errorData = await response.json();
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

    // Monitor popup for completion
    const checkInterval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkInterval);
          setPopupCheckInterval(null);
          setPopupWindow(null);
          
          // Check if OAuth was successful - check multiple times with delay
          setTimeout(() => checkOAuthStatus(), 1000);
          setTimeout(() => checkOAuthStatus(), 3000);
          setTimeout(() => checkOAuthStatus(), 5000);
          
          // Show success message
          setSuccess(`OAuth flow completed for ${shopDomain}. Please check the connection status below.`);
        }
      } catch (error) {
        // Popup might be on different domain, ignore errors
      }
    }, 1000);

    setPopupCheckInterval(checkInterval);

    // Show instructions
    setSuccess('OAuth popup opened! Please complete the authorization in the popup window.');
  };

  const handleShopifyLogin = () => {
    if (shop.trim()) {
      const shopifyLoginUrl = `https://${shop.trim()}/admin`;
      window.open(shopifyLoginUrl, '_blank');
      setSuccess('Shopify login opened in new tab. Please login and then try connecting again.');
    }
  };

  const handleRetryConnect = () => {
    setError(null);
    setSuccess(null);
    handleConnect();
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
        setSuccess(`Shopify store disconnected successfully${data.disconnectedShop ? ` (${data.disconnectedShop})` : ''}`);
        setStatus({ isConnected: false });
        onDisconnect?.();
      } else {
        setError('Failed to disconnect Shopify store');
      }
    } catch (error) {
      setError('Failed to disconnect Shopify store');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleForceDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/shopify/oauth/force-disconnect');

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Shopify store force disconnected successfully${data.disconnectedShop ? ` (${data.disconnectedShop})` : ''}. ${data.note || ''}`);
        setStatus({ isConnected: false });
        onDisconnect?.();
      } else {
        setError('Failed to force disconnect Shopify store');
      }
    } catch (error) {
      setError('Failed to force disconnect Shopify store');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleManualUpdate = async () => {
    if (!shop.trim()) {
      setError('Please enter your Shopify store URL first');
      return;
    }

    setSuccess(null); // Clear previous success messages
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/shopify/oauth/manual-update?shop=${encodeURIComponent(shop.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSuccess(`OAuth status updated successfully. ${data.message || ''}`);
        checkOAuthStatus(); // Refresh status after manual update
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update OAuth status');
      }
    } catch (error) {
      setError('Failed to update OAuth status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatScopes = (scopes: string) => {
    return scopes.split(',').map(scope => 
      scope.trim().replace('read_', '').replace(/_/g, ' ')
    );
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Store className="h-5 w-5" />
          Shopify Store Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              {success}
              <button
                onClick={() => setSuccess(null)}
                className="ml-2 text-green-300 hover:text-green-100 underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-red-100 underline"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Update Button for OAuth completion */}
        {success && success.includes('OAuth flow completed') && !status?.isConnected && (
          <div className="flex gap-2">
            <Button
              onClick={checkOAuthStatus}
              variant="outline"
              className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              onClick={handleManualUpdate}
              variant="outline"
              className="text-green-400 border-green-400/30 hover:bg-green-400/10"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Connected
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="ml-2 text-white">Checking connection status...</span>
          </div>
        ) : status?.isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Connected to Shopify</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Store:</span>
                <Badge variant="secondary" className="bg-white/10 text-white">
                  {status.shop}
                </Badge>
              </div>
              
              {status.scopes && (
                <div>
                  <span className="text-white/60 text-sm">Permissions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formatScopes(status.scopes).map((scope, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-white/5 text-white/80 border-white/20">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {status.lastConnected && (
                <div className="text-xs text-white/60">
                  Connected: {new Date(status.lastConnected).toLocaleDateString()}
                </div>
              )}
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Disconnect Store
            </Button>

            <Button
              onClick={handleForceDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Force Disconnect
            </Button>
          </div>
        ) : (
          /* Connect Form */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Connect Your Shopify Store
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="your-store.myshopify.com"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button
                  onClick={handleConnect}
                  disabled={!shop.trim() || isConnecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Enter your Shopify store URL to securely connect and access your data
              </p>
            </div>

            {/* Removed requiresShopifyLogin and shopifyLoginUrl handling */}

            <div className="bg-white/5 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-2">What we'll access:</h4>
              <ul className="text-xs text-white/80 space-y-1">
                <li>• Products and inventory</li>
                <li>• Orders and sales data</li>
                <li>• Customer information</li>
                <li>• Analytics and reports</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
