# Deployment Guide

This guide covers deploying the Webhook Analyzer to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment](#vercel-deployment-recommended)
3. [Environment Variables](#environment-variables)
4. [MongoDB Atlas Setup](#mongodb-atlas-setup)
5. [Domain Configuration](#domain-configuration)
6. [Mollie Configuration](#mollie-configuration)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- GitHub account (for code hosting)
- Vercel account (free tier is sufficient)
- MongoDB Atlas account (free M0 cluster is sufficient)
- Mollie account (test mode for development, live for production)

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying this Next.js application.

### Step 1: Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/yourusername/webhook-analyzer.git

# Push to GitHub
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required Variables:**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webhook-analyzer
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-app-name.vercel.app
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
NODE_ENV=production
```

**How to generate secrets:**
```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For ENCRYPTION_KEY
openssl rand -hex 32
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete. Your application will be available at `https://your-app-name.vercel.app`.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/webhook-analyzer` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your application | `https://webhook-analyzer.vercel.app` |
| `ENCRYPTION_KEY` | 32-byte hex key for API key encryption | Generate with `openssl rand -hex 32` |
| `NODE_ENV` | Environment mode | `production` |

### Security Notes

- **Never commit secrets to git**
- Use different secrets for development and production
- Rotate secrets periodically
- Use Vercel's secret management (they're encrypted at rest)

## MongoDB Atlas Setup

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new project (e.g., "Webhook Analyzer")
3. Click "Build a Database"
4. Choose **M0 Free Tier** (sufficient for most use cases)
5. Select a cloud provider and region (choose one close to your Vercel deployment)
6. Name your cluster (e.g., "webhook-analyzer")

### Step 2: Create Database User

1. Go to "Database Access" in Atlas
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Generate a strong password
5. Set database user privileges to "Atlas Admin" or "Read and write to any database"
6. Save the username and password

### Step 3: Configure Network Access

**Important:** Allow Vercel's IP addresses to access your database.

1. Go to "Network Access" in Atlas
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (`0.0.0.0/0`)
   - Note: This is safe because authentication is still required
   - Alternative: Add specific Vercel IP ranges (but they change frequently)

### Step 4: Get Connection String

1. Go to "Database" in Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with `webhook-analyzer` (or your preferred database name)

Example connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/webhook-analyzer?retryWrites=true&w=majority
```

### Performance Optimization

For production workloads with high traffic, consider:

- **Indexes**: The application creates indexes automatically, but monitor query performance
- **Upgrade Tier**: If you exceed M0 limits (512 MB storage), upgrade to M2/M5
- **Connection Pooling**: Already handled by Mongoose's default configuration

## Domain Configuration

### Using Custom Domain with Vercel

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `webhooks.yourdomain.com`)
4. Follow Vercel's DNS configuration instructions
5. Update `NEXTAUTH_URL` environment variable to your custom domain

### DNS Configuration

Add these records to your DNS:

**For root domain (example.com):**
```
A     @     76.76.21.21
AAAA  @     2606:4700:4700::1111
```

**For subdomain (webhooks.example.com):**
```
CNAME  webhooks  cname.vercel-dns.com
```

## Mollie Configuration

### Step 1: Create Webhook Endpoints

1. Deploy your application first
2. Log into your deployed application
3. Create webhook endpoints in the UI
4. Copy the webhook URLs

### Step 2: Configure Mollie Dashboard

**For Development (Test Mode):**
1. Go to [Mollie Dashboard](https://www.mollie.com/dashboard)
2. Enable "Test Mode" (toggle in top navigation)
3. Go to "Settings" → "Webhooks"
4. Add your webhook URLs from the application

**For Production (Live Mode):**
1. Switch to "Live Mode" in Mollie Dashboard
2. Go to "Settings" → "Webhooks"
3. Add your production webhook URLs
4. **Important**: Use live API keys, not test keys

### Step 3: Test Webhooks

**Test Mode:**
1. Create a test payment in Mollie Dashboard
2. Change its status to trigger webhooks
3. Verify webhooks are received in your application

**Live Mode:**
1. Create a real payment (small amount)
2. Complete the payment
3. Verify webhook is received

## Post-Deployment

### Step 1: Create Admin Account

1. Navigate to your deployed application
2. Click "Register" and create your admin account
3. Secure this account with a strong password

### Step 2: Add API Keys

1. Log into the application
2. Go to "API Keys"
3. Add your Mollie API keys:
   - Test key for development (`test_xxx`)
   - Live key for production (`live_xxx`)
4. Validate the keys to ensure they work

### Step 3: Create Endpoints

1. Go to "Endpoints"
2. Create your webhook endpoints
3. Copy the webhook URLs
4. Add them to Mollie Dashboard

### Step 4: Monitor

- Check "Webhook Logs" regularly for any failures
- Monitor endpoint health in the dashboard
- Set up alerts for critical issues (optional)

## Health Checks

### Verify Deployment

```bash
# Check application is running
curl https://your-app.vercel.app

# Check API is responding
curl https://your-app.vercel.app/api/auth/session
```

### Test Webhook Reception

```bash
# Send test webhook (replace with your endpoint URL)
curl -X POST https://your-app.vercel.app/api/webhooks/classic/USER_ID/ENDPOINT_ID \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id=tr_test123"
```

## Troubleshooting

### Build Failures

**Error: Type checking failed**
```bash
# Run type check locally
npx tsc --noEmit

# Fix any TypeScript errors before deploying
```

**Error: Missing environment variables**
- Verify all required environment variables are set in Vercel dashboard
- Check for typos in variable names
- Ensure no trailing spaces in values

### Runtime Errors

**Error: MongoDB connection timeout**
- Verify MongoDB Atlas connection string is correct
- Check Network Access settings in Atlas (whitelist IPs)
- Ensure database user has correct permissions

**Error: Session not working**
- Verify `NEXTAUTH_URL` matches your actual deployment URL
- Check `NEXTAUTH_SECRET` is set correctly
- Clear cookies and try logging in again

**Error: Webhooks not received (404)**
- Verify endpoint is enabled
- Check webhook URL format is correct
- Ensure user ID and endpoint ID in URL are valid

**Error: Signature verification failed**
- Verify shared secret matches Mollie configuration
- Check that webhook payload hasn't been modified
- Ensure Content-Type is `application/json`

### Performance Issues

**Slow database queries:**
- Check MongoDB Atlas cluster metrics
- Consider upgrading from M0 to M2/M5
- Review slow query logs in Atlas

**High response times:**
- Enable Vercel Analytics to identify bottlenecks
- Consider Edge Middleware for faster auth checks
- Optimize database queries with proper indexes

## Scaling Considerations

### When to Scale

Monitor these metrics:
- MongoDB storage approaching 512 MB (M0 limit)
- Sustained high CPU usage in Atlas
- Response times > 1 second
- More than 100 concurrent connections

### How to Scale

**Database:**
- Upgrade MongoDB Atlas tier (M2, M5, M10)
- Enable auto-scaling in Atlas
- Add read replicas for high read workloads

**Application:**
- Vercel scales automatically (serverless functions)
- No action needed for most workloads
- Consider Pro plan for higher limits

## Backup and Recovery

### Database Backups

MongoDB Atlas M0 (free tier):
- No automatic backups included
- Export data manually if needed

MongoDB Atlas M2+ (paid tiers):
- Continuous backups included
- Point-in-time recovery available

### Manual Backup

```bash
# Export all data
mongodump --uri="mongodb+srv://..." --out=backup

# Import data
mongorestore --uri="mongodb+srv://..." backup/
```

## Security Checklist

Before going live, verify:

- [ ] All environment variables use production values
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] `ENCRYPTION_KEY` is strong and unique
- [ ] MongoDB user has appropriate permissions (not admin if possible)
- [ ] MongoDB Network Access is configured correctly
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Test all authentication flows
- [ ] Verify signature verification works for next-gen webhooks
- [ ] Review CORS settings if using custom frontend
- [ ] Set up monitoring/logging solution (optional)

## Support

For issues specific to:
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **MongoDB Atlas**: [Atlas Documentation](https://docs.atlas.mongodb.com/)
- **Mollie**: [Mollie Documentation](https://docs.mollie.com/)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)

## Maintenance

### Regular Tasks

- Monitor webhook logs for failures
- Review endpoint health weekly
- Rotate secrets quarterly
- Update dependencies monthly (`npm update`)
- Monitor MongoDB storage usage

### Updates

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update Next.js major version (when ready)
npm install next@latest react@latest react-dom@latest
```

Deploy updates by pushing to GitHub (triggers automatic Vercel deployment).
