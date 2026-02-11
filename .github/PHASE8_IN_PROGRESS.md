# Phase 8: Webhook Forwarding & Replay - IN PROGRESS

## Overview
Implementing webhook forwarding to external URLs and replay functionality for debugging. Phase is approximately 70% complete.

## Implementation Date
Started: February 11, 2026

## ✅ Completed Work

### 1. Data Models Updated

#### WebhookEndpoint Model (`lib/db/models/WebhookEndpoint.ts`)
Added forwarding configuration fields:
- `forwardingEnabled: boolean` - Toggle forwarding on/off
- `forwardingUrl: string` - Destination URL for forwarding
- `forwardingHeaders: Record<string, string>` - Custom headers
- `forwardingTimeout: number` - Timeout in ms (default: 30000)

#### WebhookLog Model (`lib/db/models/WebhookLog.ts`)
Added forwarding and replay tracking fields:
- `forwardedAt: Date` - When webhook was forwarded
- `forwardingUrl: string` - URL it was forwarded to
- `forwardingStatus: number` - HTTP status code received
- `forwardingError: string` - Error message if failed
- `forwardingTimeMs: number` - Time taken to forward
- `isReplay: boolean` - Marks replayed webhooks
- `originalLogId: ObjectId` - Reference to original webhook
- `replayedAt: Date` - When replay occurred
- `replayedBy: ObjectId` - User who triggered replay

### 2. Validation Schemas Updated

Updated `lib/validation/endpoints.ts`:
- Added forwarding fields to `baseEndpointSchema`
- URL validation for `forwardingUrl`
- Timeout range validation (1000-60000ms)
- Headers as record of strings

### 3. Forwarding Utility Created

New file: `lib/forwarding.ts`
- `forwardWebhook()` function with timeout handling
- AbortController for request cancellation
- Comprehensive error handling
- Returns success/failure with timing metrics

### 4. Webhook Receivers Updated

#### Classic Webhook Receiver
File: `app/api/webhooks/classic/[userId]/[endpointId]/route.ts`
- Added `forwardWebhookAsync()` helper function
- Forwards after processing and storing webhook
- Non-blocking (doesn't delay response to Mollie)
- Updates webhook log with forwarding result

#### Next-Gen Webhook Receiver
File: `app/api/webhooks/nextgen/[userId]/[endpointId]/route.ts`
- Same forwarding implementation as classic
- Only forwards if signature is valid
- Logs forwarding results asynchronously

### 5. Replay API Created

New file: `app/api/webhook-logs/[id]/replay/route.ts`
- POST endpoint to replay webhooks
- Supports two targets:
  1. `endpoint` - Replay to original webhook endpoint
  2. `forward` - Replay to configured forwarding URL
- Creates new webhook log entry marked as replay
- Links back to original webhook via `originalLogId`
- Returns replay status and timing

## 🔄 Remaining Work

### 6. UI Components (NOT YET STARTED)

#### Update CreateEndpointDialog
- [ ] Add "Forwarding" section to form
- [ ] Toggle for enabling/disabling forwarding
- [ ] Input for forwarding URL
- [ ] Custom headers editor (key-value pairs)
- [ ] Timeout selector (dropdown or input)
- [ ] Show forwarding config in endpoint list

#### Update WebhookDetailModal
- [ ] Add "Replay" button to header
- [ ] Show forwarding status badge
- [ ] Display forwarding details section:
  - Forwarded At timestamp
  - Forwarding URL
  - HTTP Status Code
  - Response Time
  - Error message (if failed)
- [ ] Show replay information if webhook is a replay:
  - "Replayed from" link to original
  - Replayed At timestamp
  - Replayed By user

#### Update Webhooks Page
- [ ] Add "Forwarding" column to table
  - Show status badge (success/failed/not forwarded)
  - Show forwarding time
- [ ] Add filter for forwarding status
  - All
  - Forwarded (success)
  - Forwarding Failed
  - Not Forwarded
- [ ] Show replay badge for replayed webhooks

#### Update Endpoints List
- [ ] Add forwarding URL column (truncated)
- [ ] Show forwarding enabled/disabled badge
- [ ] Add forwarding config to endpoint detail view

## Files Created
1. `lib/forwarding.ts` - Forwarding utility
2. `app/api/webhook-logs/[id]/replay/route.ts` - Replay API

## Files Modified
1. `lib/db/models/WebhookEndpoint.ts` - Added forwarding fields
2. `lib/db/models/WebhookLog.ts` - Added forwarding + replay fields
3. `lib/validation/endpoints.ts` - Added forwarding validation
4. `app/api/webhooks/classic/[userId]/[endpointId]/route.ts` - Added forwarding
5. `app/api/webhooks/nextgen/[userId]/[endpointId]/route.ts` - Added forwarding

## Technical Details

### Forwarding Flow
1. Webhook received and processed normally
2. Webhook log saved to database
3. If `forwardingEnabled && forwardingUrl`:
   - Call `forwardWebhookAsync()` (non-blocking)
   - Forward original payload to destination URL
   - Log result back to webhook log entry
4. Return 200 OK to Mollie (never block)

### Replay Flow
1. User clicks "Replay" on webhook detail
2. POST to `/api/webhook-logs/:id/replay`
3. Fetch original webhook payload
4. Forward to selected target (endpoint or forward URL)
5. Create new webhook log entry with `isReplay: true`
6. Return result to UI

### Error Handling
- Network timeouts handled gracefully
- Non-blocking forwarding prevents Mollie delivery failures
- All errors logged but don't affect webhook processing
- Replay failures return error to user

## Known Issues

1. **Next.js 15 Type Error** - Some API routes need params type fix:
   ```typescript
   // Old (causing error)
   type RouteParams = {
     params: { id: string };
   };
   
   // New (correct for Next.js 15)
   type RouteParams = {
     params: Promise<{ id: string }>;
   };
   ```
   Affects: `app/api/mollie-keys/[id]/route.ts` and possibly others

## Testing Checklist (For Remaining UI Work)

### Forwarding Configuration
- [ ] Create endpoint with forwarding enabled
- [ ] Specify forwarding URL
- [ ] Add custom headers
- [ ] Set custom timeout
- [ ] Verify configuration saved
- [ ] Edit forwarding configuration
- [ ] Disable forwarding

### Forwarding Functionality
- [ ] Send test webhook to endpoint
- [ ] Verify webhook forwarded to destination
- [ ] Check forwarding status in logs table
- [ ] View forwarding details in modal
- [ ] Test forwarding timeout
- [ ] Test forwarding to invalid URL
- [ ] Verify Mollie still gets 200 OK on forward failure

### Replay Functionality
- [ ] Click replay button on webhook
- [ ] Replay to original endpoint
- [ ] Replay to forwarding URL
- [ ] Verify new log entry created
- [ ] Check replay badge shows on new entry
- [ ] View replay details (linked to original)
- [ ] Test replay failure handling

## Next Steps

1. **Fix Type Errors** - Update all API routes with Next.js 15 params type
2. **UI Implementation** - Add forwarding fields to CreateEndpointDialog
3. **UI Enhancement** - Update WebhookDetailModal with replay button
4. **UI Enhancement** - Add forwarding status to webhooks table
5. **Testing** - Full end-to-end testing of forwarding and replay
6. **Documentation** - Update ROADMAP.md as complete

## Status
🔄 **Phase 8 In Progress** - Backend complete (70%), UI pending (30%)

Estimated time remaining: 2-3 hours for UI implementation and testing