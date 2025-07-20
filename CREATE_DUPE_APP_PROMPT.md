# AI Prompt: Create a Price Comparison App Like Dupe.com

## 🎯 **Project Overview**

Create a comprehensive price comparison web application that scrapes product information from URLs and provides price comparisons across multiple retailers, similar to dupe.com. The app should extract product data from any product URL and find similar products with better prices using Google Shopping integration.

## 🏗️ **Technical Requirements**

### **Tech Stack**
- **Frontend**: React 18+ with TypeScript, Vite for build tooling
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **APIs**: 
  - SearchAPI (Google Shopping integration)
  - Gemini API (Google AI for title cleaning)
  - Puppeteer (Web scraping)

### **Core Architecture**
```
├── client/                 # React frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   └── App.tsx           # Main app component
├── server/                # Express backend
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── index.ts          # Server entry point
├── shared/               # Shared types and utilities
└── prisma/               # Database schema and migrations
```

## 🚀 **Core Features to Implement**

### **1. Product Scraping System**
- **URL Input**: Accept any product URL from user
- **Puppeteer Scraping**: Extract product data using headless browser
- **Data Extraction**: Parse title, price, image, currency, and store information
- **Validation**: Verify extracted data quality and completeness
- **Error Handling**: Graceful handling of invalid URLs or failed scrapes

### **2. Price Comparison Engine**
- **SearchAPI Integration**: Use Google Shopping API for product search
- **Title Cleaning**: Use Gemini API to clean product titles for better search results
- **Multi-country Support**: Support 50+ countries with proper ISO country codes
- **Smart Filtering**: Filter results by price range and relevance
- **URL Validation**: Validate each comparison result by fetching content

### **3. Advanced Features**
- **AI-Powered Assessment**: Generate cost, value, and quality assessments
- **Rate Limiting**: Intelligent rate limiting for API calls
- **Fallback Mechanisms**: Multiple fallback strategies when primary APIs fail
- **Real-time Validation**: Fetch and validate product pages to ensure data quality

### **4. User Management**
- **Authentication**: JWT-based user authentication
- **User Registration/Login**: Secure user account management
- **Search History**: Track and display user search history
- **Favorites**: Allow users to save favorite products

## 📋 **Detailed Implementation Requirements**

### **Backend API Endpoints**

#### **Core Scraping Endpoints**
```typescript
// Main scraping endpoint
POST /api/scrape
{
  "url": "https://example.com/product/123",
  "requestId": "unique-request-id"
}

// Enhanced scraping with AI features
POST /api/scrape-enhanced
{
  "url": "https://example.com/product/123",
  "requestId": "unique-request-id"
}
```

#### **Authentication Endpoints**
```typescript
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

#### **Utility Endpoints**
```typescript
GET /api/health
GET /api/location
POST /api/search-history
GET /api/search-history
```

### **Key Functions to Implement**

#### **1. Product Scraping Functions**
```typescript
// Extract product information from URL
async function detectProductFromUrl(url: string): Promise<ProductData>

// Validate product page content
function validateProductPage(html: string, productTitle: string): boolean

// Extract product info from HTML
function extractProductInfoFromHTML(html: string, url: string): ProductInfo
```

#### **2. SearchAPI Integration**
```typescript
// Make SearchAPI request
async function makeSearchApiRequest(url: string): Promise<any>

// Convert country names to ISO codes
function getCountryCode(country: string): string

// Validate and sanitize SearchAPI results
async function validateAndSanitizeResult(result: any, productTitle: string): Promise<PriceComparison>
```

#### **3. AI-Powered Features**
```typescript
// Clean product titles with Gemini
async function cleanProductTitleWithGemini(productTitle: string): Promise<string>

// Generate product assessments
function generateAssessment(price: number, basePrice: number, retailer: string): Assessment
```

#### **4. Filtering and Processing**
```typescript
// Filter by price range
function filterByPriceRange(comparisons: PriceComparison[], originalPrice: number): PriceComparison[]

// Remove duplicate results
function removeDuplicateResults(results: any[]): any[]

// Sort by local retailers
function sortByLocalRetailers(comparisons: PriceComparison[], userCountry: string): PriceComparison[]
```

### **Frontend Components**

#### **Core Components**
- `SearchInput.tsx` - URL input with validation
- `ProductCard.tsx` - Display product information
- `ComparisonGrid.tsx` - Show price comparisons
- `LoadingSkeleton.tsx` - Loading states
- `AuthForms.tsx` - Login/register forms

#### **Pages**
- `Index.tsx` - Main landing page
- `SearchResults.tsx` - Results display
- `Login.tsx` - Authentication page
- `History.tsx` - Search history
- `Favorites.tsx` - Saved products

### **Database Schema**
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Search history table
CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query TEXT NOT NULL,
  results JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **Configuration Requirements**

### **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/price_comparison

# APIs
SEARCH_API_KEY=your_searchapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### **Country Support**
Implement support for 50+ countries with proper ISO country code mapping:
- Europe: Germany (de), France (fr), UK (uk), Italy (it), Spain (es), etc.
- North America: USA (us), Canada (ca)
- Asia: Japan (jp), South Korea (kr), China (cn), India (in)
- Oceania: Australia (au), New Zealand (nz)

## 🎨 **UI/UX Requirements**

### **Design Principles**
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface using shadcn/ui
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant

### **Key UI Components**
- **Search Bar**: Large, prominent URL input
- **Product Cards**: Clean product display with images
- **Price Comparison Grid**: Side-by-side price comparison
- **Filters**: Price range, store, condition filters
- **Navigation**: Clean navigation with user menu

## 🔒 **Security Requirements**

### **Authentication & Authorization**
- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Role-based access control

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration

## 📊 **Performance Requirements**

### **Optimization**
- **API Rate Limiting**: SearchAPI (100/min), Gemini (60/min)
- **Caching**: Cache API responses where appropriate
- **Lazy Loading**: Load images and content progressively
- **Error Recovery**: Graceful fallbacks for failed requests

### **Monitoring**
- Health check endpoints
- Request/response logging
- Error tracking
- Performance metrics

## 🧪 **Testing Requirements**

### **Test Coverage**
- Unit tests for core functions
- Integration tests for API endpoints
- E2E tests for user workflows
- API testing with curl examples

### **Quality Assurance**
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Comprehensive error handling

## 📚 **Documentation Requirements**

### **Technical Documentation**
- Complete API documentation with examples
- Database schema documentation
- Deployment guide
- Troubleshooting guide

### **User Documentation**
- Installation instructions
- Configuration guide
- Usage examples
- FAQ section

## 🚀 **Deployment Requirements**

### **Production Setup**
- Docker containerization
- Environment variable management
- Database migration scripts
- SSL certificate configuration
- Reverse proxy setup (nginx)

### **Monitoring & Logging**
- Application health monitoring
- Error tracking and alerting
- Performance monitoring
- Usage analytics

## 🎯 **Success Criteria**

The application should successfully:

1. **Extract Product Data**: Scrape any product URL and extract title, price, image
2. **Find Price Comparisons**: Use Google Shopping to find similar products with better prices
3. **Validate Results**: Ensure all comparison URLs are valid and accessible
4. **Handle Multiple Countries**: Support 50+ countries with proper localization
5. **Provide AI Insights**: Use Gemini API for title cleaning and assessments
6. **Manage User Data**: Secure authentication and search history tracking
7. **Scale Efficiently**: Handle multiple concurrent requests with rate limiting
8. **Error Recovery**: Graceful handling of API failures and invalid data

## 🔄 **Development Workflow**

1. **Setup Project Structure**: Create React + Node.js + TypeScript project
2. **Implement Core Scraping**: Build Puppeteer-based product extraction
3. **Integrate SearchAPI**: Connect Google Shopping for price comparisons
4. **Add AI Features**: Implement Gemini API for title cleaning
5. **Build Frontend**: Create responsive UI with shadcn/ui components
6. **Add Authentication**: Implement user management system
7. **Database Integration**: Set up PostgreSQL with Prisma
8. **Testing & Optimization**: Comprehensive testing and performance tuning
9. **Documentation**: Complete technical and user documentation
10. **Deployment**: Production-ready deployment configuration

## 💡 **Key Implementation Notes**

- **Use Real URLs**: Never generate fake URLs, always use real SearchAPI results
- **Google Shopping URLs**: Handle Google Shopping URLs specially (skip HTML validation)
- **Price Filtering**: Apply lenient price ranges for Google Shopping results
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Rate Limiting**: Implement intelligent rate limiting to prevent API abuse
- **Fallback Strategies**: Multiple fallback options when primary APIs fail
- **Type Safety**: Use TypeScript throughout for better code quality
- **Responsive Design**: Ensure mobile-first responsive design
- **Accessibility**: Follow WCAG guidelines for inclusive design

This prompt provides all the necessary details to recreate a fully functional price comparison application with the same capabilities as dupe.com, including product scraping, price comparison, AI features, user management, and comprehensive documentation. 