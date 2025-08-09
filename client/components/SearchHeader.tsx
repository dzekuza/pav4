import { ArrowLeft, TrendingUp, User, LogOut, Shield, Building2, Heart } from "lucide-react";
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
  const { isBusiness, business, isBusinessLoading, logoutBusiness } = useBusinessAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Show loading state while checking authentication
  if (isLoading || isBusinessLoading) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
              </Link>
              {showBackButton && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
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

  // Render business navigation if logged in as business
  if (isBusiness && business) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/business/dashboard" className="flex items-center space-x-2">
                <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
              </Link>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                  Customer<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
              <Link to="/business/dashboard">
                <Button
                  variant="outline"
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90 hover:text-black px-4 sm:px-6 text-sm sm:text-base"
                >
                  Business<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
            </Link>
            {showBackButton && (
              <></>
            )}
          </div>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/">
              <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                Customer<span className="hidden sm:inline"> portal</span>
              </Button>
            </Link>
            <Link to="/business/dashboard">
              <Button
                variant="outline"
                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90 hover:text-black px-4 sm:px-6 text-sm sm:text-base"
              >
                Business<span className="hidden sm:inline"> portal</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
