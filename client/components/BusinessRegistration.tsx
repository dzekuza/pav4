import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

interface BusinessRegistrationData {
  name: string;
  website: string;
  password: string;
  confirmPassword: string;
}

export function BusinessRegistration() {
  const [formData, setFormData] = useState<BusinessRegistrationData>({
    name: '',
    website: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.website || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Business name, app URL, and password are required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return false;
    }

    // Basic URL validation
    try {
      new URL(formData.website);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://yourstore.com)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Extract domain from website URL
      const domain = new URL(formData.website).hostname;
      
      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          domain: domain,
          website: formData.website,
          email: `${domain.replace(/[^a-zA-Z0-9]/g, '')}@${domain}`, // Generate email from domain
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Registration Successful",
          description: "Your business has been registered successfully! You can now log in and complete your profile in settings.",
        });
        
        // Reset form
        setFormData({
          name: '',
          website: '',
          password: '',
          confirmPassword: '',
        });
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to register business. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-white">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Business Registration</CardTitle>
          <CardDescription className="text-white/80">
            Register your business to appear in product search suggestions. 
            You can complete your profile later in the settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Business Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., My Online Store"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-white">App URL *</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourstore.com"
                  required
                />
                <p className="text-sm text-white/70">
                  Enter your website URL where customers can purchase products
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min. 6 characters)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full bg-white text-black border border-black/10 hover:bg-white/90" 
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Business"}
            </Button>

            <div className="text-center text-sm text-white/70">
              <p>You can complete your business profile later in the settings.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 