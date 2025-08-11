import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";

interface UseAuthModalOptions {
  title?: string;
  description?: string;
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
}

export function useAuthModal(options: UseAuthModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const openModal = useCallback(() => {
    if (!isAuthenticated) {
      setIsOpen(true);
    }
  }, [isAuthenticated]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleProtectedAction = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        openModal();
      }
    },
    [isAuthenticated, openModal],
  );

  return {
    isOpen,
    openModal,
    closeModal,
    handleProtectedAction,
    modalProps: {
      isOpen,
      onClose: closeModal,
      onSuccess: options.onSuccess,
      title: options.title,
      description: options.description,
      defaultTab: options.defaultTab,
    },
  };
}
