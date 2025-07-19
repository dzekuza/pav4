# Price Comparison Application

A comprehensive web application that scrapes product information from URLs and provides price comparisons across multiple retailers using SearchAPI (Google Shopping) integration.

## 🚀 Features

### Core Functionality
- **Product Scraping**: Extract product information (title, price, image) from any product URL
- **Price Comparison**: Find similar products across multiple retailers using Google Shopping API
- **Real-time Validation**: Validate product URLs and extract real product data
- **Smart Filtering**: Filter results by price range and relevance
- **Multi-country Support**: Support for 50+ countries with proper localization

### Advanced Features
- **AI-Powered Title Cleaning**: Use Gemini API to clean product titles for better search results
- **Google Shopping Integration**: Direct integration with Google Shopping for real-time price data
- **URL Validation**: Fetch and validate product pages to ensure data quality
- **Rate Limiting**: Intelligent rate limiting for API calls
- **Fallback Mechanisms**: Multiple fallback strategies when primary APIs fail

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (for user management and search history)
- **APIs**: 
  - SearchAPI (Google Shopping)
  - Gemini API (Google AI)
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
└── README.md             # This file
```

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- SearchAPI key (Google Shopping API)
- Gemini API key (optional, for AI features)

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

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

4. **Database Setup**
```bash
# Run database migrations (if using Prisma)
npx prisma migrate dev

# Or create tables manually
psql -d your_database -f database/schema.sql
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📚 API Documentation

### Core Endpoints

#### 1. Product Scraping
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

#### 2. Enhanced Scraping (with AI features)
```http
POST /api/scrape-enhanced
Content-Type: application/json

{
  "url": "https://example.com/product/123",
  "requestId": "unique-request-id"
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
  "password": "securepassword",
  "name": "John Doe"
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
  "query": "product search",
  "results": [...],
  "timestamp": "2025-07-19T19:07:17.661Z"
}
```

#### Get User Search History
```http
GET /api/search-history
Authorization: Bearer <token>
```

## 🔍 How It Works

### 1. Product Scraping Process
1. **URL Input**: User provides a product URL
2. **Puppeteer Scraping**: Extract product data using headless browser
3. **Data Extraction**: Parse title, price, image, and store information
4. **Validation**: Verify the extracted data is valid

### 2. Price Comparison Process
1. **Title Cleaning**: Use Gemini API to clean product titles for better search
2. **SearchAPI Query**: Search Google Shopping for similar products
3. **Result Filtering**: Filter results by relevance and price range
4. **URL Validation**: Validate each result URL by fetching content
5. **Assessment**: Generate price and quality assessments

### 3. Smart Features
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

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SEARCH_API_KEY` | SearchAPI key for Google Shopping | Yes | - |
| `GEMINI_API_KEY` | Gemini API key for AI features | No | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:8080 |

### API Rate Limits

- **SearchAPI**: 100 requests/minute
- **Gemini API**: 60 requests/minute
- **Puppeteer**: No limit (local scraping)

## 🚀 Deployment

### Production Build
```bash
# Build frontend
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

### Run Tests
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
# Test scraping endpoint
curl -X POST http://localhost:8080/api/scrape \
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

### Logging
- Request/response logging
- Error tracking
- Performance metrics
- API usage statistics

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Q: SearchAPI returns 400 errors**
A: Check your API key and ensure it's valid. Verify the country code format.

**Q: No comparison results found**
A: The product might be too specific. Try with a more generic search term.

**Q: Database connection fails**
A: Verify your DATABASE_URL and ensure PostgreSQL is running.

### Getting Help
- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Contact the development team

## 🔄 Changelog

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
- [Puppeteer](https://pptr.dev/) for web scraping
- [Express](https://expressjs.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework 