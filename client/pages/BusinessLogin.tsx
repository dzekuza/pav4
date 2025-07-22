import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { SearchHeader } from '../components/SearchHeader';
import { BusinessRegistrationWizard } from '../components/BusinessRegistrationWizard';

export default function BusinessLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/business/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Login successful!",
        });
        navigate('/business/dashboard');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to authenticate. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationWizard(false);
    toast({
      title: "Registration Successful",
      description: "Your business account has been created! You can now log in.",
    });
  };

  // Show registration wizard if requested
  if (showRegistrationWizard) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <BusinessRegistrationWizard
          onComplete={handleRegistrationComplete}
          onBack={() => setShowRegistrationWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton={false} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Business Login</CardTitle>
              <CardDescription>
                Sign in to your business account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="business@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => setShowRegistrationWizard(true)}
                  className="text-sm"
                >
                  Don't have an account? Register
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-muted-foreground hover:underline">
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 