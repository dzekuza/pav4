import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Copy, Check, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface DomainVerificationProps {
  businessId: string;
  currentDomain?: string;
}

interface VerificationStatus {
  id: number;
  domain: string;
  status: 'pending' | 'verified' | 'expired';
  verificationToken: string;
  expiresAt: string;
  verifiedAt?: string;
  createdAt: string;
}

export const DomainVerification: React.FC<DomainVerificationProps> = ({
  businessId,
  currentDomain
}) => {
  const [domain, setDomain] = useState(currentDomain || '');
  const [verificationToken, setVerificationToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Load verification status on mount
  useEffect(() => {
    loadVerificationStatus();
  }, [businessId]);

  const loadVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/domain-verification/status/${businessId}`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data.verifications);
      }
    } catch (error) {
      console.error('Failed to load verification status:', error);
    }
  };

  const generateVerificationToken = async () => {
    if (!domain) {
      toast({
        title: "Domain Required",
        description: "Please enter a domain to verify",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/domain-verification/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          domain
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationToken(data.verificationToken);
        toast({
          title: "Verification Token Generated",
          description: "Please add the TXT record to your DNS settings",
        });
        loadVerificationStatus();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate verification token",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyDomain = async () => {
    if (!verificationToken) {
      toast({
        title: "No Token",
        description: "Please generate a verification token first",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/domain-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          domain,
          verificationToken
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Domain Verified!",
          description: "Your domain has been successfully verified",
        });
        setVerificationToken('');
        loadVerificationStatus();
      } else {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify domain",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "TXT record copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isDomainVerified = verificationStatus.some(v => v.domain === domain && v.status === 'verified');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Domain Verification
          </CardTitle>
          <CardDescription>
            Verify your domain ownership to use PriceHunt tracking scripts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={generateVerificationToken}
                disabled={isGenerating || !domain}
                className="whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Token'
                )}
              </Button>
            </div>
          </div>

          {/* Verification Token */}
          {verificationToken && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add this TXT record to your DNS settings to verify domain ownership:
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">TXT Record</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`pricehunt-verification=${verificationToken}`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="font-mono text-sm bg-white p-2 rounded border">
                  pricehunt-verification={verificationToken}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">DNS Setup Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Log into your domain registrar or DNS provider</li>
                  <li>2. Add a new TXT record with the value above</li>
                  <li>3. Set TTL to 300 seconds (or default)</li>
                  <li>4. Wait 5-10 minutes for DNS propagation</li>
                  <li>5. Click "Verify Domain" below</li>
                </ol>
              </div>

              <Button
                onClick={verifyDomain}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Domain'
                )}
              </Button>
            </div>
          )}

          {/* Verification Status */}
          {verificationStatus.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Verification History</h4>
              <div className="space-y-2">
                {verificationStatus.map((verification) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{verification.domain}</div>
                      <div className="text-sm text-gray-600">
                        Created: {new Date(verification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(verification.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {isDomainVerified && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Domain verified successfully!</strong> You can now use PriceHunt tracking scripts on this domain.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
