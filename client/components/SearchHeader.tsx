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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                  {title}
                </span>
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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/business/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                  {business.name}
                </span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/business/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/business-activity">Activity</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/business-integrate">Integrate</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logoutBusiness}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                {title}
              </span>
            </Link>
            {showBackButton && (
              <></>
            )}
          </div>

          <nav className="flex items-center space-x-4">
            {/* Business Links - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex"
            >
              <Link to="/business/register">
                <Building2 className="mr-2 h-4 w-4" />
                Register Business
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex"
            >
              <Link to="/business-login">
                <Building2 className="mr-2 h-4 w-4" />
                Business Login
              </Link>
            </Button>

            {/* Show navigation links only when authenticated */}
            {isAuthenticated && (
              <></>
            )}

            {/* User Profile Dropdown or Sign In Button */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="text-sm font-medium">{user?.email}</p>
                      {isAdmin && (
                        <p className="text-xs text-muted-foreground">
                          Administrator
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Business page */}
                  <DropdownMenuItem asChild>
                    <Link to="/business-login">
                      <Building2 className="mr-2 h-4 w-4" />
                      Business page
                    </Link>
                  </DropdownMenuItem>
                  {/* History */}
                  <DropdownMenuItem asChild>
                    <Link to="/history">
                      <User className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  {/* Favorites with heart icon */}
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="relative flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                      {favorites.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
                        >
                          {favorites.length > 99 ? '99+' : favorites.length}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  {/* Admin */}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log("Sign in button clicked, navigating to /login");
                  window.location.href = "/login";
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
