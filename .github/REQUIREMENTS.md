# Functional Requirements

## Overview

A webhook catcher and analyzer for Mollie payment provider integrations. Allows developers to create temporary webhook endpoints, capture webhook payloads, inspect them, and automatically fetch related API resources.

## Target Users

- Backend developers integrating Mollie payments
- QA engineers testing payment flows
- Developers using API clients (Postman/Yaak/Bruno) for manual testing

---

## 1. User Management & Authentication

### 1.1 User Registration
- Email/password registration
- Email validation (format check)
- Password requirements: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- Account activation (optional: email verification)

### 1.2 User Login
- Email/password authentication
- Session management (persistent sessions)
- "Remember me" functionality
- Logout capability

### 1.3 User Profile
- View/edit profile information
- Change password
- Delete account (cascade delete all associated data)

---

## 2. Configuration Management

### 2.1 Mollie API Configuration
- Store multiple Mollie API keys per user
- Label API keys (e.g., "Production", "Test", "Client A")
- Test API key validity (ping Mollie API)
- Mark default API key for convenience
- Securely store API keys (encrypted at rest)
- View last 4 characters only in UI

### 2.2 Global Settings
- Set default webhook retention period (e.g., 7 days, 30 days, forever)
- Configure notification preferences (optional)
- Timezone settings for timestamp display

---

## 3. Webhook Endpoint Management

### 3.1 Classic Webhook Endpoints (Reference-based)

**Purpose**: Handle Mollie's classic webhooks that contain only an ID reference

**Endpoint Creation**:
- Generate unique endpoint URL (e.g., `/api/webhooks/classic/{userId}/{endpointId}`)
- User-defined name/label (e.g., "Payment Test Endpoint")
- Select Mollie API key to use for resource fetching
- Optional: Resource type filter (payments, refunds, orders, subscriptions, etc.)
- Display generated webhook URL for copying to Mollie dashboard

**Webhook Processing**:
1. Receive POST request with `id` parameter
2. Extract resource ID from payload
3. Automatically fetch full resource from Mollie API using configured API key
4. Store both: original webhook payload + fetched resource data
5. Parse and identify resource type (payment, refund, order, etc.)
6. Return 200 OK immediately to Mollie

**Resource Fetching**:
- Support all Mollie resource types:
  - Payments (`GET /v2/payments/{id}`)
  - Orders (`GET /v2/orders/{id}`)
  - Refunds (`GET /v2/payments/{id}/refunds/{id}`)
  - Subscriptions (`GET /v2/customers/{id}/subscriptions/{id}`)
  - Mandates (`GET /v2/customers/{id}/mandates/{id}`)
- Handle API errors gracefully (store error if fetch fails)
- Retry logic for transient failures (optional)

### 3.2 Next-Gen Webhook Endpoints (Payload-based)

**Purpose**: Handle Mollie's next-gen webhooks with full payload and signature verification

**Endpoint Creation**:
- Generate unique endpoint URL (e.g., `/api/webhooks/nextgen/{userId}/{endpointId}`)
- User-defined name/label
- Configure shared secret (provided by Mollie)
- Optional: Event type filters (subscription.created, payment.paid, etc.)
- Display webhook URL for Mollie configuration

**Webhook Processing**:
1. Receive POST request with full JSON payload
2. Extract signature from headers (`Mollie-Signature` or similar)
3. Verify HMAC signature using shared secret
4. If signature invalid: return 401 Unauthorized, log attempt
5. If signature valid: store payload, return 200 OK
6. Parse event type and resource data

**Signature Verification**:
- HMAC-SHA256 signature validation
- Compare computed signature with header signature
- Constant-time comparison to prevent timing attacks
- Log failed verification attempts with timestamp and IP

### 3.3 Common Endpoint Features

**Endpoint Management**:
- List all endpoints (with status indicators)
- Enable/disable endpoints without deleting
- Edit endpoint configuration
- Delete endpoint (with confirmation)
- View endpoint statistics (total webhooks received, last received)
- Copy webhook URL to clipboard (one-click)

**Endpoint Settings**:
- Custom retention period per endpoint (override global setting)
- Auto-archive old webhooks
- Rate limiting per endpoint (prevent abuse)

---

## 4. Webhook Logs & Inspection

### 4.1 Webhook Log List

**Views**:
- All webhooks across all endpoints
- Webhooks filtered by endpoint
- Search by resource ID or content
- Filter by:
  - Date range
  - Resource type (payment, order, refund, etc.)
  - Status (success, failed signature, fetch error)
  - Event type (for next-gen webhooks)

**Display Columns**:
- Timestamp (with timezone)
- Endpoint name
- Resource type/ID or Event type
- Status indicator (success/warning/error)
- Quick preview (first 100 chars of payload)

**Pagination**:
- Default: 50 webhooks per page
- Load more / infinite scroll

### 4.2 Webhook Detail View

**Classic Webhook Details**:
- Timestamp and duration
- Endpoint information
- Original webhook payload (formatted JSON)
- Fetched resource data (formatted JSON)
- Resource metadata:
  - Resource type
  - Resource ID
  - Status (e.g., payment status: paid, failed)
  - Amount and currency (if applicable)
- HTTP request details:
  - Headers received
  - IP address
  - User agent

**Next-Gen Webhook Details**:
- Timestamp and duration
- Endpoint information
- Full webhook payload (formatted JSON)
- Event type and resource
- Signature verification status
- HTTP request details:
  - All headers (including signature header)
  - IP address
  - Signature validation result

**Common Features**:
- Syntax-highlighted JSON
- Collapsible sections
- Copy payload to clipboard
- Copy specific fields
- Download payload as JSON file
- Permalink to webhook (shareable within account)

### 4.3 Webhook Replay

**Purpose**: Re-send captured webhooks for testing and debugging

**Replay Functionality**:
- Replay button on webhook detail view
- Re-sends original webhook payload
- Can replay to:
  - Original endpoint (for re-processing)
  - Configured forward URL (for testing integrations)
  - Different endpoint (for comparison)
- Shows replay status and result
- Logs replay attempts with timestamps

**Use Cases**:
- Re-test failed webhooks
- Test changes to endpoint processing
- Replay production webhooks to development
- Validate bug fixes without waiting for new webhooks

---

## 5. Webhook Forwarding (Proxy)

### 5.1 Forwarding Configuration

**Per-Endpoint Settings**:
- Enable/disable forwarding toggle
- Forward destination URL (your application's webhook endpoint)
- Forward method (POST, PUT, PATCH)
- Custom headers (optional)
- Forward timeout (default: 30 seconds)
- Retry policy (optional)

**Forwarding Behavior**:
- Forward happens after webhook is processed and stored
- Sends original webhook payload to destination
- Includes original headers (except auth/signature headers)
- Non-blocking (doesn't delay response to Mollie)
- Logs forwarding result (success/failure)

### 5.2 Forwarding Results

**Logged Information**:
- Forward timestamp
- Destination URL
- HTTP status code received
- Response time
- Response body (if error)
- Retry attempts (if configured)

**Display in UI**:
- Forwarding status column in webhook logs
- Forwarding details in webhook inspection modal
- Filter by forwarding status
- Statistics: successful vs. failed forwards

### 5.3 Use Cases

**Development Workflow**:
1. Configure forwarding to local development server
2. Test Mollie webhooks reach local environment
3. Inspect both original webhook and forwarding result

**Integration Testing**:
1. Configure forwarding to staging environment
2. Test integration without configuring webhooks in Mollie
3. Replay captured webhooks for regression testing

**Debugging**:
1. Capture production webhooks
2. Forward to development with modified data
3. Debug without affecting production

---

## 6. Dashboard & Overview

### 6.1 Dashboard Home (Simplified for Dev Tool)
- Quick stats:
  - Total endpoints created
  - Total webhooks received
  - Active endpoints count
- Recent webhook activity (last 10)
- Quick actions:
  - Create new endpoint
  - View all webhooks
  - Configure API keys

**Note**: Analytics and charts are considered future enhancements, not MVP features for a dev tool.

---

## 7. Security Requirements

### 6.1 Authentication Security
- Password hashing with bcrypt (salt rounds: 10+)
- Session tokens (httpOnly, secure cookies)
- CSRF protection (Next.js built-in)
- Rate limiting on login attempts

### 6.2 API Security
- Rate limiting on webhook endpoints (prevent abuse)
- API key encryption at rest in database
- Signature verification for next-gen webhooks
- Input validation on all user inputs

### 6.3 Data Privacy
- Users can only access their own data
- No cross-user data leakage
- Soft delete option (archive instead of hard delete)
- Webhook data retention policies

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Webhook endpoint response time: <200ms (excluding Mollie API fetch)
- UI page load: <2s on 3G network
- Support concurrent webhooks (multiple per second per user)

### 7.2 Reliability
- 99.9% uptime target (for dev tool usage)
- Webhook data stored durably (MongoDB Atlas)
- Graceful handling of Mollie API errors

### 7.3 Scalability
- Support multiple users concurrently
- Horizontal scaling via Vercel serverless functions
- Database indexing for quick webhook lookups

### 7.4 Usability
- Mobile-responsive UI
- Keyboard shortcuts for power users (optional)
- Clear error messages
- Intuitive navigation

---

## 8. Data Models

### 8.1 User
```typescript
{
  id: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}
```

### 8.2 MollieApiKey
```typescript
{
  id: string
  userId: string
  label: string
  encryptedKey: string
  lastFourChars: string
  isDefault: boolean
  isValid: boolean
  lastValidatedAt: Date
  createdAt: Date
}
```

### 8.3 WebhookEndpoint
```typescript
{
  id: string
  userId: string
  name: string
  type: 'classic' | 'nextgen'
  isEnabled: boolean
  
  // For classic webhooks
  mollieApiKeyId?: string
  resourceTypeFilter?: string[]
  
  // For next-gen webhooks
  sharedSecret?: string
  eventTypeFilter?: string[]
  
  // Forwarding configuration
  forwardingEnabled: boolean
  forwardingUrl?: string
  forwardingHeaders?: Record<string, string>
  forwardingTimeout?: number // milliseconds, default 30000
  
  retentionDays?: number
  createdAt: Date
  updatedAt: Date
  lastReceivedAt?: Date
  totalReceived: number
}
```

### 8.4 WebhookLog
```typescript
{
  id: string
  endpointId: string
  userId: string
  
  receivedAt: Date
  processingTimeMs: number
  
  // Request details
  requestHeaders: Record<string, string>
  requestBody: any
  ipAddress: string
  userAgent: string
  
  // For classic webhooks
  resourceType?: string
  resourceId?: string
  fetchedResource?: any
  fetchError?: string
  
  // For next-gen webhooks
  eventType?: string
  signatureValid?: boolean
  signatureHeader?: string
  
  // Forwarding details
  forwardedAt?: Date
  forwardingUrl?: string
  forwardingStatus?: number // HTTP status code
  forwardingError?: string
  forwardingTimeMs?: number
  
  status: 'success' | 'signature_failed' | 'fetch_failed' | 'invalid'
  
  // Replay tracking
  isReplay?: boolean
  originalLogId?: string // if this is a replayed webhook
  replayedAt?: Date
  replayedBy?: string // userId who triggered replay
}
```

---

## 9. API Endpoints (Internal)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Mollie API Keys
- `GET /api/mollie-keys` - List user's API keys
- `POST /api/mollie-keys` - Add new API key
- `PUT /api/mollie-keys/:id` - Update API key
- `DELETE /api/mollie-keys/:id` - Delete API key
- `POST /api/mollie-keys/:id/validate` - Test API key

### Webhook Endpoints
- `GET /api/endpoints` - List user's endpoints
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints/:id` - Get endpoint details
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint
- `POST /api/endpoints/:id/toggle` - Enable/disable endpoint

### Webhook Logs
- `GET /api/webhook-logs` - List webhooks (with filters)
- `GET /api/webhook-logs/:id` - Get webhook details
- `DELETE /api/webhook-logs/:id` - Delete webhook log
- `POST /api/webhook-logs/:id/replay` - Replay webhook

### Webhook Receivers (Public)
- `POST /api/webhooks/classic/:userId/:endpointId` - Receive classic webhook
- `POST /api/webhooks/nextgen/:userId/:endpointId` - Receive next-gen webhook

### User Settings
- `GET /api/user` - Get user profile
- `PUT /api/user` - Update user profile
- `PUT /api/user/password` - Change password

---

## 10. Future Enhancements (Out of Scope for MVP)

- Custom transformations/filters on webhook data before forwarding
- Team accounts with shared endpoints
- Webhook testing tool (manually send test webhooks)
- Export webhook logs to CSV
- Webhook comparison tool (diff two payloads)
- Conditional forwarding based on payload content
- Advanced retry logic for failed forwards
- Real-time dashboard updates via WebSocket
- Webhook statistics and analytics charts
