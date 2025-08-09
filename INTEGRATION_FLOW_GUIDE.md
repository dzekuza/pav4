# Integration Flow Guide

## Overview

The integration process has been updated to follow a proper 4-step flow that
ensures domain ownership verification before allowing script installation. This
provides better security and ensures that only verified domain owners can
install tracking scripts.

## Integration Flow Steps

### Step 1: Verify Domain Ownership

- **Purpose**: Verify that the business owns the domain where they want to
  install the tracking script
- **Process**:
  1. Business enters their domain name (e.g., `example.com`)
  2. System generates a unique verification token
  3. Business adds a TXT record to their DNS settings:
     - **Record Type**: TXT
     - **Name/Host**: @ (or leave empty)
     - **Value**: `pricehunt-verification={token}`
     - **TTL**: 300 (or default)
  4. Business clicks "Verify Domain" to confirm the TXT record is in place
  5. System checks DNS records and marks domain as verified if found

### Step 2: Choose Platform

- **Purpose**: Select the appropriate tracking script based on the website
  platform
- **Options**:
  - **Shopify**: One-line loader script with enhanced tracking
  - **WooCommerce**: WordPress e-commerce integration
  - **Magento**: Enterprise e-commerce platform
  - **Custom Website**: Universal tracking for any website

### Step 3: Add Script

- **Purpose**: Get the appropriate tracking script and installation instructions
- **Features**:
  - Platform-specific script templates
  - Business information pre-filled (Business ID, Affiliate ID)
  - Detailed installation instructions
  - Important notes and troubleshooting tips

### Step 4: Test Tracking

- **Purpose**: Verify that the tracking script is working correctly
- **Features**:
  - Real-time event monitoring
  - Test event generation
  - Website testing tools
  - Event history display

## API Endpoints

### Domain Verification

- `POST /api/domain-verification/generate-token` - Generate verification token
- `POST /api/domain-verification/verify` - Verify domain ownership
- `GET /api/domain-verification/check` - Check if domain is verified (public)
- `GET /api/domain-verification/status/:businessId` - Get verification status

### Tracking

- `POST /api/track-event` - Track events from business websites
- `GET /api/tracking-events` - Get tracking events for testing
- `POST /api/test-tracking` - Generate test tracking events

## Database Schema

### DomainVerification Model

```prisma
model DomainVerification {
  id                Int       @id @default(autoincrement())
  businessId        Int
  domain            String
  verificationToken String    @unique
  status            String    @default("pending") // pending, verified, expired
  expiresAt         DateTime
  verifiedAt        DateTime?
  createdAt         DateTime  @default(now())
  business          Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@index([domain])
  @@index([verificationToken])
  @@index([status])
  @@map("domain_verifications")
}
```

### Business Model Updates

- `domainVerified: Boolean` - Whether the domain has been verified
- `domainVerifiedAt: DateTime?` - When the domain was verified

## Security Features

1. **Domain Ownership Verification**: Only verified domain owners can install
   scripts
2. **Token Expiration**: Verification tokens expire after 24 hours
3. **Business Authentication**: All verification endpoints require business
   authentication
4. **DNS Verification**: Uses TXT records for secure domain verification

## User Experience Improvements

1. **Step-by-Step Wizard**: Clear progression through the integration process
2. **Visual Progress Indicators**: Shows current step and completion status
3. **Auto-Detection**: Automatically suggests platform based on domain
4. **Real-Time Testing**: Live event monitoring during testing phase
5. **Comprehensive Instructions**: Detailed setup guides for each platform

## Error Handling

- **DNS Propagation**: Warns users about DNS propagation delays
- **Invalid Tokens**: Clear error messages for expired or invalid tokens
- **Network Issues**: Graceful handling of DNS resolution failures
- **Missing Records**: Specific guidance when TXT records are not found

## Testing and Validation

1. **DNS Lookup**: Verifies TXT records exist and match expected format
2. **Event Tracking**: Real-time monitoring of tracking events
3. **Script Loading**: Confirms tracking scripts are properly installed
4. **Data Flow**: Validates that events are being sent to the correct endpoints

## Migration Notes

- Existing businesses without verified domains will need to complete domain
  verification
- Previously installed scripts will continue to work
- New integrations require domain verification before script installation
- Domain verification is a one-time process per domain

## Support and Troubleshooting

### Common Issues

1. **DNS Propagation**: Can take up to 24 hours, typically 5-30 minutes
2. **Incorrect TXT Record**: Ensure exact format:
   `pricehunt-verification={token}`
3. **Domain Format**: Use domain without http:// or https:// (e.g.,
   `example.com`)
4. **Token Expiration**: Generate new token if verification fails

### Debug Tools

- Browser console logging for script debugging
- Network tab monitoring for API calls
- DNS lookup tools for TXT record verification
- Real-time event monitoring in the testing interface
