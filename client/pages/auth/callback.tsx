import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { neonAuthClient } from '../../lib/neon-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        const result = await neonAuthClient.handleCallback();
        
        if (result.user) {
          setStatus('success');
          // Redirect to dashboard after successful authentication
          setTimeout(() => {
            navigate('/business/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setError('Authentication failed');
        }
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authenticating...</CardTitle>
            <CardDescription>Please wait while we complete your authentication.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Failed</CardTitle>
            <CardDescription>There was an error during authentication.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Successful!</CardTitle>
          <CardDescription>You have been successfully authenticated.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Redirecting to dashboard...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
