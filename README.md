# Webhook Analyzer

A modern webhook catcher and analyzer for Mollie payment provider integrations. Built for developers to easily test, debug, and analyze Mollie webhook implementations during development.

## ✨ Features

### Core Features
- 🔐 **Secure Authentication** - User registration and login with bcrypt password hashing
- 🔑 **API Key Management** - Securely store and manage multiple Mollie API keys (encrypted at rest)
- 📡 **Classic Webhooks** - Automatic resource fetching for Mollie's reference-based webhooks
- ✨ **Next-Gen Webhooks** - Full signature verification for payload-based webhooks
- 📋 **Webhook Inspection** - View, filter, and analyze captured webhook payloads with detailed request information
- 🎯 **Real-time Logging** - Capture and store all webhook attempts with full request/response data

### Advanced Features
- 🔄 **Webhook Forwarding** - Automatically forward webhooks to your local development server
- 🔁 **Replay Functionality** - Re-send captured webhooks to endpoints or forwarding targets
- 🎨 **Multiple Endpoints** - Create unlimited webhook endpoints per user
- 📊 **Request Statistics** - Track success rates, response times, and endpoint health
- 🔍 **Payload Preservation** - Maintains original payload format (form-encoded or JSON)
- ⚙️ **User Settings** - Manage profile and change password

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Validation**: Zod schemas
- **HTTP Client**: Native Fetch API
- **Encryption**: Node.js crypto module (AES-256-CBC)
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or 20+
- **MongoDB Atlas** account (free M0 tier is sufficient)
- **Mollie** test account (for testing webhooks)

### Quick Start

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd webhook-analyzer
npm install
```

2. **Set up MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster (M0 tier)
   - Click "Connect" → "Connect your application"
   - Copy your connection string

3. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
# MongoDB connection string from step 2
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webhook-analyzer?retryWrites=true&w=majority

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Your application URL
NEXTAUTH_URL=http://localhost:3000

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your-generated-encryption-key-here

NODE_ENV=development
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Register a new account
   - Add your Mollie API key
   - Create webhook endpoints
   - Start receiving webhooks!

### Production Deployment

#### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important**: Make sure to whitelist your Vercel deployment URL in MongoDB Atlas Network Access.

#### Environment Variables for Production

Set these in your Vercel dashboard (or hosting provider):
- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Strong random secret
- `NEXTAUTH_URL` - Your production URL (e.g., https://webhook-analyzer.vercel.app)
- `ENCRYPTION_KEY` - Strong random encryption key
- `NODE_ENV=production`

## 📖 Documentation

### For Developers
- [Setup Instructions](SETUP.md) - Detailed setup guide
- [Tech Stack Details](.github/TECH_STACK.md) - Technical architecture
- [Functional Requirements](.github/REQUIREMENTS.md) - Feature specifications

### Using the Application

#### 1. API Keys Management
- Navigate to "API Keys" in the dashboard
- Click "Add API Key" to add a Mollie API key
- Keys are encrypted at rest for security
- Label your keys for easy identification
- Validate keys to ensure they're working

#### 2. Creating Webhook Endpoints

**Classic Webhooks:**
- Select "Classic" webhook type
- Choose a Mollie API key (required for resource fetching)
- The endpoint automatically fetches full resource data from Mollie
- Best for: Traditional Mollie webhooks that send only an ID

**Next-Gen Webhooks:**
- Select "Next-Gen" webhook type
- Enter your shared secret for signature verification
- Webhooks include full event payload
- Signature validation ensures authenticity
- Best for: Modern Mollie webhooks with complete event data

**Forwarding Configuration:**
- Enable forwarding to send webhooks to your local dev server
- Add forwarding URL (e.g., `http://localhost:8000/webhook`)
- Optionally add custom headers
- Set timeout (default: 30 seconds)
- Forwarding preserves original payload format

#### 3. Viewing Webhook Logs
- All received webhooks appear in "Webhook Logs"
- Filter by endpoint, status, or date
- Click any log to view full details:
  - Request headers and body
  - Fetched resource data (classic webhooks)
  - Signature validation status (next-gen webhooks)
  - Forwarding results
  - Processing time and metadata

#### 4. Replaying Webhooks
- Open any webhook log detail
- Click "Replay to Endpoint" to re-send to the original endpoint
- Click "Replay to Forward" to re-send to forwarding URL
- Maintains original payload format
- Creates new log entry for the replay

#### 5. User Settings
- Update email address
- Change password (minimum 8 characters, must include uppercase, lowercase, and numbers)

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **API Key Encryption**: AES-256-CBC encryption for stored API keys
- **Shared Secret Encryption**: Encrypted webhook shared secrets
- **Signature Verification**: HMAC-SHA256 for next-gen webhooks
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built into NextAuth.js
- **Environment Isolation**: Secrets stored in environment variables

## 📁 Project Structure

```
webhook-analyzer/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints (NextAuth)
│   │   ├── endpoints/            # Endpoint CRUD operations
│   │   ├── mollie-keys/          # API key management
│   │   ├── user/                 # User profile & password
│   │   ├── webhook-logs/         # Webhook log queries & replay
│   │   └── webhooks/             # Webhook receivers
│   │       ├── classic/          # Classic webhook handler
│   │       └── nextgen/          # Next-gen webhook handler
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── api-keys/            # API keys management UI
│   │   ├── endpoints/           # Endpoints management UI
│   │   ├── settings/            # User settings UI
│   │   └── webhooks/            # Webhook logs UI
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   ├── layout.tsx               # Root layout with auth provider
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   ├── settings/                # Settings page components
│   ├── add-api-key-dialog.tsx  # API key creation modal
│   ├── api-keys-list.tsx       # API keys table
│   ├── auth-provider.tsx       # NextAuth session provider
│   ├── create-endpoint-dialog.tsx # Endpoint creation modal
│   ├── dashboard-nav.tsx       # Dashboard navigation
│   ├── edit-endpoint-dialog.tsx # Endpoint editing modal
│   ├── endpoints-list.tsx      # Endpoints table
│   ├── user-nav.tsx            # User dropdown menu
│   └── webhook-detail-modal.tsx # Webhook inspection modal
├── lib/                         # Shared utilities
│   ├── auth/                    # Auth configuration
│   │   └── config.ts           # NextAuth.js configuration
│   ├── db/                      # Database layer
│   │   ├── connection.ts       # MongoDB connection
│   │   └── models/             # Mongoose models
│   │       ├── User.ts         # User model
│   │       ├── MollieApiKey.ts # API key model
│   │       ├── WebhookEndpoint.ts # Endpoint model
│   │       └── WebhookLog.ts   # Webhook log model
│   ├── mollie/                  # Mollie integration
│   │   ├── client.ts           # Mollie API client
│   │   └── resources.ts        # Resource fetching logic
│   ├── validation/              # Zod schemas
│   │   ├── auth.ts             # Auth validation
│   │   ├── endpoints.ts        # Endpoint validation
│   │   └── mollie-keys.ts      # API key validation
│   ├── crypto.ts                # Encryption utilities
│   ├── forwarding.ts            # Webhook forwarding logic
│   └── utils.ts                 # Shared utilities
├── types/                       # TypeScript types
│   └── next-auth.d.ts          # NextAuth type extensions
├── public/                      # Static assets
│   └── favicon.svg             # Webhook icon favicon
├── .env.local                   # Environment variables (not in git)
├── .env.example                 # Environment template
├── middleware.ts                # Next.js middleware (auth protection)
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
├── README.md                    # This file
└── SETUP.md                     # Detailed setup instructions
```

## 🛠️ Development

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Lint code
npm run lint
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas Network Access
- Check username/password are URL-encoded in connection string
- Verify database name in connection string
- Test connection with MongoDB Compass

### Webhook Not Being Received
- Check endpoint is enabled (toggle in UI)
- Verify URL is publicly accessible (use ngrok for local testing)
- Check Mollie webhook configuration matches your endpoint URL
- Review webhook logs for error messages

### Forwarding Not Working
- Ensure forwarding is enabled on the endpoint
- Verify forwarding URL is accessible from server
- Check timeout settings (increase if target is slow)
- Review webhook log for forwarding error details

### Signature Verification Failed (Next-Gen)
- Verify shared secret matches Mollie webhook configuration
- Ensure shared secret was decrypted correctly
- Check that webhook payload hasn't been modified in transit

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+ or 20+
```

## 🤝 Contributing

This is a development tool built for internal use. Feel free to fork and customize for your needs.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Webhooks powered by [Mollie](https://www.mollie.com/)
