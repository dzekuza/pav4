import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

interface BusinessRegistrationData {
  name: string;
  domain: string;
  website: string;
  email: string;
  password: string;
  confirmPassword: string;
  description: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  category: string;
  commission: string;
}

export function BusinessRegistration() {
  const [formData, setFormData] = useState<BusinessRegistrationData>({
    name: '',
    domain: '',
    website: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    logo: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    country: '',
    category: '',
    commission: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.domain || !formData.website || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Name, domain, website, email, and password are required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
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

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(formData.domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain name (e.g., amazon.com)",
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
      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain,
          website: formData.website,
          email: formData.email,
          password: formData.password,
          description: formData.description,
          logo: formData.logo,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          address: formData.address,
          country: formData.country,
          category: formData.category,
          commission: formData.commission ? parseFloat(formData.commission) : 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Registration Successful",
          description: "Your business has been registered successfully! You can now log in with your email and password.",
        });
        
        // Reset form
        setFormData({
          name: '',
          domain: '',
          website: '',
          email: '',
          password: '',
          confirmPassword: '',
          description: '',
          logo: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          country: '',
          category: '',
          commission: '',
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
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Registration</CardTitle>
          <CardDescription>
            Register your business to appear in product search suggestions. 
            You'll need to provide login credentials to access your business dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Amazon"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    placeholder="e.g., amazon.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL *</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="e.g., https://amazon.com"
                  required
                />
              </div>
            </div>

            {/* Login Credentials Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
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

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of your business..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Electronics, Fashion"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Business address..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g., United States"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Rate (%)</Label>
                  <Input
                    id="commission"
                    name="commission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission}
                    onChange={handleInputChange}
                    placeholder="5.0"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 