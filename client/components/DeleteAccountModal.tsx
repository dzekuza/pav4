import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  businessName,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: 'Please type "DELETE" to confirm account deletion.',
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/business/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your business account and all associated data have been permanently deleted.",
        });
        onClose();
        navigate("/business-login");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword("");
      setConfirmText("");
      setShowPassword(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-white/10 bg-white/5 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Business Account
          </DialogTitle>
          <DialogDescription className="text-left text-white/80">
            This action cannot be undone. This will permanently delete your business account and all associated data including:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>All business profile information</li>
                <li>Tracking data and analytics</li>
                <li>Commission and sales records</li>
                <li>Domain verifications</li>
                <li>Webhook configurations</li>
                <li>All associated user activity</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Confirm Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isDeleting}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/60"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isDeleting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-white">
              Type "DELETE" to confirm
            </Label>
            <Input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !password || confirmText !== "DELETE"}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
