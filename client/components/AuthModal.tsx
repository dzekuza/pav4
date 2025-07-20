import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForms } from "./AuthForms";
import { useAuth } from "@/hooks/use-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  defaultTab?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Authentication Required",
  description = "Please sign in or create an account to continue",
  defaultTab = "login",
}: AuthModalProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async () => {
    setIsLoading(true);
    // Small delay to ensure auth state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsLoading(false);
    onSuccess?.();
    onClose();
  };

  // Close modal if user becomes authenticated
  if (isAuthenticated && isOpen) {
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AuthForms
            onSuccess={handleSuccess}
            defaultTab={defaultTab}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 