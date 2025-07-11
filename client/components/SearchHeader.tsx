import { ArrowLeft, TrendingUp, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SearchHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function SearchHeader({
  showBackButton = true,
  title = "PriceHunt",
}: SearchHeaderProps) {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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

          <nav className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden md:flex"
                >
                  <Link to="/history">History</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden md:flex"
                >
                  <Link to="/favorites">Favorites</Link>
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden md:flex"
                  >
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            )}

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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/history">
                      <User className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/favorites">
                      <User className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="md:hidden">
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
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  <User className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
