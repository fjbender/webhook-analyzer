# Vercel Authentication Fix

## Issue
Login works (credentials validated, session created) but redirects to login page with 307 status.

## Root Cause
NextAuth.js v5 requires specific configuration for production deployments behind proxies (like Vercel).

## Changes Made

### 1. Auth Config (`lib/auth/config.ts`)
Added `trustHost: true` to the NextAuth configuration:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ... other config
  trustHost: true, // Required for production behind proxies
});
```

This tells NextAuth to trust the `X-Forwarded-Host` header from Vercel's proxy.

### 2. Middleware (`middleware.ts`)
Added `secureCookie` option to `getToken`:

```typescript
const token = await getToken({ 
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
  secureCookie: process.env.NODE_ENV === "production",
});
```

This ensures the correct cookie name is used in production (with `__Secure-` prefix on HTTPS).

## Deployment Steps

1. **Commit and push these changes:**
```bash
git add lib/auth/config.ts middleware.ts
git commit -m "Fix NextAuth production authentication"
git push
```

2. **Verify environment variables in Vercel:**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Ensure these are set:
     - `NEXTAUTH_URL` = `https://your-app.vercel.app` (with https://)
     - `NEXTAUTH_SECRET` = your generated secret
     - `NODE_ENV` = `production`

3. **Important: NEXTAUTH_URL must use HTTPS**
```bash
# Correct:
NEXTAUTH_URL=https://webhook-analyzer.vercel.app

# Wrong:
NEXTAUTH_URL=http://webhook-analyzer.vercel.app
```

4. **Redeploy:**
   - Vercel will auto-deploy on push, OR
   - Manually trigger redeploy in Vercel dashboard

## Verification

After deployment, test the login flow:

1. Navigate to `/login`
2. Enter credentials
3. Should redirect to `/dashboard` successfully
4. Check browser cookies - should see `__Secure-next-auth.session-token`

## Additional Troubleshooting

### Still getting 307 redirects?

**Check 1: Environment Variables**
```bash
# View your deployed environment variables
vercel env ls
```

Ensure `NEXTAUTH_URL` matches your actual deployment URL exactly.

**Check 2: Cookie Domain**
In production, check browser DevTools > Application > Cookies.
You should see:
- Name: `__Secure-next-auth.session-token` (note the `__Secure-` prefix)
- Domain: `.vercel.app` or your custom domain
- Secure: ✓ (checked)
- HttpOnly: ✓ (checked)
- SameSite: `Lax`

**Check 3: Function Logs**
In Vercel dashboard:
1. Go to your deployment
2. Click "Functions" tab
3. Check logs for any errors during authentication

### Common Issues

**Issue**: Cookie not being set
**Solution**: Ensure `NEXTAUTH_URL` uses `https://` (not `http://`)

**Issue**: "NEXTAUTH_URL" not set error
**Solution**: Add it to Vercel environment variables and redeploy

**Issue**: Session works locally but not in production
**Solution**: This is exactly what we fixed - ensure `trustHost: true` is set

## Testing Locally with Production Mode

To test production behavior locally:

```bash
# Build production version
npm run build

# Start production server
npm start

# Set environment variables
export NODE_ENV=production
export NEXTAUTH_URL=http://localhost:3000
```

Note: Locally will use `next-auth.session-token` (without `__Secure-` prefix) since it's HTTP.

## References

- [NextAuth.js Deployment Docs](https://next-auth.js.org/deployment)
- [NextAuth.js v5 trustHost option](https://authjs.dev/reference/nextjs#trusthost)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
