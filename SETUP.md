# Setup Instructions

## Quick Setup

Follow these steps to get the project running:

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (M0 free tier works great)
4. Click "Connect" → "Connect your application"
5. Copy the connection string

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the values:

```bash
# Your MongoDB connection string from step 2
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webhook-analyzer?retryWrites=true&w=majority

# Generate a random secret for NextAuth:
# Run: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Your application URL (use http://localhost:3000 for development)
NEXTAUTH_URL=http://localhost:3000

# Generate a 32-byte hex key for encryption:
# Run: openssl rand -hex 32
ENCRYPTION_KEY=your-generated-key-here

NODE_ENV=development
```

### 4. Generate Secrets

Generate the required secrets using these commands:

```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For ENCRYPTION_KEY
openssl rand -hex 32
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 6. Install shadcn/ui Components (As Needed)

When you need UI components, install them using:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
# etc.
```

## Next Steps

1. **Create the authentication pages** in `app/(auth)/`
2. **Build the dashboard** in `app/(dashboard)/`
3. **Implement the API routes** for managing endpoints and API keys
4. **Add UI components** from shadcn/ui as needed
5. **Test with Mollie** webhooks using test mode

## Troubleshooting

### MongoDB Connection Issues

- Ensure your IP address is whitelisted in MongoDB Atlas (Network Access)
- Check that your username/password are correctly URL-encoded
- Verify the database name in your connection string

### Build Errors

- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Check Node.js version: requires Node 18+ or 20+

### Environment Variables Not Loading

- Ensure `.env.local` is in the project root
- Restart the dev server after changing environment variables
- Don't use quotes around values in `.env.local`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Mollie Webhooks Documentation](https://docs.mollie.com/reference/webhooks)
