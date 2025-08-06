# Vercel Deployment Guide

## Overview
This guide will help you deploy your app to Vercel. The app has been configured to work with Vercel's serverless environment.

## Prerequisites
1. **Vercel CLI**: Install Vercel CLI globally
   ```bash
   npm i -g vercel
   ```

2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

3. **Database**: You'll need to set up a Neon database and get the connection string

## Deployment Steps

### 1. Build the Project
```bash
npm run build:vercel
```

### 2. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

## Environment Variables

You'll need to set these environment variables in your Vercel project:

### Required Variables
- `DATABASE_URL` - Your Neon database connection string
- `JWT_SECRET` - Secret for JWT tokens

### Optional Variables
- `FRONTEND_URL` - Your frontend URL
- `NODE_ENV` - Set to "production"

## Setting Environment Variables

### Via Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable

### Via CLI
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

## Database Setup

Since you're moving from Netlify to Vercel, you'll need to:

1. **Create a new Neon database** (if you don't have one)
2. **Get the connection string** from Neon dashboard
3. **Set the DATABASE_URL** environment variable in Vercel

## Key Differences from Netlify

### Database Integration
- **Netlify**: Uses `@netlify/neon` with `NETLIFY_DATABASE_URL`
- **Vercel**: Uses `@neondatabase/serverless` with `DATABASE_URL`

### Server Configuration
- **Netlify**: Uses `netlify-server.ts` with serverless-http
- **Vercel**: Uses `vercel-server.ts` with direct Express export

### Build Process
- **Netlify**: Custom build with `vite.config.netlify-simple.ts`
- **Vercel**: Standard build with `package.json` scripts

## Testing the Deployment

After deployment, test these endpoints:
1. Health check: `https://your-app.vercel.app/api/health`
2. Debug: `https://your-app.vercel.app/api/debug/env`
3. Business auth: `https://your-app.vercel.app/api/business/auth/me`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check that `DATABASE_URL` is set correctly
   - Verify the Neon database is accessible
   - Test connection with `/api/debug/db`

2. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check that TypeScript compilation passes
   - Verify build scripts are correct

3. **API Routes Not Working**
   - Check that `vercel.json` routes are configured correctly
   - Verify the server file exports correctly
   - Check function logs in Vercel dashboard

### Debugging

1. **Check Function Logs**
   - Go to Vercel dashboard → Functions → View logs

2. **Test Database Connection**
   - Visit `/api/debug/db` endpoint

3. **Check Environment Variables**
   - Visit `/api/debug/env` endpoint

## Migration from Netlify

If you're migrating from Netlify to Vercel:

1. **Update database connection** to use standard Neon connection string
2. **Set environment variables** in Vercel dashboard
3. **Deploy the new configuration**
4. **Test all endpoints** to ensure functionality
5. **Update any hardcoded URLs** to point to Vercel domain

## Performance Optimization

Vercel provides several optimization features:

1. **Edge Functions**: For global performance
2. **Automatic HTTPS**: SSL certificates included
3. **CDN**: Global content delivery
4. **Analytics**: Built-in performance monitoring

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure monitoring** and alerts
3. **Set up CI/CD** for automatic deployments
4. **Optimize performance** based on analytics 