import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordFormProps {
  userType?: "customer" | "business";
  onBack?: () => void;
}

export function ResetPasswordForm({
  userType = "business",
  onBack,
}: ResetPasswordFormProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(
        "Invalid or missing reset token. Please request a new password reset.",
      );
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength)
      errors.push(`At least ${minLength} characters`);
    if (!hasUpperCase) errors.push("One uppercase letter");
    if (!hasLowerCase) errors.push("One lowercase letter");
    if (!hasNumbers) errors.push("One number");
    if (!hasSpecialChar) errors.push("One special character");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain: ${passwordErrors.join(", ")}`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint =
        userType === "business"
          ? "/api/business/auth/reset-password"
          : "/api/business/auth/reset-password";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast({
          title: "Password Reset Successful",
          description:
            "Your password has been reset successfully. You can now log in with your new password.",
        });
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(userType === "business" ? "/business-login" : "/login");
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto border-white/10 bg-white/5 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-white flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-400" />
            Password Reset
          </CardTitle>
          <CardDescription className="text-center text-white/80">
            Your password has been successfully reset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-500/20 bg-green-500/10 text-green-300">
            <AlertDescription>
              You can now log in with your new password. For security reasons,
              please log out of all other devices.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleBackToLogin}
            className="w-full rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            Continue to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto border-white/10 bg-white/5 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-white">
            Invalid Reset Link
          </CardTitle>
          <CardDescription className="text-center text-white/80">
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Please request a new password reset link from the login page.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleBackToLogin}
            className="w-full rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-white/10 bg-white/5 text-white">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-white">
          Reset Password
        </CardTitle>
        <CardDescription className="text-center text-white/80">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-white/60 leading-none select-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-white/60">
              Password must be at least 8 characters with uppercase, lowercase,
              number, and special character.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-white/60 leading-none select-none" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
