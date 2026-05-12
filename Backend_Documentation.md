# QuiteCare AI Backend
## Technical Documentation for FYP Presentation

---

# 1. Project Overview

The backend is a **RESTful API** built with Express.js + MongoDB that handles:
- User authentication (local + OAuth)
- Chat session management
- Integration with AI Engine for title generation

---

# 2. Database Schema

## 2.1 User Model (`models/User.js`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | String | No | Optional (for OAuth users) |
| `email` | String | Yes | Unique identifier |
| `password` | String | No | Bcrypt hashed (optional for OAuth) |
| `googleId` | String | No | Google OAuth ID |
| `githubId` | String | No | GitHub OAuth ID |
| `avatar` | String | No | OAuth profile picture URL |
| `provider` | String | No | 'local', 'google', 'github' |
| `resetPasswordOTP` | String | No | 6-digit OTP for password reset |
| `resetPasswordExpires` | Date | No | OTP expiry time (10 minutes) |
| `createdAt` | Date | No | Account creation timestamp |

## 2.2 Chat Model (`models/Chat.js`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Reference to User collection |
| `title` | String | Yes | Session title (auto or custom) |
| `messages` | Array | No | [{sender, text, signSequence, timestamp}] |
| `isPinned` | Boolean | No | Pin status (max 3 per user) |
| `pinnedAt` | Date | No | When session was pinned |
| `createdAt` | Date | No | Session creation timestamp |

---

# 3. API Endpoints

## 3.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/signup` | `signup` | Register new user with email/password |
| POST | `/signin` | `signin` | Login with email/password |
| POST | `/forgot-password` | `forgotPassword` | Send OTP to user email |
| POST | `/reset-password` | `resetPassword` | Verify OTP and update password |
| GET | `/google` | Passport | Initiate Google OAuth |
| GET | `/google/callback` | Passport | Google OAuth callback |
| GET | `/github` | Passport | Initiate GitHub OAuth |
| GET | `/github/callback` | Passport | GitHub OAuth callback |
| GET | `/me` | `me` | Validate JWT and return user profile |

## 3.2 Chat Routes (`/api/chat`)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/save` | `saveSession` | Save or update chat session |
| GET | `/history/:userId` | `getHistory` | Get all sessions (pinned first) |
| GET | `/:id` | `getChatById` | Get single session by ID |
| DELETE | `/:id` | `deleteSession` | Delete a session |
| PATCH | `/:id/pin` | `pinSession` | Toggle pin (max 3) |
| PATCH | `/:id/rename` | `renameSession` | Rename session title |

**All chat routes are protected by JWT middleware**

---

# 4. Key Features

## 4.1 Authentication System

### Local Authentication
- **Signup**: Username, email, password → bcrypt hash → save to DB → return JWT
- **Signin**: Email + password → compare bcrypt → return JWT (30-day expiry)

### OAuth Authentication
- **Google OAuth 2.0**: Login via Google account
- **GitHub OAuth**: Login via GitHub account
- **Account Linking**: Same email links to existing account

### Password Reset
1. User enters email → Backend generates 6-digit OTP
2. OTP saved to DB with 10-minute expiry
3. Nodemailer sends OTP via Gmail SMTP
4. User enters OTP + new password → Verify → Update

### JWT Security
- Token expiration: 30 days
- Stored in Authorization header: `Bearer <token>`
- Protected routes verify token before processing

## 4.2 Chat Management

### Session Saving
- Auto-saves chat after each message
- Updates existing session if `chatId` provided
- Creates new session on first message
- Skips saving if messages ≤ 1 (empty chat)

### Auto Title Generation
- Triggers after 6+ messages
- Calls AI Engine (`POST /generate-title`)
- Falls back to "New Sign Session" on failure

### Pinning System
- Maximum 3 pinned sessions per user
- Toggle pin on/off
- Pinned sessions appear at top of history

### Session Renaming
- Custom titles for sessions
- Validates non-empty title
- Updates in real-time

### History Sorting
1. Pinned sessions (by pinnedAt desc)
2. Unpinned sessions (by createdAt desc)

---

# 5. Middleware

## 5.1 Auth Middleware (`middleware/authMiddleware.js`)

```javascript
- Extract JWT from Authorization header
- Verify token using JWT_SECRET
- Add req.user.id to request object
- Return 401 if token missing or invalid
```

## 5.2 CORS Configuration

- **Allowed Origins**:
  - `http://localhost:5173` (dev)
  - `https://quite-care-ai-fyp-imz9.vercel.app`
  - `https://quietcareai.app`
  - `https://www.quietcareai.app`
- Allows credentials (cookies, auth headers)

---

# 6. Database Connection

## 6.1 Connection Strategy

- **Cached Connection**: Reuses existing connection if available
- **Environment Variable**: `MONGODB_URI` required
- **Health Check**: Exempts `/` route from DB requirement
- **Vercel Compatible**: Works with serverless functions

---

# 7. Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Express.js 5.2.1 |
| Database | MongoDB (Mongoose 9.0.2) |
| Authentication | JWT (jsonwebtoken 9.0.3) |
| OAuth | Passport.js |
| Email | Nodemailer 7.0.12 |
| Deployment | Vercel |

---

# 8. Environment Variables (.env)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
```

---

# 9. Request/Response Flow

## 9.1 Signup Flow
```
User (username, email, password)
        ↓
/api/auth/signup
        ↓
Validate fields → Hash password → Save to MongoDB
        ↓
Generate JWT → Return {user, token}
```

## 9.2 OAuth Flow
```
User clicks "Login with Google"
        ↓
/api/auth/google (Passport)
        ↓
Google OAuth consent screen
        ↓
Callback → Create/Link User → Generate JWT
        ↓
Redirect to frontend with token
```

## 9.3 Chat Save Flow
```
Frontend sends messages + userId
        ↓
/api/chat/save (JWT protected)
        ↓
If ≥6 messages → Call AI for title
        ↓
Save/Update MongoDB → Return chat object
```

---

# 10. File Structure

```
backend/
├── server.js              # Express app + DB connection
├── models/
│   ├── User.js           # User schema
│   └── Chat.js           # Chat session schema
├── routes/
│   ├── authRoutes.js     # Local auth endpoints
│   ├── oauthRoutes.js    # Google/GitHub OAuth
│   └── chatRoutes.js     # Chat CRUD endpoints
├── controllers/
│   ├── authController.js # Signup, signin, password reset
│   └── chatController.js # Session management
├── middleware/
│   └── authMiddleware.js # JWT protection
├── package.json
└── .env
```

---

# 11. Panel Questions & Answers

## Q1: How does password reset work?
**A:**
1. User enters email at `/forgot-password`
2. Backend generates 6-digit OTP, saves to DB with 10-min expiry
3. Nodemailer sends OTP via Gmail SMTP
4. User submits email + OTP + new password at `/reset-password`
5. Backend verifies OTP, hashes new password, clears OTP fields

---

## Q2: How does OAuth account linking work?
**A:**
1. User signs up with Google → creates account with `googleId`
2. Later user tries GitHub with same email
3. Backend finds existing user by email
4. Links `githubId` to existing account
5. Returns existing account (no duplicate created)

---

## Q3: How do you ensure only the owner can access their chats?
**A:**
- All `/api/chat` routes use `protect` middleware
- Middleware extracts JWT from `Authorization: Bearer <token>`
- Verifies token, adds `req.user.id` to request
- All database queries filter by `user: req.user.id`
- Users can only see/modify their own chats

---

## Q4: What happens if AI title generation fails?
**A:** Graceful fallback - keeps default title "New Sign Session", logs error to console, chat still saves successfully.

---

## Q5: How many sessions can a user pin?
**A:** Maximum 3 pinned sessions per user. Backend validates this before allowing pin operation.

---

## Q6: How is chat history sorted?
**A:**
1. Pinned sessions appear first (sorted by `pinnedAt` descending)
2. Unpinned sessions follow (sorted by `createdAt` descending)

---

## Q7: What is the purpose of the signSequence field?
**A:** Stores the ASL gloss sequence for each message, enabling the frontend to animate the 3D avatar for that response.

---

## Q8: How does the system handle empty chat sessions?
**A:** Backend skips saving chats with ≤1 message (only system intro message). Returns message "Session empty, not saved."

---

## Q9: What OAuth providers do you support?
**A:** Two - Google OAuth 2.0 and GitHub OAuth. Both use Passport.js for implementation.

---

## Q10: How long is the JWT token valid?
**A:** 30 days (`expiresIn: '30d'`). Token contains user ID as payload.

---

## Q11: How is CORS configured for production?
**A:** Whitelists specific domains (Vercel URL + custom domain + localhost). Allows credentials. Blocks all other origins.

---

## Q12: What happens if MongoDB connection fails?
**A:** Middleware catches error, returns 500 with message "Database connection failed". Health check endpoint exempted from DB requirement.

---

*Documentation prepared for FYP Panel Presentation*
*QuiteCare AI Backend - RESTful API with Authentication & Chat Management*