# Development Roadmap

This document outlines the recommended order for implementing features.

## Phase 1: Foundation (Days 1-2)

### 1.1 Install Dependencies & Verify Setup
```bash
npm install
# Set up .env.local following SETUP.md
npm run dev
```

### 1.2 Authentication Setup
- [ ] Configure NextAuth.js in `lib/auth/config.ts`
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Build `app/(auth)/login/page.tsx`
- [ ] Build `app/(auth)/register/page.tsx`
- [ ] Create middleware for route protection
- [ ] Add necessary shadcn/ui components: `button`, `input`, `label`, `form`

**Test**: Register a user, log in, verify session

## Phase 2: Dashboard Layout (Days 3-4)

### 2.1 Protected Layout
- [ ] Create `app/(dashboard)/layout.tsx` with navigation
- [ ] Add navigation sidebar/header
- [ ] Create `app/(dashboard)/page.tsx` (dashboard home)
- [ ] Add shadcn/ui components: `dropdown-menu`, `avatar`

### 2.2 Basic Pages Structure
- [ ] Create `app/(dashboard)/api-keys/page.tsx` (empty)
- [ ] Create `app/(dashboard)/endpoints/page.tsx` (empty)
- [ ] Create `app/(dashboard)/webhooks/page.tsx` (empty)
- [ ] Create `app/(dashboard)/settings/page.tsx` (empty)

**Test**: Navigate between pages, verify auth protection

## Phase 3: API Keys Management (Days 5-6)

### 3.1 API Routes
- [ ] Create `app/api/mollie-keys/route.ts` (GET, POST)
- [ ] Create `app/api/mollie-keys/[id]/route.ts` (PUT, DELETE)
- [ ] Create `app/api/mollie-keys/[id]/validate/route.ts` (POST)
- [ ] Add Zod validation schemas in `lib/validation/`

### 3.2 UI Components
- [ ] Build API keys list component
- [ ] Build add/edit API key form
- [ ] Add delete confirmation dialog
- [ ] Add test/validate button functionality
- [ ] Add shadcn/ui: `table`, `dialog`, `toast`, `select`

**Test**: Add API key, encrypt/decrypt, validate with Mollie API, delete key

## Phase 4: Webhook Endpoints Management (Days 7-9)

### 4.1 API Routes
- [ ] Create `app/api/endpoints/route.ts` (GET, POST)
- [ ] Create `app/api/endpoints/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Create `app/api/endpoints/[id]/toggle/route.ts` (POST)
- [ ] Add validation schemas for endpoint creation

### 4.2 UI Components
- [ ] Build endpoints list with status indicators
- [ ] Build create endpoint form (classic type)
- [ ] Build create endpoint form (next-gen type)
- [ ] Add copy-to-clipboard for webhook URLs
- [ ] Show endpoint statistics
- [ ] Add shadcn/ui: `tabs`, `badge`, `card`

**Test**: Create classic endpoint, create next-gen endpoint, copy URL, toggle enable/disable

## Phase 5: Webhook Receivers (Days 10-12)

### 5.1 Classic Webhook Handler
- [ ] Complete `app/api/webhooks/classic/[userId]/[endpointId]/route.ts`
- [ ] Implement endpoint validation
- [ ] Parse resource ID from payload
- [ ] Integrate Mollie API client in `lib/mollie/client.ts`
- [ ] Fetch resource from Mollie API
- [ ] Store webhook log in MongoDB
- [ ] Handle errors gracefully

### 5.2 Next-Gen Webhook Handler
- [ ] Complete `app/api/webhooks/nextgen/[userId]/[endpointId]/route.ts`
- [ ] Extract signature from headers
- [ ] Verify HMAC signature
- [ ] Store webhook log with signature status
- [ ] Handle invalid signatures

**Test**: Send test webhooks from Mollie dashboard or Postman, verify storage

## Phase 6: Webhook Logs Viewing (Days 13-15)

### 6.1 API Routes
- [ ] Create `app/api/webhooks/route.ts` (GET with filters)
- [ ] Create `app/api/webhooks/[id]/route.ts` (GET, DELETE)
- [ ] Add pagination support
- [ ] Add filtering (date range, endpoint, status)
- [ ] Add search functionality

### 6.2 UI Components
- [ ] Build webhooks list with filters
- [ ] Build webhook detail page with JSON viewer
- [ ] Add syntax highlighting for JSON
- [ ] Add copy payload button
- [ ] Add download as JSON button
- [ ] Show request headers and metadata
- [ ] Add shadcn/ui: `code`, `separator`, `popover`

**Test**: View webhooks, filter by date/endpoint, inspect payload, verify fetched resources

## Phase 7: User Settings (Day 16) ✅

### 7.1 Settings Page
- [x] Build user profile form
- [x] Add change password form
- [x] Create `app/api/user/route.ts` (GET, PUT)
- [x] Create `app/api/user/password/route.ts` (PUT)

**Test**: Update profile, change password

## Phase 8: Webhook Forwarding & Replay (Days 17-18) ✅

### 8.1 Forwarding Configuration
- [x] Add forwarding URL field to endpoint model
- [x] Add forwarding toggle to endpoint creation/edit UI
- [x] Add forwarding headers and timeout configuration

### 8.2 Forwarding Logic
- [x] Modify webhook receivers to forward after processing
- [x] Forward request to configured URL with original payload
- [x] Log forwarding result (success/failure)
- [x] Handle forwarding errors gracefully
- [x] Add timeout for forwarding requests

### 8.3 Replay Functionality
- [x] Add "Replay" button to webhook detail modal
- [x] Create `app/api/webhook-logs/[id]/replay/route.ts`
- [x] Re-send webhook to endpoint or forward URL
- [x] Show replay status in UI
- [x] Mark replayed webhooks with badge

### 8.4 UI Enhancements
- [x] Add forwarding status column to webhook logs
- [x] Show forwarding URL in endpoint details
- [x] Add forwarding response in webhook detail modal
- [x] Show replay badge for replayed webhooks

**Test**: Configure forwarding URL, receive webhook, verify forwarding works, test replay

## Phase 9: Polish & Documentation (Days 19-20)

### 9.1 UX Improvements
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts (optional)
- [ ] Add empty states (mostly done)

### 9.2 Documentation
- [ ] Add API documentation
- [ ] Add user guide
- [ ] Update README with screenshots

**Test**: Full end-to-end testing of all features

## Optional Enhancements (Future)

- [ ] Custom transformations before forwarding
- [ ] Team accounts / multi-user workspaces
- [ ] Webhook comparison tool
- [ ] Real-time updates via WebSocket
- [ ] Export webhook logs to CSV
- [ ] Rate limiting per endpoint
- [ ] Retry logic for failed forwards
- [ ] Conditional forwarding based on payload content

## Quick Reference

### Essential shadcn/ui Components to Install

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
```

### Key Testing Endpoints

- Classic webhook: `POST /api/webhooks/classic/{userId}/{endpointId}`
- Next-gen webhook: `POST /api/webhooks/nextgen/{userId}/{endpointId}`
- Mollie test webhooks: https://my.mollie.com/dashboard/developers/webhooks

### Useful Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build
```
