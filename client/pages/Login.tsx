import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/hooks/use-auth";
import { SearchHeader } from "@/components/SearchHeader";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <AuthForms onSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
}
