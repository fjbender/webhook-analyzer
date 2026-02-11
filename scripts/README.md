# Database Setup Script

## What It Does

The `npm run setup` script:

1. ✅ **Validates Environment Variables** - Checks that all required variables are set in `.env.local`
2. ✅ **Tests MongoDB Connection** - Verifies your MongoDB Atlas connection is working
3. ✅ **Creates Database Indexes** - Sets up optimal indexes for performance:
   - `users.email` (unique) - For fast user lookups
   - `mollieapikeys.userId` - For querying user's API keys
   - `webhookendpoints.userId` - For querying user's endpoints
   - `webhooklogs.userId` and `webhooklogs.endpointId` - For fast webhook queries
4. ✅ **Creates Test User (Optional)** - Optionally creates a test user for quick testing

## Usage

```bash
npm run setup
```

The script will prompt you if you want to create a test user.

### Test User Credentials

If you create the test user, you can login with:
- **Email**: test@example.com
- **Password**: Test1234

## Required Environment Variables

Make sure your `.env.local` file has these variables set:

```env
MONGODB_URI=mongodb+srv://...           # Your MongoDB Atlas connection string
NEXTAUTH_SECRET=<secret>                # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000      # Your app URL
ENCRYPTION_KEY=<key>                    # Generate with: openssl rand -hex 32
NODE_ENV=development
```

## What Happens on First Run

1. Connects to your MongoDB database
2. Creates the required indexes (this may take a few seconds)
3. Asks if you want a test user
4. Shows success message with next steps

## Re-Running the Script

You can safely re-run this script at any time:
- Existing indexes won't be duplicated
- Test user creation is skipped if it already exists
- Connection is verified each time

## Troubleshooting

### "Failed to connect to MongoDB"
- Check your `MONGODB_URI` is correct
- Ensure your IP address is whitelisted in MongoDB Atlas
- Verify your MongoDB cluster is running

### "Missing required environment variables"
- Make sure `.env.local` exists in the project root
- Check all required variables are set
- Don't use quotes around values in `.env.local`

### "ENCRYPTION_KEY should be 64 hex characters"
- Generate a new key: `openssl rand -hex 32`
- This is just a warning, the script will continue

## Manual Database Setup

If you prefer to set up the database manually without the script:

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (free M0 tier works)
3. Create a database user
4. Whitelist your IP address
5. Get the connection string and add it to `.env.local`

## Next Steps

After running the setup:

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000
3. Sign in with the test user or create a new account
4. Start building!
