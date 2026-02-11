# Technology Stack

## Core Framework & Language

- **Next.js 15** (App Router)
  - Server Components for optimal performance
  - API Routes for webhook endpoints
  - Server Actions for mutations
- **TypeScript 5+**
  - Strict mode enabled
  - Type-safe API interactions with Mollie

## Frontend

- **React 19**
- **Tailwind CSS 4**
  - Utility-first styling
- **shadcn/ui**
  - Modern, accessible component library built on Radix UI
  - Components: Tables, Forms, Dialogs, Tabs, Code blocks
- **React Hook Form** + **Zod**
  - Type-safe form validation
  - Schema validation for webhook configurations

## Backend & Database

- **MongoDB Atlas**
  - Cloud-hosted MongoDB
  - Collections: users, endpoints, webhooks, configurations
- **Mongoose**
  - Schema definitions with TypeScript integration
  - Model validation
- **Prisma** (Alternative consideration)
  - Could be used instead of Mongoose for better TypeScript integration

## Authentication & Authorization

- **NextAuth.js v5 (Auth.js)**
  - Credentials provider for email/password
  - Session management
  - Middleware for route protection
- **bcrypt**
  - Password hashing

## API & Data Fetching

- **Native fetch API**
  - For Mollie API calls
  - Webhook payload forwarding
- **Mollie API Client** (@mollie/api-client)
  - Official TypeScript SDK for Mollie integration
  - Resource fetching for classic webhooks

## Security

- **crypto (Node.js built-in)**
  - HMAC signature verification for next-gen webhooks
- **rate-limit** or **@upstash/ratelimit**
  - Rate limiting for webhook endpoints
- **helmet** (if using custom server)
  - Security headers
- **zod**
  - Runtime payload validation

## Development Tools

- **ESLint** + **Prettier**
  - Code quality and formatting
  - Next.js ESLint config
- **TypeScript ESLint**
  - TypeScript-specific linting rules
- **Husky** + **lint-staged**
  - Pre-commit hooks
- **tsx** or **ts-node**
  - TypeScript execution for scripts

## Testing (Optional but Recommended)

- **Vitest**
  - Fast unit testing
- **Playwright** or **Cypress**
  - E2E testing for critical flows
- **MSW (Mock Service Worker)**
  - API mocking for tests

## Monitoring & Logging

- **Vercel Analytics**
  - Built-in analytics
- **Vercel Log Drains** (Optional)
  - Structured logging to external services
- **Custom logging**
  - Winston or Pino for structured logs

## Deployment & Infrastructure

- **Vercel**
  - Auto-deployment from Git
  - Edge functions for webhook endpoints
  - Environment variables management
- **MongoDB Atlas**
  - M0 (Free tier) or M10 for production
  - Automatic backups
  - IP whitelisting for security

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...

# Application
NODE_ENV=production
```

## Package Manager

- **pnpm** (recommended) or **npm**
  - Fast, disk-efficient package manager

## Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-related routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   │   ├── webhooks/      # Webhook receivers
│   │   └── mollie/        # Mollie API proxy
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                  # Shared utilities
│   ├── db/              # Database connection & models
│   ├── mollie/          # Mollie API integration
│   ├── auth/            # Auth utilities
│   └── validation/      # Zod schemas
└── types/               # TypeScript type definitions
```

## Rationale

- **Next.js 15**: Modern React framework with excellent DX, server components, and Vercel integration
- **App Router**: New standard for Next.js, better performance and developer experience
- **shadcn/ui**: Copy-paste component library, no runtime overhead, full customization
- **MongoDB**: Flexible schema for varying webhook payloads, good for logs and unstructured data
- **NextAuth.js**: Battle-tested auth solution, integrates seamlessly with Next.js
- **Vercel**: Zero-config deployment, optimized for Next.js, edge network for global performance
