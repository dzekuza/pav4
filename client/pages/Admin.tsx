import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchHeader } from "@/components/SearchHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, Search, Shield, Calendar, LogOut, ExternalLink } from "lucide-react";
import { AdminUsersResponse } from "@shared/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AffiliateManager } from "@/components/AffiliateManager";
import { Switch } from "@/components/ui/switch";

interface AdminAuthResponse {
  success: boolean;
  admin?: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUsersResponse["users"]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState<AdminAuthResponse["admin"] | null>(null);
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    checkAuth();
    fetchFilterState();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.isAdmin) {
          setAdmin(data.user);
          fetchUsers();
        } else {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    } catch (err) {
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data: AdminUsersResponse = await response.json();
        setUsers(data.users);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFilterState = async () => {
    setFilterLoading(true);
    setFilterError("");
    try {
      const res = await fetch("/api/admin/settings/suggestion-filter", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFilterEnabled(data.enabled);
      } else {
        setFilterError("Failed to fetch filter state");
      }
    } catch {
      setFilterError("Network error fetching filter state");
    } finally {
      setFilterLoading(false);
    }
  };

  const handleToggleFilter = async (checked: boolean) => {
    setFilterLoading(true);
    setFilterError("");
    try {
      const res = await fetch("/api/admin/settings/suggestion-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: checked }),
      });
      if (res.ok) {
        setFilterEnabled(checked);
      } else {
        setFilterError("Failed to update filter state");
      }
    } catch {
      setFilterError("Network error updating filter state");
    } finally {
      setFilterLoading(false);
    }
  };

  if (isLoading || loadingUsers) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <Shield className="h-4 w-4" />
            <AlertDescription>Redirecting to admin login...</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.isAdmin).length;
  const totalSearches = users.reduce((sum, u) => sum + u.searchCount, 0);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
      <SearchHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/70">Manage users and monitor system activity</p>
            {admin && (
              <p className="text-sm text-white/60 mt-1">Logged in as: {admin.email}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <Switch
                checked={!!filterEnabled}
                disabled={filterLoading || filterEnabled === null}
                onCheckedChange={handleToggleFilter}
                id="suggestion-filter-toggle"
              />
              <label htmlFor="suggestion-filter-toggle" className="text-sm text-white">
                Show only suggestions from registered businesses
              </label>
              {filterLoading && <span className="text-xs ml-2 text-white/60">Saving...</span>}
              {filterError && <span className="text-xs text-red-300 ml-2">{filterError}</span>}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Affiliate URLs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-white/70">{adminUsers} admin{adminUsers !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Searches</CardTitle>
                  <Search className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSearches}</div>
                  <p className="text-xs text-white/70">Across all users</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Avg. Searches/User</CardTitle>
                  <Calendar className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers > 0 ? Math.round(totalSearches / totalUsers) : 0}</div>
                  <p className="text-xs text-white/70">Per registered user</p>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Registered Users</CardTitle>
                <CardDescription className="text-white/80">All users registered in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-white/70 py-8">No users found</p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-white/20 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{user.email}</span>
                            {user.isAdmin && (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                          </div>
                          <div className="text-sm text-white/70">
                            Joined {new Date(user.createdAt).toLocaleDateString()} • {user.searchCount} searches
                          </div>
                        </div>
                        <div className="text-right text-sm text-white/70">ID: {user.id.toString().slice(0, 8)}...</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliate">
            <AffiliateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

