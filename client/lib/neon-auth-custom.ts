// Custom Neon Auth implementation for Vite/React
// This replaces the Next.js-specific Stack Auth package

export interface NeonAuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NeonAuthConfig {
  projectId: string;
  publishableClientKey: string;
  secretServerKey: string;
  jwksUrl: string;
}

// Configuration - Use Vite's import.meta.env for client-side environment variables
export const neonAuthConfig: NeonAuthConfig = {
  projectId: import.meta.env.VITE_PUBLIC_STACK_PROJECT_ID || '',
  publishableClientKey: import.meta.env.VITE_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '',
  secretServerKey: import.meta.env.VITE_STACK_SECRET_SERVER_KEY || '',
  jwksUrl: import.meta.env.VITE_STACK_JWKS_URL || '',
};

// Client-side Neon Auth class
export class NeonAuthClient {
  private config: NeonAuthConfig;
  private token: string | null = null;
  private user: NeonAuthUser | null = null;

  constructor(config: NeonAuthConfig) {
    this.config = config;
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('neon_auth_token');
    }
  }

  private saveTokenToStorage(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neon_auth_token', token);
      this.token = token;
    }
  }

  private clearTokenFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('neon_auth_token');
      this.token = null;
    }
  }

  async signInWithCredentials(email: string, password: string): Promise<{ user: NeonAuthUser }> {
    try {
      const response = await fetch('/api/business/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Sign in failed');
      }

      const data = await response.json();
      this.saveTokenToStorage(data.token);
      this.user = data.user;
      
      return { user: data.user };
    } catch (error) {
      throw new Error('Sign in failed');
    }
  }

  async signUpWithCredentials(email: string, password: string, name: string): Promise<{ user: NeonAuthUser }> {
    try {
      const response = await fetch('/api/business/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Sign up failed');
      }

      const data = await response.json();
      this.saveTokenToStorage(data.token);
      this.user = data.user;
      
      return { user: data.user };
    } catch (error) {
      throw new Error('Sign up failed');
    }
  }

  async signInWithOAuth(provider: string): Promise<void> {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const authUrl = `${this.config.projectId}/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUrl)}`;
    
    window.location.href = authUrl;
  }

  async handleCallback(): Promise<{ user: NeonAuthUser }> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      const response = await fetch('/api/business/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('OAuth callback failed');
      }

      const data = await response.json();
      this.saveTokenToStorage(data.token);
      this.user = data.user;
      
      return { user: data.user };
    } catch (error) {
      throw new Error('OAuth callback failed');
    }
  }

  async getCurrentUser(): Promise<NeonAuthUser | null> {
    if (this.user) {
      return this.user;
    }

    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch('/api/business/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        this.user = user;
        return user;
      } else {
        this.clearTokenFromStorage();
        return null;
      }
    } catch (error) {
      this.clearTokenFromStorage();
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.token) {
        await fetch('/api/business/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      // Ignore errors during sign out
    } finally {
      this.clearTokenFromStorage();
      this.user = null;
    }
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export the client instance
export const neonAuthClient = new NeonAuthClient(neonAuthConfig);

export default neonAuthClient;
