# API Documentation

This document describes the internal API routes used by the Webhook Analyzer application.

## Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth.js session. Unauthenticated requests will receive a `401 Unauthorized` response.

### Session Management

- **POST** `/api/auth/callback/credentials` - Login with email/password
- **GET** `/api/auth/session` - Get current session
- **POST** `/api/auth/signout` - Sign out current user
- **POST** `/api/auth/register` - Register new user account

## User Management

### Get User Profile

```http
GET /api/user
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile

```http
PUT /api/user
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com"
  }
}
```

### Change Password

```http
PUT /api/user/password
Content-Type: application/json

{
  "currentPassword": "oldpass123",
  "newPassword": "NewPass123"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

## Mollie API Keys

### List API Keys

```http
GET /api/mollie-keys
```

**Response:**
```json
{
  "apiKeys": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "label": "Production Key",
      "keyType": "live",
      "lastFourChars": "1234",
      "isValid": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create API Key

```http
POST /api/mollie-keys
Content-Type: application/json

{
  "label": "Test Key",
  "apiKey": "test_abcdef123456"
}
```

**Response:**
```json
{
  "message": "API key created successfully",
  "apiKey": {
    "_id": "507f1f77bcf86cd799439011",
    "label": "Test Key",
    "keyType": "test",
    "lastFourChars": "3456"
  }
}
```

### Get API Key

```http
GET /api/mollie-keys/[id]
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "label": "Test Key",
  "keyType": "test",
  "lastFourChars": "3456",
  "isValid": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Update API Key

```http
PUT /api/mollie-keys/[id]
Content-Type: application/json

{
  "label": "Updated Label"
}
```

### Delete API Key

```http
DELETE /api/mollie-keys/[id]
```

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

### Validate API Key

```http
POST /api/mollie-keys/[id]/validate
```

Tests the API key against Mollie's API and updates the `isValid` status.

**Response:**
```json
{
  "valid": true,
  "message": "API key is valid"
}
```

## Webhook Endpoints

### List Endpoints

```http
GET /api/endpoints
```

**Response:**
```json
{
  "endpoints": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "name": "Payment Webhooks",
      "type": "classic",
      "isEnabled": true,
      "mollieApiKeyId": {
        "_id": "507f191e810c19729de860eb",
        "label": "Production Key",
        "lastFourChars": "1234"
      },
      "webhookUrl": "https://app.example.com/api/webhooks/classic/507f191e810c19729de860ea/507f1f77bcf86cd799439011",
      "forwardingEnabled": true,
      "forwardingUrl": "http://localhost:8000/webhook",
      "totalReceived": 42,
      "lastReceivedAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Endpoint

```http
POST /api/endpoints
Content-Type: application/json

{
  "name": "Payment Webhooks",
  "type": "classic",
  "mollieApiKeyId": "507f191e810c19729de860eb",
  "forwardingEnabled": true,
  "forwardingUrl": "http://localhost:8000/webhook",
  "forwardingHeaders": {
    "X-Custom-Header": "value"
  },
  "forwardingTimeout": 30000
}
```

**For Next-Gen Webhooks:**
```json
{
  "name": "Next-Gen Webhooks",
  "type": "nextgen",
  "sharedSecret": "your_shared_secret_here",
  "forwardingEnabled": false
}
```

**Response:**
```json
{
  "message": "Endpoint created successfully",
  "endpoint": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Payment Webhooks",
    "type": "classic",
    "webhookUrl": "https://app.example.com/api/webhooks/classic/507f191e810c19729de860ea/507f1f77bcf86cd799439011"
  }
}
```

### Get Endpoint

```http
GET /api/endpoints/[id]
```

### Update Endpoint

```http
PUT /api/endpoints/[id]
Content-Type: application/json

{
  "name": "Updated Name",
  "forwardingUrl": "http://localhost:9000/webhook"
}
```

### Delete Endpoint

```http
DELETE /api/endpoints/[id]
```

**Note:** This does not delete associated webhook logs by default.

### Toggle Endpoint

```http
POST /api/endpoints/[id]/toggle
```

Enables or disables the endpoint.

**Response:**
```json
{
  "message": "Endpoint disabled successfully",
  "isEnabled": false
}
```

## Webhook Logs

### List Webhook Logs

```http
GET /api/webhook-logs?limit=50&offset=0&endpointId=507f1f77bcf86cd799439011&status=success
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `endpointId` (optional): Filter by endpoint ID
- `status` (optional): Filter by status (`success`, `invalid`, `signature_failed`)

**Response:**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "endpointId": {
        "_id": "507f191e810c19729de860ea",
        "name": "Payment Webhooks",
        "type": "classic"
      },
      "receivedAt": "2024-01-01T12:00:00.000Z",
      "status": "success",
      "resourceType": "payment",
      "resourceId": "tr_abc123",
      "processingTimeMs": 245,
      "ipAddress": "203.0.113.1",
      "forwardingStatus": 200,
      "isReplay": false
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

### Get Webhook Log Details

```http
GET /api/webhook-logs/[id]
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "endpointId": {
    "_id": "507f191e810c19729de860ea",
    "name": "Payment Webhooks",
    "type": "classic"
  },
  "receivedAt": "2024-01-01T12:00:00.000Z",
  "status": "success",
  "resourceType": "payment",
  "resourceId": "tr_abc123",
  "requestHeaders": {
    "content-type": "application/x-www-form-urlencoded",
    "user-agent": "Mollie/1.0"
  },
  "requestBody": {
    "id": "tr_abc123"
  },
  "rawBody": "id=tr_abc123",
  "fetchedResource": {
    "id": "tr_abc123",
    "amount": {
      "currency": "EUR",
      "value": "10.00"
    },
    "status": "paid"
  },
  "processingTimeMs": 245,
  "ipAddress": "203.0.113.1",
  "userAgent": "Mollie/1.0",
  "forwardedAt": "2024-01-01T12:00:01.000Z",
  "forwardingUrl": "http://localhost:8000/webhook",
  "forwardingStatus": 200,
  "forwardingTimeMs": 45
}
```

### Replay Webhook

```http
POST /api/webhook-logs/[id]/replay
Content-Type: application/json

{
  "target": "endpoint"
}
```

**Target Options:**
- `endpoint` - Replay to the original webhook endpoint
- `forward` - Replay to the forwarding URL (if configured)

**Response:**
```json
{
  "success": true,
  "replayLogId": "507f1f77bcf86cd799439012",
  "targetUrl": "https://app.example.com/api/webhooks/classic/...",
  "targetType": "endpoint",
  "status": 200,
  "timeMs": 125
}
```

## Webhook Receivers

These endpoints are publicly accessible (no authentication) and are intended to receive webhooks from Mollie.

### Classic Webhook Receiver

```http
POST /api/webhooks/classic/[userId]/[endpointId]
Content-Type: application/x-www-form-urlencoded

id=tr_abc123
```

**Process:**
1. Validates endpoint exists and is enabled
2. Extracts resource ID from payload
3. Determines resource type from ID prefix
4. Fetches full resource data from Mollie API
5. Stores webhook log with fetched resource
6. Forwards to configured URL (if enabled)
7. Returns `200 OK`

**Response:**
```json
{
  "ok": true
}
```

### Next-Gen Webhook Receiver

```http
POST /api/webhooks/nextgen/[userId]/[endpointId]
Content-Type: application/json
X-Mollie-Signature: sha256:abcdef123456...

{
  "event": "payment.created",
  "data": {
    "id": "tr_abc123",
    "amount": {
      "currency": "EUR",
      "value": "10.00"
    }
  }
}
```

**Process:**
1. Validates endpoint exists and is enabled
2. Verifies HMAC signature using shared secret
3. Stores webhook log with event data
4. Forwards to configured URL (if enabled)
5. Returns `200 OK` or `401 Unauthorized` (invalid signature)

**Response:**
```json
{
  "ok": true
}
```

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting for production deployments.

## Webhook Payload Formats

### Classic Webhook Format

Mollie sends form-urlencoded data:
```
id=tr_abc123
```

The application:
1. Preserves original format in `rawBody` field
2. Parses into object for processing: `{ "id": "tr_abc123" }`
3. Forwards with original format when forwarding is enabled

### Next-Gen Webhook Format

Mollie sends JSON data:
```json
{
  "event": "payment.paid",
  "data": {
    "id": "tr_abc123",
    "amount": { "currency": "EUR", "value": "10.00" },
    "status": "paid"
  }
}
```

The application:
1. Preserves raw JSON in `rawBody` field
2. Verifies signature using HMAC-SHA256
3. Forwards with original JSON when forwarding is enabled
