# Authentication Flow Diagrams

## System Overview

```mermaid
graph TB
    subgraph "User Types"
        RU[Regular Users]
        BU[Business Users]
        SM[Shopify Merchants]
        AD[Admin Users]
    end
    
    subgraph "Authentication Methods"
        EP[Email/Password]
        OA[OAuth]
        DV[Domain Verification]
        JWT[JWT Tokens]
    end
    
    subgraph "Data Stores"
        PR[Prisma Database]
        GD[Gadget Platform]
        SH[Shopify]
    end
    
    RU --> EP
    BU --> EP
    BU --> DV
    SM --> OA
    AD --> EP
    
    EP --> JWT
    OA --> JWT
    DV --> JWT
    
    JWT --> PR
    OA --> GD
    OA --> SH
```

## Regular User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant J as JWT

    U->>F: Enter email/password
    F->>B: POST /api/auth/login
    B->>DB: Query users table
    DB->>B: User data
    B->>J: Generate JWT token
    J->>B: Token with user ID
    B->>F: {token, userData}
    F->>F: Store token in localStorage
    F->>U: Redirect to dashboard
    
    Note over F: Subsequent requests
    F->>B: GET /api/user/data
    F->>F: Add Authorization: Bearer {token}
    B->>J: Verify token
    J->>B: Decoded user data
    B->>DB: Query with user ID
    DB->>B: User-specific data
    B->>F: Response data
```

## Business User Authentication Flow

```mermaid
sequenceDiagram
    participant B as Business User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant DV as Domain Verification

    B->>F: Enter business credentials
    F->>B: POST /api/business/auth/login
    B->>DB: Query businesses table
    DB->>B: Business data + domain status
    
    alt Domain not verified
        B->>F: Redirect to domain verification
        F->>B: POST /api/domain-verification/generate-token
        B->>DB: Store verification token
        B->>F: Return token
        F->>B: Display DNS instructions
        B->>DV: Add TXT record to DNS
        B->>F: Click "Verify Domain"
        F->>B: POST /api/domain-verification/verify
        B->>DV: Check DNS record
        DV->>B: Record found
        B->>DB: Update verification status
    end
    
    B->>F: JWT token + business data
    F->>B: Redirect to business dashboard
```

## Shopify OAuth Integration Flow

```mermaid
sequenceDiagram
    participant M as Merchant
    participant S as Shopify
    participant G as Gadget
    participant A as App
    participant DB as Gadget DB

    M->>S: Install app from App Store
    S->>G: OAuth redirect with code
    G->>S: Exchange code for access token
    S->>G: {accessToken, shopData}
    
    G->>DB: Create/update shopifyShop record
    DB->>G: Shop record created
    G->>G: Create session with shopify-app-users role
    G->>G: Set session.shopId = shop.id
    G->>A: Redirect with authenticated session
    
    Note over A: All subsequent requests
    A->>G: API request with session
    G->>G: Apply tenancy filter: shopId == session.shopId
    G->>DB: Query filtered data
    DB->>G: Shop-specific data
    G->>A: Response data
```

## Account Linking Process

```mermaid
graph LR
    subgraph "Account Types"
        A1[Regular User Account]
        A2[Business Account]
        A3[Shopify Shop Account]
    end
    
    subgraph "Linking Methods"
        L1[Email Matching]
        L2[Domain Verification]
        L3[OAuth Integration]
    end
    
    subgraph "Data Synchronization"
        D1[User Preferences]
        D2[Business Settings]
        D3[Tracking Data]
        D4[Analytics]
    end
    
    A1 --> L1
    A2 --> L2
    A3 --> L3
    
    L1 --> D1
    L2 --> D2
    L3 --> D3
    L3 --> D4
```

## Multi-Tenant Data Isolation

```mermaid
graph TB
    subgraph "Shopify Merchant A"
        SA1[Session A]
        SA2[Shop A Data]
        SA3[Analytics A]
    end
    
    subgraph "Shopify Merchant B"
        SB1[Session B]
        SB2[Shop B Data]
        SB3[Analytics B]
    end
    
    subgraph "Tenancy Filters"
        TF1[shopId == session.shopId]
        TF2[Automatic filtering]
        TF3[Data isolation]
    end
    
    SA1 --> TF1
    SB1 --> TF1
    TF1 --> TF2
    TF2 --> TF3
    
    TF3 --> SA2
    TF3 --> SB2
    TF3 --> SA3
    TF3 --> SB3
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        AL1[JWT Tokens]
        AL2[OAuth 2.0]
        AL3[Session Management]
    end
    
    subgraph "Authorization Layer"
        AZ1[Role-Based Access Control]
        AZ2[Tenancy Filters]
        AZ3[Permission Checks]
    end
    
    subgraph "Data Protection"
        DP1[Input Validation]
        DP2[SQL Injection Prevention]
        DP3[XSS Protection]
        DP4[CSRF Protection]
    end
    
    subgraph "Monitoring"
        M1[Login Attempts]
        M2[Token Usage]
        M3[Access Patterns]
        M4[Error Tracking]
    end
    
    AL1 --> AZ1
    AL2 --> AZ2
    AL3 --> AZ3
    
    AZ1 --> DP1
    AZ2 --> DP2
    AZ3 --> DP3
    
    DP1 --> M1
    DP2 --> M2
    DP3 --> M3
    DP4 --> M4
```

## Error Handling Flow

```mermaid
graph TD
    A[API Request] --> B{Valid Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid Permissions?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F{Valid Data?}
    F -->|No| G[400 Bad Request]
    F -->|Yes| H[200 Success]
    
    C --> I[Log Error]
    E --> I
    G --> I
    H --> J[Log Success]
    
    I --> K[Error Response]
    J --> L[Success Response]
```

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticating: Login Request
    Authenticating --> Authenticated: Valid Credentials
    Authenticating --> Unauthenticated: Invalid Credentials
    Authenticated --> TokenExpired: Token Expires
    TokenExpired --> Authenticating: Refresh Token
    TokenExpired --> Unauthenticated: No Refresh Token
    Authenticated --> Unauthenticated: Logout
    Authenticated --> [*]: Session End
```

## Database Relationships

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        boolean email_verified
        timestamp created_at
        timestamp last_login
    }
    
    BUSINESSES {
        int id PK
        string name
        string email UK
        string password_hash
        string domain UK
        boolean domain_verified
        string affiliate_id UK
        decimal commission_rate
        timestamp created_at
    }
    
    SHOPIFY_SHOPS {
        string id PK
        string domain
        string myshopify_domain
        string name
        string email
        string access_token
        string scope
        timestamp created_at
    }
    
    SESSIONS {
        string id PK
        string[] roles
        string shopId FK
        string shopify_sid
    }
    
    BUSINESS_REFERRALS {
        string id PK
        string referral_id
        string business_domain
        string shop_id FK
        string utm_source
        string utm_medium
        string utm_campaign
        enum conversion_status
        decimal conversion_value
        timestamp clicked_at
    }
    
    CUSTOMER_JOURNEY {
        string id PK
        string session_id
        string event_type
        string shop_id FK
        string business_referral_id FK
        timestamp timestamp
        string page_url
        string product_name
        decimal cart_value
    }
    
    SHOPIFY_CHECKOUTS {
        string id PK
        string shop_id FK
        string email
        string total_price
        string currency
        timestamp created_at
        timestamp completed_at
    }
    
    SHOPIFY_ORDERS {
        string id PK
        string shop_id FK
        string name
        string email
        string total_price
        string currency
        string financial_status
        string fulfillment_status
        timestamp created_at
    }
    
    DOMAIN_VERIFICATIONS {
        int id PK
        int business_id FK
        string domain
        string verification_token
        boolean is_verified
        timestamp verified_at
        timestamp created_at
    }
    
    USERS ||--o{ CUSTOMER_JOURNEY : "tracks"
    BUSINESSES ||--o{ DOMAIN_VERIFICATIONS : "verifies"
    SHOPIFY_SHOPS ||--o{ SESSIONS : "authenticates"
    SHOPIFY_SHOPS ||--o{ BUSINESS_REFERRALS : "tracks"
    SHOPIFY_SHOPS ||--o{ CUSTOMER_JOURNEY : "tracks"
    SHOPIFY_SHOPS ||--o{ SHOPIFY_CHECKOUTS : "processes"
    SHOPIFY_SHOPS ||--o{ SHOPIFY_ORDERS : "fulfills"
    BUSINESS_REFERRALS ||--o{ CUSTOMER_JOURNEY : "attracts"
```

## API Endpoint Structure

```mermaid
graph TB
    subgraph "Traditional REST APIs (Main App)"
        A1[POST /api/auth/login]
        A2[POST /api/auth/register]
        A3[POST /api/auth/logout]
        A4[GET /api/auth/me]
    end
    
    subgraph "Business APIs (Main App)"
        B1[POST /api/business/auth/login]
        B2[POST /api/business/auth/register]
        B3[GET /api/business/auth/me]
        B4[PUT /api/business/profile]
    end
    
    subgraph "Domain Verification APIs (Main App)"
        D1[POST /api/domain-verification/generate-token]
        D2[POST /api/domain-verification/verify]
        D3[GET /api/domain-verification/status]
    end
    
    subgraph "Gadget GraphQL API (Shopify App)"
        G1[api.businessReferral.*]
        G2[api.customerJourney.*]
        G3[api.shopifyOrder.*]
        G4[api.shopifyCheckout.*]
        G5[api.shopifyShop.*]
    end
    
    subgraph "Gadget Actions"
        GA1[trackReferral]
        GA2[trackCustomerJourney]
        GA3[getBusinessAnalytics]
        GA4[getBusinessDashboard]
    end
    
    subgraph "Middleware & Filters"
        M1[requireAuth - JWT]
        M2[requireBusinessAuth - JWT]
        M3[requireAdmin - JWT]
        M4[Tenancy Filters - Gelly]
        M5[preventCrossShopDataAccess]
    end
    
    A1 --> M1
    B1 --> M2
    G1 --> M4
    G2 --> M4
    G3 --> M4
    G4 --> M4
    G5 --> M4
    GA1 --> M5
    GA2 --> M5
    GA3 --> M5
    GA4 --> M5
```

**Key Differences**:

- **Main App**: Uses traditional REST APIs with JWT authentication
- **Shopify App**: Uses Gadget's auto-generated GraphQL API with session-based
  authentication
- **Data Isolation**: REST APIs use middleware, GraphQL uses Gelly filters

These diagrams provide a comprehensive visual representation of the
authentication and account linking system, showing how different user types
interact with the platform and how data flows through the system.
