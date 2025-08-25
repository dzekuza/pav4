# Dashboard Simplification and Data Persistence Fix

## Overview

This document describes the changes made to simplify the dashboard structure and
fix data persistence issues with Shopify OAuth connections.

## Changes Made

### 1. **Removed Journey Dashboard**

#### **Files Deleted:**

- `client/pages/JourneyDashboard.tsx` - Journey Dashboard component
- `client/components/DashboardSelector.tsx` - Dashboard selection component

#### **Routing Changes:**

- **Before**: `/business/dashboard` → DashboardSelector (showing two options)
- **After**: `/business/dashboard` → BusinessDashboardLayout (direct access)

#### **Removed Routes:**

```typescript
// Removed from App.tsx
{
  path: "/business/dashboard",
  element: <DashboardSelector />
},
{
  path: "/business/dashboard/checkout",
  element: <BusinessDashboardLayout />,
  children: [/* dashboard routes */]
},
{
  path: "/business/dashboard/journey",
  element: <JourneyDashboard />
}
```

#### **New Simplified Route Structure:**

```typescript
{
  path: "/business/dashboard",
  element: <BusinessDashboardLayout />,
  children: [
    { index: true, element: <BusinessDashboardHome /> },
    { path: "activity", element: <BusinessActivityDashboard /> },
    { path: "integrate", element: <BusinessIntegrateDashboard /> },
    { path: "analytics", element: <BusinessAnalyticsDashboard /> },
    { path: "products", element: <BusinessProductsDashboard /> },
    { path: "settings", element: <BusinessSettingsDashboard /> },
    { path: "attribution", element: <BusinessAttributionDashboard /> }
  ]
}
```

### 2. **Updated Navigation Paths**

#### **Components Updated:**

- `client/pages/BusinessDashboard.tsx`
- `client/components/BusinessDashboardLayout.tsx`
- `client/components/BusinessIntegrationWizard.tsx`
- `client/components/SearchHeader.tsx`
- `client/components/ui/profile-dropdown.tsx`
- `client/pages/BusinessAttributionDashboard.tsx`

#### **Path Changes:**

```typescript
// Before
"/business/dashboard/checkout/activity" → "/business/dashboard/activity"
"/business/dashboard/checkout/integrate" → "/business/dashboard/integrate"
"/business/dashboard/checkout/analytics" → "/business/dashboard/analytics"
"/business/dashboard/checkout/products" → "/business/dashboard/products"
"/business/dashboard/checkout/settings" → "/business/dashboard/settings"
"/business/dashboard/checkout/attribution" → "/business/dashboard/attribution"
```

### 3. **Fixed Shopify OAuth Data Persistence**

#### **Enhanced OAuth Status Checking (`client/components/dashboard/ShopifyOAuthConnect.tsx`)**

**Improved Status Checking:**

```typescript
// Enhanced OAuth status checking with better error handling
const checkOAuthStatus = async () => {
    try {
        setIsLoading(true);
        setError(null); // Clear any previous errors

        const response = await fetch("/api/shopify/oauth/status", {
            credentials: "include", // Ensure cookies are sent
            headers: {
                "Cache-Control": "no-cache", // Prevent caching
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("OAuth status response:", data);
            setStatus(data);

            // Clear any success messages if status is disconnected
            if (!data.isConnected) {
                setSuccess(null);
            }
        } else {
            const errorData = await response.json();
            console.error("OAuth status error response:", errorData);
            setError(errorData.error || "Failed to check OAuth status");
        }
    } catch (error) {
        console.error("Failed to check OAuth status:", error);
        setError("Failed to check OAuth status. Please try again.");
    } finally {
        setIsLoading(false);
    }
};
```

**Enhanced Component Lifecycle:**

```typescript
// Check OAuth status on component mount and when component becomes visible
useEffect(() => {
    checkOAuthStatus();

    // Also check status when the component becomes visible (for better UX)
    const handleVisibilityChange = () => {
        if (!document.hidden) {
            checkOAuthStatus();
        }
    };

    // Set up periodic status check (every 30 seconds) to keep status fresh
    const statusInterval = setInterval(() => {
        if (!document.hidden) {
            checkOAuthStatus();
        }
    }, 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );
        clearInterval(statusInterval);
    };
}, []);
```

## Benefits

### 1. **Simplified User Experience**

- **Direct Access**: Users go directly to the main dashboard without selection
  step
- **Cleaner Navigation**: Simplified URL structure
- **Reduced Complexity**: Removed unnecessary dashboard selection

### 2. **Improved Data Persistence**

- **Real-time Status**: OAuth status is checked every 30 seconds
- **Visibility-based Updates**: Status refreshes when tab becomes visible
- **Better Error Handling**: Clear error messages and logging
- **Cache Prevention**: Prevents stale data with no-cache headers

### 3. **Enhanced Reliability**

- **Automatic Recovery**: Status automatically refreshes after page reload
- **Robust Error Handling**: Graceful handling of network issues
- **Comprehensive Logging**: Better debugging capabilities

## Technical Implementation

### **OAuth Status Endpoint**

The `/api/shopify/oauth/status` endpoint returns:

```json
{
    "success": true,
    "isConnected": true,
    "shop": "store.myshopify.com",
    "scopes": "read_products,read_orders,read_customers",
    "lastConnected": "2024-01-15T10:30:00Z",
    "status": "connected",
    "webhookConfigured": true
}
```

### **Database Schema**

The business table includes Shopify fields:

```sql
shopifyAccessToken: string | null
shopifyShop: string | null
shopifyScopes: string | null
shopifyConnectedAt: Date | null
shopifyStatus: string | null
```

### **Component State Management**

- **Loading States**: Proper loading indicators during status checks
- **Error Handling**: Clear error messages for failed operations
- **Success Feedback**: Confirmation messages for successful operations
- **Auto-refresh**: Periodic status updates to keep data current

## Testing

### **Manual Testing Steps**

1. **Dashboard Access**:
   - Navigate to `/business/dashboard`
   - Should go directly to main dashboard (no selection screen)

2. **Navigation**:
   - Test all navigation buttons (Activity, Integrate, Analytics, etc.)
   - Verify URLs are simplified (no `/checkout/` in paths)

3. **OAuth Persistence**:
   - Connect a Shopify store
   - Reload the page
   - Verify connection status is maintained
   - Check that periodic status updates work

4. **Error Scenarios**:
   - Test with network issues
   - Verify error messages are clear
   - Check that status recovers automatically

### **Expected Behavior**

- **After Reload**: Shopify connection status should persist
- **Navigation**: All links should work with simplified paths
- **Status Updates**: Connection status should update automatically
- **Error Recovery**: Should handle network issues gracefully

## Future Considerations

1. **Performance**: Monitor the 30-second status check interval
2. **User Experience**: Consider adding loading states for status checks
3. **Error Handling**: Add retry mechanisms for failed status checks
4. **Caching**: Consider implementing smart caching for status data

## Rollback Plan

If issues arise, the changes can be rolled back by:

1. **Restoring Files**: Recreate `JourneyDashboard.tsx` and
   `DashboardSelector.tsx`
2. **Reverting Routes**: Restore the original routing structure in `App.tsx`
3. **Updating Navigation**: Revert all navigation path changes
4. **OAuth Component**: Revert the enhanced status checking if needed

The OAuth data persistence improvements are backward compatible and can be kept
even if other changes are rolled back.
