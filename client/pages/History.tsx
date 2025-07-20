import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { UserSearchHistoryResponse, UserSearchHistory } from "@shared/api";
import { Clock, ExternalLink, User } from "lucide-react";

export default function History() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<UserSearchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login", {
        state: { from: { pathname: "/history" } },
      });
      return;
    }

    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/search-history", {
        credentials: "include",
      });

      if (response.ok) {
        const data: UserSearchHistoryResponse = await response.json();
        setHistory(data.history);
      } else {
        setError("Failed to fetch search history");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading || loadingHistory) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <Alert className="max-w-md mx-auto">
            <User className="h-4 w-4" />
            <AlertDescription>
              Please sign in to view your search history.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Search History</h1>
            <p className="text-muted-foreground">
              Your recent product price comparisons and searches
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {history.length === 0 ? (
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  🔍
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  No search history yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your recent product searches will appear here. Start by
                  searching for any product URL to build your history.
                </p>
                <Button asChild>
                  <Link to="/">Start Searching</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(item.timestamp)}
                          </div>
                          <Badge variant="outline">
                            ID: {item.requestId.slice(0, 8)}...
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <span className="truncate max-w-md">{item.url}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button asChild size="sm">
                          <Link to={`/new-search/${item.requestId}/results`}>
                            View Results
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Original
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
