import {
  ArrowLeft,
  TrendingUp,
  User,
  LogOut,
  Shield,
  Building2,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { useBusinessAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SearchHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function SearchHeader({
  showBackButton = true,
  title = "PriceHunt",
}: SearchHeaderProps) {
  const { isAuthenticated, user, logout, isAdmin, isLoading } = useAuth();
  const { isBusiness, business, isBusinessLoading, logoutBusiness } =
    useBusinessAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Show loading state while checking authentication
  if (isLoading || isBusinessLoading) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/ipicklogo.png"
                  alt="ipick.io"
                  className="h-8 w-auto"
                />
              </Link>
              {showBackButton && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    New Search
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Helper to render profile dropdown (used for both customer and business sessions)
  const ProfileDropdown = () => {
    const displayName = (business?.name || user?.email || "User") as string;
    const initials = displayName
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-0 rounded-full h-9 w-9">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-white text-black">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {isAuthenticated && isAdmin && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin">Go to Admin</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {isBusiness && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/business/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/business/dashboard/checkout/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logoutBusiness();
                  navigate("/");
                }}
              >
                Logout
              </DropdownMenuItem>
            </>
          )}
          {!isBusiness && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/favorites">Favorites</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
            </Link>
            {showBackButton && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  New Search
                </Link>
              </Button>
            )}
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated || isBusiness ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link to="/">
                  <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                    Customer<span className="hidden sm:inline"> portal</span>
                  </Button>
                </Link>
                <Link to="/business/dashboard">
                  <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                    Business<span className="hidden sm:inline"> portal</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
