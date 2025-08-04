# Row Level Security (RLS) Setup Documentation

## Overview

Row Level Security (RLS) has been implemented on all database tables to ensure data privacy and security. This system ensures that users can only access data they're authorized to see.

## 🔒 Security Features

### **Enabled Tables**
All 15 tables now have RLS enabled:
- `users` - User accounts
- `businesses` - Business accounts  
- `search_history` - User search history
- `favorites` - User favorites
- `affiliate_clicks` - Affiliate link clicks
- `affiliate_conversions` - Affiliate conversions
- `business_clicks` - Business-specific clicks
- `business_conversions` - Business-specific conversions
- `admins` - Admin accounts
- `affiliate_urls` - Affiliate URL management
- `legacy_search_history` - Legacy search data
- `ClickLog` - Legacy click tracking
- `Conversion` - Legacy conversion tracking
- `Settings` - Application settings

### **Security Policies**

#### **User Data Protection**
- Users can only view their own data
- Users can only modify their own records
- Admins can access all user data

#### **Business Data Protection**
- Business owners can only manage their own business
- Public can view active businesses only
- Admins can manage all businesses

#### **Search History Protection**
- Users can only view their own search history
- Users can only insert their own search history
- Users can delete their own search history
- Admins can view all search history

#### **Favorites Protection**
- Users can only view their own favorites
- Users can only manage their own favorites
- Admins can view all favorites

#### **Affiliate Tracking Protection**
- Users can view their own affiliate clicks/conversions
- Anyone can insert affiliate tracking data (for analytics)
- Admins can view all affiliate data

#### **Business Tracking Protection**
- Business owners can view their own tracking data
- Anyone can insert business tracking data
- Admins can view all business tracking data

## 🛠️ Implementation Details

### **Database Functions**

#### `get_current_user_id()`
Returns the current user ID from session context.

#### `is_admin()`
Checks if the current user has admin privileges.

#### `set_user_context(user_email, user_id)`
Sets the current user context for RLS policies.

### **Server Middleware Integration**

The authentication middleware automatically sets user context:

```typescript
// In requireAuth middleware
await setUserContext(user.id, user.email);

// In optionalAuth middleware  
await setUserContext(user.id, user.email);

// After each request
await clearUserContext();
```

## 🔧 Usage Examples

### **Setting User Context**
```typescript
import { setUserContext, clearUserContext } from '../services/database';

// Set context before database operations
await setUserContext(userId, userEmail);

// Clear context after operations
await clearUserContext();
```

### **Database Operations with RLS**
```typescript
// Users can only see their own data
const userFavorites = await prisma.favorites.findMany();
// Only returns favorites for the current user

// Admins can see all data
const allUsers = await prisma.users.findMany();
// Returns all users if current user is admin
```

## 🚨 Security Considerations

### **Context Management**
- User context is automatically set by auth middleware
- Context is cleared after each request
- No context = no access to user-specific data

### **Admin Access**
- Admins bypass RLS restrictions
- Admin status is checked via `is_admin()` function
- Admin privileges are verified against the database

### **Public Data**
- Some tables allow public read access (active businesses, public settings)
- Insert operations are generally allowed for tracking purposes
- Update/delete operations are restricted to owners/admins

## 📊 Policy Summary

| Table | Read Access | Write Access | Delete Access |
|-------|-------------|--------------|---------------|
| `users` | Own data + Admin | Own data + Admin | Admin only |
| `businesses` | Active + Own + Admin | Own + Admin | Admin only |
| `search_history` | Own + Admin | Own | Own + Admin |
| `favorites` | Own + Admin | Own | Own + Admin |
| `affiliate_clicks` | Own + Admin | Anyone | Admin only |
| `affiliate_conversions` | Own + Admin | Anyone | Admin only |
| `business_clicks` | Own business + Admin | Anyone | Admin only |
| `business_conversions` | Own business + Admin | Anyone | Admin only |
| `admins` | Admin only | Admin only | Admin only |
| `affiliate_urls` | Active + Admin | Admin only | Admin only |
| `settings` | Public + Admin | Admin only | Admin only |

## 🔍 Testing RLS

### **Test as Regular User**
```sql
-- Set user context
SELECT set_user_context('user@example.com', 123);

-- Try to access data
SELECT * FROM users; -- Should only see own data
SELECT * FROM favorites; -- Should only see own favorites
```

### **Test as Admin**
```sql
-- Admin context is set automatically by middleware
SELECT * FROM users; -- Should see all users
SELECT * FROM businesses; -- Should see all businesses
```

## 🚀 Benefits

1. **Data Privacy**: Users can only access their own data
2. **Security**: Prevents unauthorized data access
3. **Compliance**: Helps meet data protection requirements
4. **Scalability**: Security at the database level
5. **Transparency**: Clear access control policies

## ⚠️ Important Notes

- RLS is enforced at the database level
- Application-level checks are still recommended
- Context must be set before database operations
- Admin users bypass all restrictions
- Public data (active businesses, settings) remains accessible

## 🔧 Troubleshooting

### **Common Issues**

1. **No data returned**: Check if user context is set
2. **Permission denied**: Verify user has appropriate access
3. **Admin access issues**: Check admin status in database

### **Debug Commands**
```sql
-- Check current user context
SELECT current_setting('app.current_user_id', TRUE);
SELECT current_setting('app.current_user_email', TRUE);

-- Check if user is admin
SELECT is_admin();

-- List all policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
``` 