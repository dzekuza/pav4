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
  const [status, setStatus] = useState<ShopifyOAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleConnect = () => {
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

    // Redirect to our backend OAuth connect endpoint which will handle the Gadget redirect
    const connectUrl = `/api/shopify/oauth/connect?shop=${encodeURIComponent(shop.trim())}`;
    
    // Redirect to our backend endpoint which will then redirect to Gadget
    window.location.href = connectUrl;
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
                  disabled={!shop.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Enter your Shopify store URL to securely connect and access your data
              </p>
            </div>

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
