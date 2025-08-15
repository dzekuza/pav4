# Gadget Authorization System Update

## Overview

This document outlines the migration from domain-based matching to Gadget's
built-in authorization system for the Shopify app. The update implements proper
role-based access control (RBAC) and session-based tenancy.

## Changes Made

### 1. Access Control Filters

**Created missing filter:**

- `checkoutdata/accessControl/filters/shopify/businessReferral.gelly` -
  Implements tenancy filtering for businessReferral model

**Updated permissions:**

- Added `businessReferral` model to `shopify-app-users` role in
  `permissions.gadget.ts`
- All custom models now have proper tenancy filters

### 2. Action Updates

**Updated actions to use session-based authorization:**

#### `trackReferral.ts`

- Added session parameter to action signature
- For authenticated Shopify merchants: Uses `session.shopId` directly
- For unauthenticated requests: Falls back to domain matching
- Added `preventCrossShopDataAccess` import for security

#### `trackCustomerJourney.ts`

- Added session parameter to action signature
- For authenticated Shopify merchants: Uses `session.shopId` directly
- For unauthenticated requests: Falls back to domain matching
- Added `preventCrossShopDataAccess` import for security

#### `getBusinessAnalytics.ts`

- Added session parameter to action signature
- For authenticated Shopify merchants: Uses `session.shopId` directly
- For unauthenticated requests: Falls back to domain matching
- Added `preventCrossShopDataAccess` import for security

#### `getBusinessDashboard.ts`

- Added session parameter to action signature
- For authenticated Shopify merchants: Uses `session.shopId` directly
- For unauthenticated requests: Falls back to domain matching
- Added `preventCrossShopDataAccess` import for security

### 3. Server-Side Service Updates

**Updated `gadget-analytics.ts`:**

- Added optional `sessionToken` parameter to all methods
- Supports both session token (authenticated) and API key (unauthenticated)
  authentication
- Updated method signatures:
  - `getDashboardData(sessionToken?: string)`
  - `getBusinessAnalytics(sessionToken?: string)`
  - `getShops(sessionToken?: string)`
  - `generateDashboardData(sessionToken?: string)`

## Authorization Flow

### For Authenticated Shopify Merchants

1. **OAuth Flow**: Gadget handles Shopify OAuth automatically
2. **Session Creation**: Session is created with `shopify-app-users` role
3. **Shop Association**: Session contains `shopId` field linking to merchant's
   shop
4. **Automatic Filtering**: All API calls are automatically filtered by shop via
   tenancy filters
5. **Action Security**: Actions use `session.shopId` for data access

### For Unauthenticated Requests (External Tracking)

1. **Domain Matching**: Falls back to existing domain matching logic
2. **Shop Lookup**: Finds shop by `domain` or `myshopifyDomain`
3. **Data Creation**: Creates records with proper shop association
4. **Limited Access**: Only allows specific actions (tracking, analytics)

## Security Benefits

### 1. Multi-Tenant Security

- **Automatic Isolation**: Each merchant can only see their own data
- **Tenancy Filters**: All custom models filtered by shop automatically
- **Cross-Shop Prevention**: `preventCrossShopDataAccess` helper prevents data
  leakage

### 2. Role-Based Access Control

- **shopify-app-users**: Full access to their shop's data
- **unauthenticated**: Limited access for external tracking
- **system-admin**: Full access to everything (for admin operations)

### 3. Session Management

- **Secure Sessions**: Shopify OAuth creates secure sessions
- **Automatic Expiration**: Sessions expire automatically
- **Shop Association**: Each session tied to specific shop

## Migration Strategy

### Phase 1: Backward Compatibility

- All actions support both session-based and domain-based access
- Existing external tracking continues to work
- No breaking changes to current functionality

### Phase 2: Enhanced Security

- Shopify merchants get automatic shop-based filtering
- Improved data isolation between merchants
- Better audit trails and access control

### Phase 3: Future Enhancements

- Remove domain matching for authenticated requests
- Implement additional role-based permissions
- Add audit logging for all data access

## Testing

### Test Cases

1. **Authenticated Shopify Merchant**
   - Install app in Shopify admin
   - Verify only their shop's data is visible
   - Test all dashboard and analytics features

2. **Unauthenticated External Tracking**
   - Test referral tracking from external sources
   - Verify domain matching still works
   - Ensure data is properly associated with correct shop

3. **Cross-Shop Security**
   - Verify merchants cannot access other merchants' data
   - Test tenancy filters are working correctly
   - Confirm `preventCrossShopDataAccess` prevents unauthorized access

### Verification Steps

1. **Check Filters**: Verify all `.gelly` files are in place
2. **Test Permissions**: Confirm `permissions.gadget.ts` includes all models
3. **Action Testing**: Test each updated action with both auth methods
4. **Data Isolation**: Verify merchants only see their own data

## Configuration

### Environment Variables

- `PAVL_APP`: API key for unauthenticated requests
- `PAVLP_DASHBOARD_ACCESS`: Alternative API key
- Session tokens: Automatically managed by Gadget

### Gadget Settings

- **Roles**: `shopify-app-users`, `unauthenticated`, `system-admin`
- **Filters**: All custom models have tenancy filters
- **Permissions**: Proper read/write permissions per role

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Use `(session as any).shopId` for session access
2. **Missing Filters**: Ensure all `.gelly` files exist and are referenced
3. **Permission Denied**: Check role assignments and filter configurations
4. **Data Not Visible**: Verify tenancy filters are working correctly

### Debug Steps

1. **Check Session**: Verify `session.shopId` is present for authenticated
   requests
2. **Test Filters**: Manually test tenancy filters in Gadget editor
3. **Review Logs**: Check action logs for authorization errors
4. **Verify Permissions**: Confirm role permissions in Gadget settings

## Future Considerations

### Planned Enhancements

1. **Advanced Roles**: Add more granular role-based permissions
2. **Audit Logging**: Implement comprehensive access logging
3. **API Rate Limiting**: Add rate limiting per shop
4. **Data Export**: Add secure data export capabilities

### Security Improvements

1. **Session Validation**: Enhanced session validation
2. **Access Monitoring**: Real-time access monitoring
3. **Anomaly Detection**: Detect unusual access patterns
4. **Compliance**: GDPR and privacy compliance features

## Conclusion

The authorization system update provides:

- **Enhanced Security**: Proper multi-tenant data isolation
- **Better UX**: Seamless Shopify integration
- **Scalability**: Support for multiple merchants
- **Compliance**: Better data protection and privacy

The migration maintains backward compatibility while providing significant
security improvements for the Shopify app ecosystem.
