# Changelog

All notable changes to the Webhook Analyzer project are documented in this file.

## [1.0.0] - 2024 - Initial Release

### Core Features

#### Authentication & User Management
- User registration with email and password
- Secure login with NextAuth.js v5
- Session management with HTTP-only cookies
- Password hashing with bcrypt (10 salt rounds)
- Password validation (8+ chars, uppercase, lowercase, numbers)
- User profile management (email updates)
- Password change functionality

#### API Key Management
- Secure storage of Mollie API keys
- AES-256-CBC encryption for API keys at rest
- Support for both test and live keys
- API key validation against Mollie API
- Key labeling for easy identification
- Display of key type and last 4 characters
- CRUD operations for API keys

#### Webhook Endpoints
- Multiple endpoint support per user
- Classic webhook endpoints with automatic resource fetching
- Next-gen webhook endpoints with signature verification
- Enable/disable toggle for endpoints
- Endpoint statistics (total received, last received date)
- Custom endpoint naming
- Generated webhook URLs
- Full CRUD operations

#### Webhook Logging
- Comprehensive logging of all webhook attempts
- Request header and body storage
- Raw body preservation for accurate forwarding
- IP address and user agent tracking
- Processing time measurement
- Success/failure status tracking
- Resource type detection (payments, refunds, subscriptions, etc.)
- Full resource data fetching (classic webhooks)
- Event type tracking (next-gen webhooks)
- Signature validation results (next-gen webhooks)
- Pagination and filtering

#### Webhook Forwarding
- Configurable forwarding per endpoint
- Custom forwarding URL configuration
- Optional custom headers
- Configurable timeout (1-60 seconds)
- Manual redirect handling (preserves POST method)
- Forwarding status tracking
- Forwarding error logging
- Processing time tracking
- Payload format preservation (form-encoded or JSON)
- Content-Type header preservation

#### Webhook Replay
- Replay any captured webhook
- Replay to original endpoint or forwarding URL
- Maintains original payload format
- Creates new log entry for replays
- Tracks replay metadata (original log ID, replayed by, replayed at)

### Technical Implementation

#### Frontend
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui component library
- Lucide React icons
- Sonner toast notifications
- Responsive design
- Dark mode support (via Tailwind)

#### Backend
- Next.js API Routes
- MongoDB with Mongoose ODM
- NextAuth.js v5 for authentication
- Zod for schema validation
- Node.js crypto module for encryption
- HMAC-SHA256 for signature verification
- Native Fetch API for HTTP requests

#### Database Models
- **User**: Authentication and profile data
- **MollieApiKey**: Encrypted API keys with metadata
- **WebhookEndpoint**: Endpoint configuration and statistics
- **WebhookLog**: Complete webhook history with all metadata

#### Security
- Password hashing with bcrypt
- API key encryption (AES-256-CBC)
- Shared secret encryption
- Session management with secure cookies
- CSRF protection (NextAuth.js built-in)
- Signature verification for next-gen webhooks
- Input validation with Zod schemas
- SQL injection protection (Mongoose)

### UI/UX Features
- Clean, modern interface
- Intuitive navigation
- Loading states for async operations
- Toast notifications for user feedback
- Error handling and display
- Form validation with helpful messages
- Copy-to-clipboard for webhook URLs
- Expandable webhook detail view
- Badge indicators for status
- Syntax highlighting for JSON payloads
- Empty states with helpful messages
- Responsive tables with pagination

### Developer Experience
- TypeScript throughout
- Comprehensive error messages
- Detailed API documentation
- Setup instructions
- Deployment guide
- Environment variable examples
- Code comments where needed
- Consistent code style
- Modular architecture

### Documentation
- README with quick start guide
- SETUP.md with detailed setup instructions
- API.md with complete API documentation
- DEPLOYMENT.md with deployment instructions
- CHANGELOG.md (this file)
- .env.example with commented variables
- Inline code comments for complex logic

### Known Limitations
- No rate limiting implemented
- No email verification for registration
- No multi-factor authentication
- No webhook retry mechanism
- No webhook filtering by date range in UI
- No bulk operations (delete multiple logs)
- No export functionality for logs
- No dashboard analytics/charts
- Free MongoDB Atlas tier limits (512 MB storage)

### Future Enhancements (Not Implemented)
- Webhook analytics and charts
- Advanced filtering and search
- Bulk operations
- Export to CSV/JSON
- Email notifications for failures
- Webhook retry configuration
- Rate limiting
- API rate limiting
- Multi-tenant support
- Role-based access control
- Webhook transformation rules
- Custom response configuration
- Webhook scheduling/throttling

## Development Timeline

### Phase 1: Project Setup
- Project scaffolding with Next.js 15
- Database connection setup
- shadcn/ui installation
- Basic routing structure

### Phase 2: Authentication
- User registration and login
- NextAuth.js configuration
- Protected routes with middleware
- Session management

### Phase 3: API Keys Management
- API key CRUD operations
- Encryption implementation
- Validation against Mollie API
- UI for key management

### Phase 4: Webhook Endpoints
- Endpoint CRUD operations
- Classic vs Next-gen configuration
- URL generation
- UI for endpoint management

### Phase 5: Webhook Receivers
- Classic webhook receiver implementation
- Resource fetching from Mollie API
- Next-gen webhook receiver implementation
- Signature verification

### Phase 6: Webhook Logs
- Log storage and retrieval
- Filtering and pagination
- Detail view modal
- UI for log browsing

### Phase 7: User Settings
- Profile update functionality
- Password change functionality
- UI for settings page

### Phase 8: Forwarding & Replay
- Forwarding configuration
- Forwarding implementation with redirect handling
- Replay functionality
- UI for forwarding and replay controls

### Phase 9: Polish & Documentation
- Toast notifications
- Comprehensive README
- API documentation
- Deployment guide
- Code cleanup
- Final testing

## Technical Decisions

### Why Next.js 15?
- App Router for better performance
- Server Components for reduced client bundle
- Built-in API routes
- Excellent Vercel integration
- Great developer experience

### Why MongoDB?
- Flexible schema for webhook payloads
- Easy to get started (Atlas free tier)
- Good Node.js ecosystem (Mongoose)
- Scales well for this use case
- No complex joins needed

### Why NextAuth.js?
- Industry standard for Next.js authentication
- Secure session management
- Easy to configure
- Active maintenance
- Good documentation

### Why shadcn/ui?
- Accessible components
- Tailwind CSS based
- Customizable
- Copy-paste architecture (no npm bloat)
- Modern design

### Why Sonner for Toasts?
- Beautiful toast notifications
- Simple API
- Good TypeScript support
- Lightweight
- Customizable

## Credits

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Toast notifications with [Sonner](https://sonner.emilkowal.ski/)
- Webhooks powered by [Mollie](https://www.mollie.com/)

## License

MIT License - See LICENSE file for details
