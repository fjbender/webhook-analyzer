# Copilot Instructions for webhook-analyzer

## Project Overview

A webhook catcher and analyzer for Mollie payment provider integrations. Allows developers to create temporary webhook endpoints, capture and inspect webhook payloads, and automatically fetch related API resources.

**Tech Stack**: Next.js 15 (App Router), TypeScript, MongoDB Atlas, NextAuth.js, shadcn/ui, Tailwind CSS, deployed on Vercel.

**Documentation**: See [TECH_STACK.md](.github/TECH_STACK.md) and [REQUIREMENTS.md](.github/REQUIREMENTS.md) for complete specifications.

## Build, Test, and Lint Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint
pnpm lint

# Type check
pnpm type-check

# Format
pnpm format
```

## Architecture

### Three Core Components

1. **UI/Dashboard** (`/app/(dashboard)`)
   - User authentication and profile management
   - Mollie API key configuration
   - Webhook endpoint creation and management
   - Webhook log viewing and inspection

2. **Classic Webhook Endpoints** (`/api/webhooks/classic`)
   - Receive reference-based webhooks (only resource ID)
   - Automatically fetch full resource from Mollie API
   - Store both original payload and fetched resource data
   - Support all Mollie resource types (payments, orders, refunds, etc.)

3. **Next-Gen Webhook Endpoints** (`/api/webhooks/nextgen`)
   - Receive payload-based webhooks (full data included)
   - HMAC signature verification using shared secret
   - Store validated payloads with signature status

### Data Flow

**Classic Webhooks**:
1. Mollie sends POST with `id` parameter → `/api/webhooks/classic/{userId}/{endpointId}`
2. Extract resource ID from payload
3. Fetch full resource using stored Mollie API key
4. Store both payloads in MongoDB
5. Return 200 OK to Mollie

**Next-Gen Webhooks**:
1. Mollie sends POST with full payload → `/api/webhooks/nextgen/{userId}/{endpointId}`
2. Verify HMAC signature from headers
3. If valid: store payload, return 200 OK
4. If invalid: log attempt, return 401

### Database Collections

- **users**: User accounts, settings, hashed passwords
- **mollieApiKeys**: Encrypted API keys with labels
- **webhookEndpoints**: Endpoint configurations (classic/nextgen)
- **webhookLogs**: Captured webhook payloads with metadata

## Key Conventions

### Code Organization

```
src/app/
  (auth)/           # Public auth pages (login, register)
  (dashboard)/      # Protected dashboard pages
  api/              # API routes
    webhooks/       # Webhook receivers
    mollie-keys/    # API key management
    endpoints/      # Endpoint CRUD
    
src/lib/
  db/               # MongoDB models and connection
  mollie/           # Mollie API client wrapper
  auth/             # Auth utilities and config
  validation/       # Zod schemas
  
src/components/
  ui/               # shadcn/ui components
  features/         # Feature-specific components
```

### TypeScript Patterns

- Use Zod schemas for all API inputs and webhook payloads
- Export types from Zod schemas: `type X = z.infer<typeof XSchema>`
- Use Mongoose with TypeScript for models
- Strict null checks enabled

### Security

- **Never** log or expose full API keys - show last 4 chars only
- **Always** verify signatures for next-gen webhooks
- **Always** use constant-time comparison for signatures
- Encrypt API keys at rest in database
- Use server components by default, client components only when needed

### Webhook Processing

- Return 200 OK immediately to Mollie, process asynchronously if needed
- Handle Mollie API fetch failures gracefully - store error, don't fail webhook
- Use exponential backoff for transient API errors
- Log all webhook attempts (valid or invalid) for debugging

### API Error Handling

- Return consistent error format: `{ error: string, details?: any }`
- Use HTTP status codes correctly (401, 403, 404, 422, 500)
- Log errors with context (userId, endpointId, etc.)

### Environment Variables

Required variables:
- `MONGODB_URI`: MongoDB Atlas connection string
- `NEXTAUTH_SECRET`: NextAuth session secret
- `NEXTAUTH_URL`: Application URL
- `ENCRYPTION_KEY`: For encrypting Mollie API keys (32 bytes hex)

### Testing Mollie Integration

- Use Mollie test mode API keys (`test_...`) during development
- Test webhook signature verification with mock signatures
- Use Mollie's webhook event descriptions documentation as reference

### UI Components

- Use shadcn/ui for all UI primitives
- Format JSON with syntax highlighting (use `react-json-view` or similar)
- Display timestamps in user's timezone
- Copy-to-clipboard for webhook URLs and payloads
- Mobile-responsive layouts
