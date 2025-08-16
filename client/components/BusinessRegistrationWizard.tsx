import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Mail,
  Lock,
  Globe,
  Phone,
  MapPin,
  Tag,
} from "lucide-react";

interface BusinessRegistrationData {
  // Step 1: Authentication
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Business Information
  name: string;
  domain: string;
  website: string;
  description: string;
  logo: string;
  category: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

interface BusinessRegistrationWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

export function BusinessRegistrationWizard({
  onComplete,
  onBack,
}: BusinessRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessRegistrationData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    domain: "",
    website: "",
    description: "",
    logo: "",
    category: "",
    country: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-generate website URL from domain
  useEffect(() => {
    if (formData.domain) {
      const cleanDomain = formData.domain.trim().toLowerCase();
      if (cleanDomain) {
        // Ensure the domain has a protocol
        let websiteUrl = cleanDomain;
        if (
          !websiteUrl.startsWith("http://") &&
          !websiteUrl.startsWith("https://")
        ) {
          websiteUrl = `https://${websiteUrl}`;
        }
        setFormData((prev) => ({ ...prev, website: websiteUrl }));
      }
    }
  }, [formData.domain]);

  const updateFormData = (
    field: keyof BusinessRegistrationData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return false;
    }

    // Check for password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must contain uppercase, lowercase, and number",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.name || !formData.domain || !formData.website) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    // Basic domain validation
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(formData.domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., example.com)",
        variant: "destructive",
      });
      return false;
    }

    // Website URL validation
    try {
      new URL(formData.website);
    } catch {
      toast({
        title: "Invalid Website URL",
        description:
          "Please enter a valid website URL (e.g., https://example.com)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/business/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          domain: formData.domain,
          website: formData.website,
          description: formData.description,
          category: formData.category,
          country: formData.country,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          address: formData.address,
        }),
      });

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description:
            "Your business account has been created successfully! Redirecting to dashboard...",
        });

        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/business/dashboard");
        }, 1500);
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to register business",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports & Outdoors",
    "Books & Media",
    "Health & Beauty",
    "Automotive",
    "Food & Beverage",
    "Toys & Games",
    "Other",
  ];

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Australia",
    "Japan",
    "Other",
  ];

  return (
    <div className="relative max-w-2xl mx-auto p-6 text-white">
      <img
        src="/pagebg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100 rounded-2xl"
      />
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={currentStep >= 1 ? "default" : "secondary"}
              className="bg-white text-black border-0"
            >
              1
            </Badge>
            <span
              className={currentStep >= 1 ? "font-medium" : "text-white/70"}
            >
              Account Setup
            </span>
          </div>
          <div className="flex-1 mx-4 h-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <Badge
              variant={currentStep >= 2 ? "default" : "secondary"}
              className="bg-white text-black border-0"
            >
              2
            </Badge>
            <span
              className={currentStep >= 2 ? "font-medium" : "text-white/70"}
            >
              Business Information
            </span>
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5" />
            {currentStep === 1
              ? "Create Business Account"
              : "Business Information"}
          </CardTitle>
          <CardDescription className="text-white/80">
            {currentStep === 1
              ? "Step 1: Set up your business account credentials"
              : "Step 2: Provide your business details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 ? (
            // Step 1: Account Setup
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="business@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateFormData("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          ) : (
            // Step 2: Business Information
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Amazon, Best Buy, Walmart"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  placeholder="amazon.com, bestbuy.com, walmart.com"
                />
              </div>
              <div>
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL (Auto-generated)
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  readOnly
                  className="cursor-not-allowed"
                  placeholder="https://yourdomain.com"
                />
                <p className="text-xs text-white/70 mt-1">
                  Website URL is automatically generated from your domain
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your business and what you offer..."
                />
              </div>
              <div>
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="https://yourdomain.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/80 text-white">
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Toys">Toys</SelectItem>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Baby & Kids">Baby & Kids</SelectItem>
                    <SelectItem value="Pet Supplies">Pet Supplies</SelectItem>
                    <SelectItem value="Office & Business">
                      Office & Business
                    </SelectItem>
                    <SelectItem value="Jewelry & Watches">
                      Jewelry & Watches
                    </SelectItem>
                    <SelectItem value="Tools & Hardware">
                      Tools & Hardware
                    </SelectItem>
                    <SelectItem value="Music & Instruments">
                      Music & Instruments
                    </SelectItem>
                    <SelectItem value="Art & Crafts">Art & Crafts</SelectItem>
                    <SelectItem value="Garden & Outdoor">
                      Garden & Outdoor
                    </SelectItem>
                    <SelectItem value="Kitchen & Dining">
                      Kitchen & Dining
                    </SelectItem>
                    <SelectItem value="Bath & Personal Care">
                      Bath & Personal Care
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/80 text-white">
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                    <SelectItem value="Poland">Poland</SelectItem>
                    <SelectItem value="Czech Republic">
                      Czech Republic
                    </SelectItem>
                    <SelectItem value="Hungary">Hungary</SelectItem>
                    <SelectItem value="Slovakia">Slovakia</SelectItem>
                    <SelectItem value="Slovenia">Slovenia</SelectItem>
                    <SelectItem value="Croatia">Croatia</SelectItem>
                    <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                    <SelectItem value="Romania">Romania</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="Malta">Malta</SelectItem>
                    <SelectItem value="Cyprus">Cyprus</SelectItem>
                    <SelectItem value="Estonia">Estonia</SelectItem>
                    <SelectItem value="Latvia">Latvia</SelectItem>
                    <SelectItem value="Lithuania">Lithuania</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="contact@yourdomain.com"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter your business address..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep === 1 ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                >
                  Back to Login
                </Button>
              ) : (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep === 1 ? (
                <Button
                  onClick={handleNext}
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                >
                  {isLoading
                    ? "Creating Account..."
                    : "Create Business Account"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
