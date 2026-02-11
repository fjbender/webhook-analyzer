# Next-Gen Webhook Fixes

## Issues Identified

Based on actual Mollie next-gen webhook payloads:

1. **Event Type Field**: Mollie uses `type` field, not `event` (e.g., `"type": "sales-invoice.issued"`)
2. **Signature Header**: Case-sensitive, always lowercase `x-mollie-signature`
3. **Signature Failures**: Should not prevent webhook logging - we want to capture ALL webhooks for inspection
4. **Empty requestBody**: Webhooks with invalid signatures were returning early, not storing the payload
5. **Response Code**: Should always return 200 OK to prevent Mollie retries, even with invalid signatures

## Changes Made

### 1. Next-Gen Webhook Receiver (`app/api/webhooks/nextgen/[userId]/[endpointId]/route.ts`)

**Before:**
- Returned 401 for missing signature
- Returned 401 for invalid signature
- Created multiple log entries for different failure scenarios
- Early returns prevented payload storage

**After:**
- Captures ALL webhooks regardless of signature validity
- Always returns 200 OK (prevents Mollie retries)
- Single log entry with complete data
- Stores signature error in `fetchError` field
- Graceful handling of missing shared secret

**Key Changes:**

```typescript
// 1. Simplified signature header extraction
const signatureHeader = request.headers.get("x-mollie-signature") || "";

// 2. Event type extraction (Mollie uses "type" field)
const eventType = body.type || body.event || body.eventType || undefined;

// 3. Non-blocking signature verification
let isValidSignature = false;
let signatureError: string | undefined;

if (signatureHeader && endpoint.sharedSecret) {
  try {
    const decryptedSecret = decrypt(endpoint.sharedSecret);
    isValidSignature = verifySignature(rawBody, signatureHeader, decryptedSecret);
    if (!isValidSignature) {
      signatureError = "Signature verification failed";
    }
  } catch (error) {
    signatureError = error instanceof Error ? error.message : "Signature verification error";
  }
} else if (!signatureHeader) {
  signatureError = "Missing signature header";
} else if (!endpoint.sharedSecret) {
  signatureError = "No shared secret configured";
}

// 4. ALWAYS store webhook log
const webhookLog = await WebhookLog.create({
  endpointId: endpointId,
  userId: userId,
  receivedAt: new Date(),
  processingTimeMs: processingTime,
  requestHeaders: headers,
  requestBody: body, // ✅ Always stored now
  rawBody: rawBody,
  ipAddress,
  userAgent,
  eventType,
  signatureValid: isValidSignature,
  signatureHeader,
  fetchError: signatureError, // Stores signature error
  status: isValidSignature ? "success" : "signature_failed",
});

// 5. ALWAYS return 200 OK
return NextResponse.json({ 
  ok: true, 
  signatureValid: isValidSignature,
  ...(signatureError && { warning: signatureError })
});
```

### 2. Webhook Detail Modal (`components/webhook-detail-modal.tsx`)

**Enhanced signature verification display:**

```typescript
{log.signatureValid !== undefined && (
  <div>
    <label className="text-sm font-medium">Signature Verification</label>
    <div className="mt-1 space-y-1">
      {log.signatureValid ? (
        <Badge className="bg-green-600">Valid ✓</Badge>
      ) : (
        <Badge variant="destructive">Invalid ✗</Badge>
      )}
      {!log.signatureValid && log.fetchError && (
        <p className="text-xs text-muted-foreground mt-1">
          {log.fetchError}
        </p>
      )}
    </div>
  </div>
)}
```

Now displays the specific error message when signature verification fails.

## Behavior Changes

### Before
- ❌ Webhooks with missing/invalid signatures returned 401
- ❌ Payload not stored for failed signatures
- ❌ Mollie would retry failed webhooks
- ❌ Cannot inspect failed webhook payloads

### After
- ✅ ALL webhooks are logged (success and failed)
- ✅ Full payload stored regardless of signature
- ✅ Returns 200 OK to prevent retries
- ✅ Clear indication of signature status
- ✅ Specific error messages displayed
- ✅ Can inspect and debug signature issues

## Example Webhook Payload

Mollie's actual next-gen webhook structure:

```json
{
  "resource": "event",
  "id": "event_fPFNJPMRhCrSmA4oPK2MJ",
  "type": "sales-invoice.issued",  // ← Event type field
  "entityId": "invoice_bFxWSLEcnR6YNNrTMK2MJ",
  "createdAt": "2026-02-11T14:51:20.0Z",
  "_embedded": {
    "entity": {
      "resource": "sales-invoice",
      "id": "invoice_bFxWSLEcnR6YNNrTMK2MJ",
      // ... full entity data
    }
  },
  "_links": {
    "self": { "href": "..." },
    "entity": { "href": "..." }
  }
}
```

Headers:
```
x-mollie-signature: sha256:abcdef123456...
content-type: application/json
```

## Testing

### With Valid Signature
1. Webhook received with `x-mollie-signature` header
2. Signature verified successfully
3. Status: `success`
4. Badge: Green "Valid ✓"
5. Forwarding enabled (if configured)

### With Invalid Signature
1. Webhook received with incorrect signature
2. Signature verification fails
3. Status: `signature_failed`
4. Badge: Red "Invalid ✗"
5. Error message: "Signature verification failed"
6. Full payload still stored and viewable
7. Forwarding disabled (security measure)

### Without Signature
1. Webhook received without `x-mollie-signature` header
2. No verification attempted
3. Status: `signature_failed`
4. Badge: Red "Invalid ✗"
5. Error message: "Missing signature header"
6. Full payload still stored and viewable

### Without Shared Secret
1. Webhook received but endpoint has no shared secret configured
2. Cannot verify signature
3. Status: `signature_failed`
4. Badge: Red "Invalid ✗"
5. Error message: "No shared secret configured"
6. Full payload still stored and viewable

## Database Fields Used

- `requestBody`: Parsed JSON payload (always stored)
- `rawBody`: Original raw JSON string (always stored)
- `signatureValid`: Boolean - true/false/undefined
- `signatureHeader`: The signature from header
- `fetchError`: Signature error message (repurposed field)
- `status`: "success" or "signature_failed"

## Security Considerations

### Why Return 200 OK for Invalid Signatures?

1. **Development Tool Purpose**: This is a webhook analyzer, not a production webhook handler
2. **Debugging**: Need to capture and inspect invalid webhooks to fix issues
3. **Prevent Retry Storms**: Mollie would retry failed webhooks indefinitely
4. **Visibility**: Developers can see exactly what's wrong with the signature

### Production Best Practices

If using this in production:
- Monitor signature validation rates
- Alert on high failure rates
- Only forward webhooks with valid signatures (already implemented)
- Regularly rotate shared secrets
- Review failed webhooks for patterns

## Deployment

After deploying these changes:

1. **Test with Mollie Test Mode:**
   - Configure a next-gen webhook in Mollie Dashboard
   - Use your test shared secret
   - Trigger a test event (create invoice, payment, etc.)
   - Verify webhook appears in logs

2. **Check Signature Verification:**
   - View webhook detail
   - Check "Signature Verification" section
   - Should show "Valid ✓" with correct shared secret

3. **Test Invalid Signature:**
   - Temporarily change shared secret in endpoint settings
   - Trigger another webhook
   - Should show "Invalid ✗" with error message
   - Payload should still be visible

4. **Test Missing Signature:**
   - Send manual POST without signature header
   - Should show "Invalid ✗" with "Missing signature header"
   - Payload should still be visible

## Known Limitations

- Signature format must be `sha256:hexdigest` (Mollie standard)
- Currently using `fetchError` field for signature errors (could add dedicated field)
- No automatic retry mechanism for failed signatures
- Forwarding only occurs for valid signatures (by design)

## Future Enhancements

Potential improvements (not in current scope):

- Dedicated `signatureError` field in database
- Signature debugging mode with detailed logs
- Signature verification test tool in UI
- Webhook payload comparison (expected vs received)
- Historical signature validation rate charts

## References

- [Mollie Events API](https://docs.mollie.com/reference/v2/events-api/overview)
- [Mollie Webhook Signatures](https://docs.mollie.com/guides/webhooks)
- [HMAC-SHA256 Verification](https://en.wikipedia.org/wiki/HMAC)

---

**Updated**: 2026-02-11
**Status**: ✅ Complete and tested
**Build**: ✅ Successful
