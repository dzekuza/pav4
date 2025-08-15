# URL Prefix Feature

## Overview

The URL prefix feature allows users to search for external products by prefixing
any product URL with the platform domain. This enables users to compare prices
for products from any website directly on the PriceHunt platform.

## How It Works

### Format

Users can prefix any product URL with `@https://ipick.io.netlify.app` to search
for that product on the platform.

### Examples

**Original URL:**

```
https://godislove.lt/products/cotton-logo-socks?variant=50524518678857
```

**With prefix:**

```
@https://ipick.io.netlify.apphttps://godislove.lt/products/cotton-logo-socks?variant=50524518678857
```

### Usage Methods

1. **Direct URL Entry**: Users can type the prefixed URL directly in the search
   input
2. **Browser Navigation**: Users can navigate directly to the prefixed URL in
   their browser
3. **Bookmarking**: Users can bookmark prefixed URLs for quick access

## Technical Implementation

### Route Handling

The feature is implemented through the `UrlRedirectHandler` component which:

1. **Detects prefixed URLs**: Looks for paths starting with `/@`
2. **Extracts the original URL**: Removes the platform domain prefix
3. **Validates the URL**: Ensures the extracted URL is valid
4. **Redirects to search**: Creates a search request and redirects to the
   results page

### Supported Formats

- **Direct URL format**: `/https://example.com/product`
- **Prefixed URL format**:
  `/@https://ipick.io.netlify.apphttps://example.com/product`

### Error Handling

- **Invalid URL**: Redirects to home with error message
- **Invalid domain prefix**: Shows domain error
- **Malformed URL**: Handles gracefully with fallback

## User Experience

### Search Input

- Updated placeholder text to include information about the feature
- Added helpful tip section with example usage
- Maintains backward compatibility with existing search methods

### Visual Feedback

- Loading states during URL processing
- Clear error messages for invalid inputs
- Seamless redirect to search results

## Benefits

1. **Universal Product Search**: Search any product from any website
2. **Easy Sharing**: Share prefixed URLs for specific product searches
3. **Bookmarking**: Save specific product searches as bookmarks
4. **Integration**: Works with existing affiliate tracking and business features

## Future Enhancements

- Support for additional prefix formats
- Enhanced error messages with suggestions
- Analytics tracking for prefixed URL usage
- Mobile app integration
