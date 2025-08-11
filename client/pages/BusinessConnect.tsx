import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Link,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedPage {
  id: string;
  url: string;
  domain: string;
  status: "active" | "pending" | "error";
  addedAt: string;
  verifying?: boolean;
}

export default function BusinessConnect() {
  const navigate = useNavigate();
  const { business, isBusinessLoading, isBusiness } = useBusinessAuth();
  const { toast } = useToast();
  const [newPageUrl, setNewPageUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [connectedPages, setConnectedPages] = useState<ConnectedPage[]>([
    {
      id: "1",
      url: "https://example.com",
      domain: "example.com",
      status: "active",
      addedAt: "2024-01-15",
    },
  ]);

  // Redirect to business login if not authenticated
  useEffect(() => {
    if (!isBusinessLoading && !isBusiness) {
      navigate("/business-login");
    }
  }, [isBusinessLoading, isBusiness, navigate]);

  // Show loading while checking authentication
  if (isBusinessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isBusiness) {
    return null;
  }

  const handleAddPage = async () => {
    if (!newPageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(newPageUrl);
      if (!url.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      toast({
        title: "Invalid URL",
        description:
          "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    // Add page to list with pending status
    const newPage: ConnectedPage = {
      id: Date.now().toString(),
      url: newPageUrl,
      domain: new URL(newPageUrl).hostname,
      status: "pending",
      addedAt: new Date().toISOString().split("T")[0],
    };

    setConnectedPages([...connectedPages, newPage]);
    setNewPageUrl("");
    setIsAdding(false);

    toast({
      title: "Page Added",
      description:
        "The page has been added. Click 'Verify' to check if the tracking script is installed.",
    });
  };

  const verifyPage = async (pageId: string) => {
    const page = connectedPages.find((p) => p.id === pageId);
    if (!page) return;

    // Update page to show verifying state
    setConnectedPages(
      connectedPages.map((p) =>
        p.id === pageId ? { ...p, verifying: true } : p,
      ),
    );

    try {
      const response = await fetch("/api/business/verify-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageUrl: page.url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update page status to active
        setConnectedPages(
          connectedPages.map((p) =>
            p.id === pageId ? { ...p, status: "active", verifying: false } : p,
          ),
        );

        toast({
          title: "Verification Successful!",
          description: "Tracking script is properly installed on your page.",
        });
      } else {
        // Update page status to error
        setConnectedPages(
          connectedPages.map((p) =>
            p.id === pageId ? { ...p, status: "error", verifying: false } : p,
          ),
        );

        toast({
          title: "Verification Failed",
          description:
            data.error ||
            "Could not verify tracking script. Please check the installation.",
          variant: "destructive",
        });

        // Show detailed instructions if provided
        if (data.instructions) {
          console.log("Installation instructions:", data.instructions);
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setConnectedPages(
        connectedPages.map((p) =>
          p.id === pageId ? { ...p, status: "error", verifying: false } : p,
        ),
      );

      toast({
        title: "Verification Error",
        description: "Failed to verify tracking script. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removePage = (pageId: string) => {
    setConnectedPages(connectedPages.filter((page) => page.id !== pageId));
    toast({
      title: "Page Removed",
      description: "The page has been removed from your connected pages",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/business/integrate")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integration
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Pages
          </h1>
          <p className="text-gray-600">
            Add tracking to additional pages or domains
          </p>
        </div>

        {/* Add New Page */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Page
            </CardTitle>
            <CardDescription>
              Enter the URL of the page you want to connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="page-url">Page URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="page-url"
                    type="url"
                    placeholder="https://example.com"
                    value={newPageUrl}
                    onChange={(e) => setNewPageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddPage}
                    disabled={isAdding || !newPageUrl.trim()}
                  >
                    {isAdding ? "Adding..." : "Add Page"}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>• Enter the full URL including http:// or https://</p>
                <p>• The page will be verified before tracking is enabled</p>
                <p>• You can add multiple pages from the same domain</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Connected Pages
            </CardTitle>
            <CardDescription>
              Pages that are currently connected to your business account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectedPages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pages connected yet</p>
                <p className="text-sm">
                  Add your first page using the form above
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectedPages.map((page) => (
                  <div key={page.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {page.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Domain: {page.domain}</span>
                          <span>Added: {page.addedAt}</span>
                          {getStatusBadge(page.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {page.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyPage(page.id)}
                            disabled={page.verifying}
                          >
                            {page.verifying ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePage(page.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
            <CardDescription>
              Follow these steps to complete the integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Add your pages</h3>
                  <p className="text-sm text-gray-600">
                    Enter the URLs of the pages you want to track
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Install tracking script</h3>
                  <p className="text-sm text-gray-600">
                    Copy and paste the tracking script into your website's HTML
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Verify integration</h3>
                  <p className="text-sm text-gray-600">
                    Click "Verify" to check that tracking is working correctly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
