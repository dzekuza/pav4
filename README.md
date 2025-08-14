# Price Comparison Application

A modern price comparison platform built with Next.js, React, and TypeScript.
The application helps users find the best prices for products across multiple
retailers.

## 🚀 **Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **Deployment**: Netlify
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: JWT + bcrypt
- **Email**: Resend
- **AI**: Google Gemini

## 📁 **Project Structure**

```
pav4/
├── client/                 # React frontend application
│   ├── components/         # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Application pages
│   └── ui/                # Radix UI components
├── server/                # Express backend
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   └── services/          # Business logic services
├── netlify/               # Netlify functions
│   └── functions/         # Serverless functions
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── shared/                # Shared types and utilities
```

## 🛠️ **Setup & Installation**

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL database

### 1. Clone the repository

```bash
git clone <repository-url>
cd pav4
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
NETLIFY_DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Secret
JWT_SECRET="your-jwt-secret"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# N8N Webhook (optional)
N8N_WEBHOOK_URL="your-n8n-webhook-url"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### 5. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for Netlify
npm run build:netlify
```

## 🚀 **Deployment**

### Netlify Deployment

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy using the build command: `npm run build:netlify`

### Environment Variables for Production

Make sure to set these in your Netlify dashboard:

- `NETLIFY_DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `GEMINI_API_KEY`
- `N8N_WEBHOOK_URL` (optional)

## 📊 **Features**

### Core Features

- **Product Search**: Search for products across multiple retailers
- **Price Comparison**: Compare prices from different sources
- **User Authentication**: Secure login/register system
- **Search History**: Track user search history
- **Favorites**: Save favorite products
- **Business Dashboard**: Analytics and tracking for businesses

### Business Features

- **Affiliate Tracking**: Track clicks and conversions
- **Analytics Dashboard**: View business performance metrics
- **Domain Verification**: Verify business domains
- **Commission Management**: Manage affiliate commissions

### Technical Features

- **Real-time Search**: Fast product search with AI
- **Responsive Design**: Mobile-first responsive UI
- **Performance Optimized**: Optimized for speed and SEO
- **Security**: JWT authentication and input validation
- **Email Integration**: Automated email notifications

## 🔧 **API Endpoints**

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Search

- `POST /api/n8n-scrape` - Product search and scraping
- `GET /api/search-history` - Get user search history

### Business

- `POST /api/business/register` - Business registration
- `POST /api/business/login` - Business login
- `GET /api/business/stats` - Business analytics

### Tracking

- `POST /api/track-event` - Track post-redirect user events (page views, product
  views, add to cart, browse)

## 🛡️ **Security**

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 📈 **Performance**

- Optimized bundle size
- Lazy loading of components
- Image optimization
- Caching strategies
- Database query optimization

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Troubleshooting**

### Common Issues

**Q: Database connection errors** A: Ensure your `NETLIFY_DATABASE_URL` is
correctly set and the database is accessible.

**Q: Build errors** A: Make sure all dependencies are installed and Prisma
client is generated.

**Q: Authentication issues** A: Verify your JWT_SECRET is set and consistent
across deployments.

**Q: Email not sending** A: Check your Resend API key and email configuration.

## 📝 **Changelog**

### Latest Updates

- Migrated to Neon PostgreSQL database
- Optimized for Netlify deployment
- Enhanced search functionality
- Improved business analytics
- Added real-time tracking
- Performance optimizations
