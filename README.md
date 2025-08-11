# Price Comparison Application

A comprehensive web application that scrapes product information from URLs and provides price comparisons across multiple retailers using n8n webhook automation and SearchAPI (Google Shopping) integration.

## 🚀 Features

### Core Functionality

- **Product Scraping**: Extract product information (title, price, image) from any product URL
- **Price Comparison**: Find similar products across multiple retailers using Google Shopping API
- **n8n Webhook Integration**: Automated product analysis and price comparison via n8n workflows
- **Real-time Validation**: Validate product URLs and extract real product data
- **Smart Filtering**: Filter results by price range and relevance
- **Multi-country Support**: Support for 50+ countries with proper localization

### Advanced Features

- **AI-Powered Title Cleaning**: Use Gemini API to clean product titles for better search results
- **Google Shopping Integration**: Direct integration with Google Shopping for real-time price data
- **n8n Automation**: Automated workflow for product analysis and price comparison
- **URL Validation**: Fetch and validate product pages to ensure data quality
- **Rate Limiting**: Intelligent rate limiting for API calls
- **Fallback Mechanisms**: Multiple fallback strategies when primary APIs fail
- **TestSprite Integration**: Comprehensive testing framework for quality assurance

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (for user management and search history)
- **APIs**:
  - SearchAPI (Google Shopping)
  - Gemini API (Google AI)
  - n8n Webhook Automation
  - Puppeteer (Web scraping)

### Project Structure

```
├── client/                 # React frontend
│   ├── components/        # React components
│   ├── pages/            # Page components
│   └── App.tsx           # Main app component
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── index.ts          # Server entry point
├── shared/               # Shared types and utilities
├── prisma/               # Database schema and migrations
└── README.md             # This file
```

## 🔧 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- SearchAPI key (Google Shopping API)
- Gemini API key (optional, for AI features)
- n8n webhook URL (for automation)

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd price-comparison-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/price_comparison

# APIs
SEARCH_API_KEY=your_searchapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
N8N_WEBHOOK_URL=https://n8n.srv824584.hstgr.cloud/webhook/new-test

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

4. **Database Setup**

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

5. **Start Development Server**

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📚 API Documentation

### Core Endpoints

#### 1. n8n Webhook Product Scraping

```http
POST /api/n8n-scrape
Content-Type: application/json

{
  "url": "https://example.com/product/123",
  "requestId": "unique-request-id",
  "userLocation": {
    "country": "Germany"
  }
}
```

**Response:**

```json
{
  "mainProduct": {
    "title": "Product Name",
    "price": "$299",
    "image": "https://example.com/image.jpg",
    "url": "https://example.com/product/123"
  },
  "suggestions": [
    {
      "title": "Similar Product",
      "standardPrice": "$295.00",
      "discountPrice": "$295.00",
      "site": "www.amazon.com",
      "link": "https://amazon.com/product",
      "image": "https://amazon.com/image.jpg"
    }
  ]
}
```

#### 2. Legacy Product Scraping

```http
POST /api/scrape
Content-Type: application/json

{
  "url": "https://example.com/product/123",
  "requestId": "unique-request-id"
}
```

**Response:**

```json
{
  "originalProduct": {
    "title": "Product Name",
    "price": 99.99,
    "currency": "€",
    "image": "https://example.com/image.jpg",
    "url": "https://example.com/product/123",
    "store": "example.com"
  },
  "comparisons": [
    {
      "title": "Similar Product",
      "store": "Amazon",
      "price": 89.99,
      "currency": "€",
      "url": "https://amazon.com/product",
      "image": "https://amazon.com/image.jpg",
      "condition": "New",
      "assessment": {
        "cost": 1,
        "value": 2,
        "quality": 3,
        "description": "Found on Amazon"
      }
    }
  ]
}
```

#### 3. Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-19T19:07:17.661Z",
  "database": {
    "status": "healthy",
    "message": "Database connection successful"
  },
  "stats": {
    "users": 2,
    "searches": 0,
    "legacySearches": 4
  }
}
```

#### 4. Location Detection

```http
GET /api/location
```

**Response:**

```json
{
  "country": "Germany",
  "city": "Berlin",
  "ip": "192.168.1.1"
}
```

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Search History Endpoints

#### Save Search History

```http
POST /api/search-history
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/product",
  "title": "Product Name",
  "requestId": "unique-request-id"
}
```

#### Get User Search History

```http
GET /api/search-history
Authorization: Bearer <token>
```

## 🔍 How It Works

### 1. n8n Webhook Integration

1. **URL Input**: User provides a product URL
2. **n8n Webhook Call**: Send URL to n8n automation workflow
3. **Automated Processing**: n8n extracts product data and searches for comparisons
4. **Response Processing**: Handle n8n response format with mainProduct and suggestions
5. **Display Results**: Show original product and price comparisons

### 2. Legacy Product Scraping Process

1. **URL Input**: User provides a product URL
2. **Puppeteer Scraping**: Extract product data using headless browser
3. **Data Extraction**: Parse title, price, image, and store information
4. **Validation**: Verify the extracted data is valid

### 3. Price Comparison Process

1. **Title Cleaning**: Use Gemini API to clean product titles for better search
2. **SearchAPI Query**: Search Google Shopping for similar products
3. **Result Filtering**: Filter results by relevance and price range
4. **URL Validation**: Validate each result URL by fetching content
5. **Assessment**: Generate price and quality assessments

### 4. Smart Features

- **Country Detection**: Automatically detect user location for localized results
- **Rate Limiting**: Prevent API abuse with intelligent rate limiting
- **Fallback Strategies**: Multiple fallback options when primary APIs fail
- **Error Handling**: Comprehensive error handling and logging

## 🌍 Supported Countries

The application supports 50+ countries with proper ISO country code mapping:

- **Europe**: Germany (de), France (fr), UK (uk), Italy (it), Spain (es), etc.
- **North America**: USA (us), Canada (ca)
- **Asia**: Japan (jp), South Korea (kr), China (cn), India (in)
- **Oceania**: Australia (au), New Zealand (nz)
- **And many more...**

## 🔧 Configuration

### Environment Variables

| Variable          | Description                          | Required | Default                                            |
| ----------------- | ------------------------------------ | -------- | -------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string         | Yes      | -                                                  |
| `SEARCH_API_KEY`  | SearchAPI key for Google Shopping    | Yes      | -                                                  |
| `GEMINI_API_KEY`  | Gemini API key for AI features       | No       | -                                                  |
| `N8N_WEBHOOK_URL` | n8n webhook URL for automation       | No       | https://n8n.srv824584.hstgr.cloud/webhook/new-test |
| `NODE_ENV`        | Environment (development/production) | No       | development                                        |
| `FRONTEND_URL`    | Frontend URL for CORS                | No       | http://localhost:8080                              |

### API Rate Limits

- **SearchAPI**: 100 requests/minute
- **Gemini API**: 60 requests/minute
- **n8n Webhook**: No limit (automated processing)
- **Puppeteer**: No limit (local scraping)

## 🚀 Deployment

### Production Build

```bash
# Build frontend and server
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t price-comparison-app .

# Run container
docker run -p 8080:8080 price-comparison-app
```

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates

## 🧪 Testing

### TestSprite Integration

The project includes comprehensive testing with TestSprite:

```bash
# Initialize TestSprite
npx @testsprite/testsprite-mcp@latest

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run full test suite
npm run test:all
```

### Manual Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### API Testing

```bash
# Test n8n webhook endpoint
curl -X POST http://localhost:8080/api/n8n-scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/product","requestId":"test"}'

# Test health endpoint
curl http://localhost:8080/api/health
```

## 📊 Monitoring

### Health Checks

- Database connectivity
- API key validity
- Service status
- Memory usage
- n8n webhook availability

### Logging

- Request/response logging
- Error tracking
- Performance metrics
- API usage statistics
- n8n webhook response monitoring

## 🔒 Security

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Role-based access control

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

### API Security

- CORS configuration
- Request validation
- Error message sanitization
- API key protection
- n8n webhook security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests with TestSprite
- Update documentation
- Follow the existing code style
- Test n8n webhook integration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Q: n8n webhook returns 404 errors**
A: Check your N8N_WEBHOOK_URL and ensure the workflow is active in n8n.

**Q: SearchAPI returns 400 errors**
A: Check your API key and ensure it's valid. Verify the country code format.

**Q: No comparison results found**
A: The product might be too specific. Try with a more generic search term.

**Q: Database connection fails**
A: Verify your DATABASE_URL and ensure PostgreSQL is running.

**Q: Prisma type errors**
A: Ensure database migrations are up to date and Prisma client is regenerated.

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Contact the development team

## 🔄 Changelog

### v1.1.0 (2025-01-XX)

- Added n8n webhook integration for automated product analysis
- Implemented TestSprite testing framework
- Fixed Prisma database type issues
- Enhanced error handling for authentication
- Updated API endpoints to support n8n response format
- Improved frontend components for better UX

### v1.0.0 (2025-07-19)

- Initial release
- Product scraping functionality
- Google Shopping integration
- AI-powered title cleaning
- Multi-country support
- User authentication
- Search history tracking

## 🙏 Acknowledgments

- [SearchAPI](https://www.searchapi.io/) for Google Shopping data
- [Google Gemini](https://ai.google.dev/) for AI features
- [n8n](https://n8n.io/) for workflow automation
- [TestSprite](https://testsprite.com/) for comprehensive testing
- [Puppeteer](https://pptr.dev/) for web scraping
- [Express](https://expressjs.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
