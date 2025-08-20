# Neon Auth Integration Guide

## **🚀 Overview**

This guide explains how to set up and use
[Neon Auth](https://neon.com/docs/neon-auth/quick-start/nextjs) for
authentication in your Vite/React application. Neon Auth provides:

- **Built-in authentication** with user data synced directly to your Neon
  database
- **OAuth providers** (Google, GitHub, etc.)
- **Secure JWT handling** with proper JWKS
- **User management** through the Neon Console
- **Row-level security** integration

## **📋 Prerequisites**

- Neon project with Neon Auth enabled
- Neon Auth credentials (Project ID, Publishable Key, Secret Key)
- JWKS URL for JWT verification

## **🔧 Setup Instructions**

### **Step 1: Enable Neon Auth in Your Project**

1. Go to your [Neon Console](https://console.neon.tech)
2. Navigate to your project
3. Go to the **Auth** section
4. Click **Enable Neon Auth**
5. Copy your credentials from the **Configuration** tab

### **Step 2: Add Environment Variables**

Run the setup script to add Neon Auth variables to your `.env` file:

```bash
node scripts/add-neon-auth-credentials.js
```

Then update the following variables in your `.env` file:

```env
# Neon Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=e6af4e47-d93c-4846-adc8-0e8c2334e5b7
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_actual_publishable_key
STACK_SECRET_SERVER_KEY=your_actual_secret_key
STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/e6af4e47-d93c-4846-adc8-0e8c2334e5b7/.well-known/jwks.json
```

### **Step 3: Database Migration**

The database schema has been updated to include Neon Auth integration:

```sql
-- Added to businesses table
ALTER TABLE businesses ADD COLUMN neonUserId TEXT UNIQUE;
```

Run the migration:

```bash
npx prisma migrate dev --name add_neon_auth_integration
```

## **🏗️ Architecture**

### **Frontend Components**

- **`NeonAuthProvider`**: Context provider for authentication state
- **`NeonSignInForm`**: Sign-in form with email/password and OAuth
- **`NeonSignUpForm`**: Sign-up form with email/password and OAuth
- **`AuthCallback`**: Handles OAuth redirects

### **Backend Middleware**

- **`requireNeonAuth`**: Verifies Neon Auth tokens
- **`requireBusinessAccount`**: Links Neon Auth users to business accounts

### **Database Integration**

- **`findBusinessByNeonUserId`**: Find business by Neon Auth user ID
- **`createBusinessFromNeonUser`**: Create business account from Neon Auth user

## **🔐 Authentication Flow**

### **1. User Registration/Sign-in**

```typescript
// Using Neon Auth forms
import {
    NeonSignInForm,
    NeonSignUpForm,
} from "@/components/auth/NeonAuthForms";

// Or programmatically
const { signIn, signUp, signInWithOAuth } = useNeonAuth();

// Email/password
await signIn(email, password);

// OAuth
await signInWithOAuth("google");
```

### **2. Token Verification**

```typescript
// Backend middleware automatically verifies tokens
router.get("/protected", requireNeonAuth, (req, res) => {
    // req.user contains the authenticated user
    // req.userId contains the user ID
});
```

### **3. Business Account Linking**

```typescript
// Automatically links Neon Auth users to business accounts
router.get("/business", requireNeonAuth, requireBusinessAccount, (req, res) => {
    // req.business contains the linked business account
    // req.businessId contains the business ID
});
```

## **🛠️ Usage Examples**

### **Frontend Authentication**

```typescript
import { useNeonAuth } from "@/components/auth/NeonAuthProvider";

function MyComponent() {
    const { user, isLoading, signIn, signOut } = useNeonAuth();

    if (isLoading) return <div>Loading...</div>;

    if (!user) {
        return <NeonSignInForm onSuccess={() => console.log("Signed in!")} />;
    }

    return (
        <div>
            <p>Welcome, {user.name}!</p>
            <button onClick={signOut}>Sign Out</button>
        </div>
    );
}
```

### **Protected API Routes**

```typescript
// Backend route with Neon Auth
router.get("/api/protected", requireNeonAuth, (req, res) => {
    res.json({
        message: "Protected data",
        user: req.user,
    });
});

// Backend route with business account
router.get(
    "/api/business",
    requireNeonAuth,
    requireBusinessAccount,
    (req, res) => {
        res.json({
            message: "Business data",
            business: req.business,
        });
    },
);
```

### **Shopify OAuth Integration**

The Shopify OAuth flow now uses Neon Auth:

```typescript
// OAuth endpoints require Neon Auth authentication
router.get(
    "/api/shopify/oauth/connect",
    requireNeonAuth,
    requireBusinessAccount,
    async (req, res) => {
        // req.user contains Neon Auth user
        // req.business contains linked business account
        // Proceed with Shopify OAuth...
    },
);
```

## **🧪 Testing**

### **Test Neon Auth Integration**

```bash
node scripts/test-neon-auth-integration.js
```

### **Test Popup OAuth Flow**

```bash
node scripts/test-popup-oauth-flow.js
```

### **Manual Testing**

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:8083`
3. Try signing in with Neon Auth
4. Test the Shopify OAuth popup flow

## **🔍 Troubleshooting**

### **Common Issues**

1. **"Authentication required" error**
   - Check if Neon Auth environment variables are set
   - Verify the user is signed in

2. **"Business account not found" error**
   - The system automatically creates business accounts for new users
   - Check database connection

3. **OAuth callback errors**
   - Verify callback URL is configured in Neon Auth
   - Check if the AuthCallback component is properly set up

### **Debug Commands**

```bash
# Check environment variables
node scripts/setup-neon-auth-env.js

# Test server status
node scripts/test-neon-auth-integration.js

# Check database connection
npx prisma studio
```

## **🔗 Useful Links**

- [Neon Auth Documentation](https://neon.com/docs/neon-auth/quick-start/nextjs)
- [Neon Console](https://console.neon.tech)
- [Stack Auth API Reference](https://docs.stack-auth.com)

## **🎯 Benefits**

### **Before Neon Auth**

- ❌ Custom JWT implementation
- ❌ Manual user management
- ❌ Complex authentication logic
- ❌ Security vulnerabilities

### **After Neon Auth**

- ✅ Built-in secure authentication
- ✅ Automatic user management
- ✅ OAuth provider support
- ✅ Row-level security
- ✅ User data synced to database
- ✅ Professional authentication UI

## **🚀 Next Steps**

1. **Complete Setup**: Add your actual Neon Auth keys to `.env`
2. **Test Authentication**: Try signing in with email/password and OAuth
3. **Test Shopify Integration**: Verify the popup OAuth flow works
4. **Customize UI**: Style the authentication forms to match your design
5. **Add OAuth Providers**: Configure Google, GitHub, etc. in Neon Console

---

**Need Help?** Check the troubleshooting section or refer to the
[Neon Auth documentation](https://neon.com/docs/neon-auth/quick-start/nextjs).
