import { StackClientApp } from '@stackframe/stack';

// Neon Auth configuration
export const neonAuthConfig = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '',
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '',
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || '',
};

// Create Neon Auth client app
export const neonAuthClient = new StackClientApp({
  projectId: neonAuthConfig.projectId,
  publishableClientKey: neonAuthConfig.publishableClientKey,
});

// Export for use in components
export default neonAuthClient;
