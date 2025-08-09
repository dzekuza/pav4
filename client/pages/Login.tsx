import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/hooks/use-auth";
import { SearchHeader } from "@/components/SearchHeader";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/history", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleAuthSuccess = () => {
    navigate("/history", { replace: true });
  };

  if (isLoading) {
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

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
      <SearchHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <AuthForms onSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
}
