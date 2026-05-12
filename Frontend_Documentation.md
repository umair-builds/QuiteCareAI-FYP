# QuiteCare AI Frontend
## Technical Documentation for FYP Presentation

---

# 1. Project Overview

The frontend is a **React 19 + Redux** application that provides:
- User authentication (signin, signup, OAuth, password reset)
- Real-time sign language recognition interface
- 3D avatar animation display
- Chat session management with history
- Emotion detection feedback

---

# 2. Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.0 |
| Routing | React Router DOM 7.11.0 |
| State Management | Redux Toolkit 2.11.2 |
| Styling | Tailwind CSS 4.1.18 |
| HTTP Client | Axios 1.13.2 |
| UI Icons | Lucide React 0.562.0 |
| Build Tool | Vite 7.2.4 |
| Deployment | Vercel |

---

# 3. File Structure

```
client/
├── src/
│   ├── app/
│   │   └── store.js              # Redux store configuration
│   ├── components/
│   │   ├── AuthRoute.jsx         # Redirects logged-in users away
│   │   ├── ChatLog.jsx          # Conversation display
│   │   ├── ControlPanel.jsx     # Start/Pause/Enter/Retake/Close
│   │   ├── Navbar.jsx           # Top navigation bar
│   │   ├── ProtectedRoute.jsx   # Auth guard for protected routes
│   │   ├── Sidebar.jsx          # Session history + actions
│   │   └── VideoStage.jsx       # Webcam + Avatar display
│   ├── features/
│   │   ├── auth/
│   │   │   └── authSlice.js     # Auth state (user, token)
│   │   └── chat/
│   │       └── chatSlice.js    # Chat state (replaySequence)
│   ├── pages/
│   │   ├── AuthSuccess.jsx      # OAuth callback handler
│   │   ├── ForgotPassword.jsx  # Password reset request
│   │   ├── Home.jsx             # Landing page
│   │   ├── MainChat.jsx         # Main chat interface
│   │   ├── ResetPassword.jsx   # New password form
│   │   ├── SignIn.jsx           # Login page
│   │   └── SignUp.jsx           # Registration page
│   ├── services/
│   │   └── api.js               # Axios setup + API URLs
│   ├── utils/
│   │   └── prefetch.js          # Video prefetching
│   ├── App.jsx                  # Routes definition
│   └── main.jsx                 # Entry point
├── package.json
└── vite.config.js
```

---

# 4. Routing & Navigation

## Routes (`App.jsx`)

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | `Home` | Public | Landing page |
| `/signin` | `SignIn` | Guest | Login page |
| `/signup` | `SignUp` | Guest | Registration page |
| `/chat` | `MainChat` | Protected | Main chat interface |
| `/forgot-password` | `ForgotPassword` | Public | Request OTP |
| `/reset-password` | `ResetPassword` | Public | Enter new password |
| `/auth/success` | `AuthSuccess` | Guest | OAuth callback |

### Route Guards

- **ProtectedRoute**: Redirects to `/signin` if no JWT token
- **AuthRoute**: Redirects to `/chat` if already logged in

---

# 5. Core Components

## 5.1 VideoStage (`components/VideoStage.jsx`)

**Purpose**: Dual-pane display - webcam input + avatar output

### Features
- **Webcam Capture**: Uses `navigator.mediaDevices.getUserMedia`
- **Real-time Prediction**: Sends frames to AI Engine every 30ms
- **Emotion Detection**: Extracts emotion from each frame
- **Avatar Animation**: Double-buffer system for smooth video playback
- **Video Prefetching**: Preloads next videos for seamless transitions
- **Welcome Video**: Loop when avatar is idle

### Props
| Prop | Type | Description |
|------|------|-------------|
| `isRecording` | boolean | Webcam active state |
| `onGlossDetected` | function | Callback when sign detected |
| `onEmotionDetected` | function | Callback with per-frame emotion |
| `botResponseCount` | number | Triggers animation when bot responds |
| `signSequence` | array | Gloss words to animate |
| `onActiveSignChange` | function | Current word index callback |

## 5.2 Sidebar (`components/Sidebar.jsx`)

**Purpose**: Session history management

### Features
- **New Session**: Creates fresh chat
- **History List**: Shows all past sessions
- **Pinned Sessions**: Max 3 pinned (sorted to top)
- **Session Actions**:
  - Pin/Unpin (max 3)
  - Rename (modal)
  - Delete (with toast confirmation)
- **Auto-refresh**: Polls every 5 seconds
- **Mobile Support**: Swipe to close, hamburger menu

## 5.3 ChatLog (`components/ChatLog.jsx`)

**Purpose**: Display conversation history

### Features
- **Auto-scroll**: Scrolls to bottom on new messages
- **Click to Replay**: Click any message to replay its sign sequence on avatar
- **Loading States**: Shows "Thinking..." and "Translating..." animations
- **User/Bot Styling**: Green (user) vs gray (bot) bubbles

## 5.4 ControlPanel (`components/ControlPanel.jsx`)

**Purpose**: Sign language input controls

### Buttons
| Button | Function |
|--------|----------|
| **Start** | Begin webcam recording |
| **Pause** | Stop recording |
| **Enter** | Submit gloss to AI for translation |
| **Retake** | Clear and start over |
| **Close** | End current session |

---

# 6. Pages

## 6.1 MainChat (`pages/MainChat.jsx`)

**Purpose**: Main application interface

### State Variables
| Variable | Type | Description |
|----------|------|-------------|
| `sessionStarted` | boolean | Chat active state |
| `isRecording` | boolean | Webcam recording |
| `messages` | array | Chat history |
| `currentGlosses` | array | Current detected signs |
| `currentChatId` | string | DB chat ID |
| `chatTitle` | string | Session title |
| `emotionBuffer` | array | Collects emotions per frame |
| `lastSentEmotion` | string | Mode of detected emotions |

### Key Functions
- **Auto-save**: Saves to backend on message change
- **Emotion Buffer**: Collects frame emotions, calculates mode, sends to AI
- **Text Input**: Alternative typing input for non-sign users
- **Gloss → English**: Calls AI Engine `/translate`
- **Chat Response**: Calls AI Engine `/chat-response` with emotion context

### Data Flow
```
Webcam Frame → AI Engine /predict-frame
                    ↓
            {gloss, emotion}
                    ↓
        MainChat accumulates emotion
                    ↓
User presses Enter → Calculate mode → Send to /chat-response
                                      ↓
                            AI Engine returns
                    ↓
            {natural_response, animation_sequence}
                    ↓
        VideoStage animates sequence
```

## 6.2 SignIn / SignUp

### SignIn (`pages/SignIn.jsx`)
- Email + password login
- "Login with Google" button
- "Login with GitHub" button
- "Forgot Password?" link
- "Sign Up" link

### SignUp (`pages/SignUp.jsx`)
- Username + email + password registration
- OAuth buttons (Google/GitHub)

## 6.3 ForgotPassword / ResetPassword

### ForgotPassword (`pages/ForgotPassword.jsx`)
- Enter email → sends OTP to backend
- Backend sends 6-digit OTP via email

### ResetPassword (`pages/ResetPassword.jsx`)
- Enter email + OTP + new password
- Backend verifies OTP, updates password

## 6.4 AuthSuccess (`pages/AuthSuccess.jsx`)
- OAuth callback handler
- Extracts JWT from URL
- Stores in Redux + localStorage
- Redirects to `/chat`

---

# 7. State Management (Redux)

## 7.1 Auth Slice (`features/auth/authSlice.js`)

```javascript
{
  user: { id, username, email },
  token: "jwt_token_string",
  isAuthenticated: true/false
}
```

### Actions
- **login(payload)**: Set user + token + isAuthenticated, save to localStorage
- **logout()**: Clear all, remove from localStorage

### Persistence
- On app load: Hydrate from localStorage
- On login: Save to localStorage
- On logout: Remove from localStorage

## 7.2 Chat Slice (`features/chat/chatSlice.js`)

```javascript
{
  replaySequence: ["word1", "word2", ...] | null
}
```

### Actions
- **setReplaySequence**: Triggered when user clicks chat message
- **clearReplaySequence**: After VideoStage consumes it

---

# 8. API Configuration (`services/api.js`)

## URL Configuration

| Environment | Backend URL | AI Engine URL |
|-------------|-------------|---------------|
| Development | `http://localhost:5005` | `http://localhost:8000` |
| Production | Vercel env var | Vercel env var |

## Video URLs

| Environment | Video Base URL |
|-------------|----------------|
| Development | `/videos/` (local) |
| Production | Cloudflare R2 CDN |

## Axios Interceptors

### Request Interceptor
- Adds `Authorization: Bearer <token>` from localStorage

### Response Interceptor
- On 401: Auto-logout, redirect to `/signin`

---

# 9. Key Features Summary

### Real-time Sign Recognition
- Webcam captures at 30fps
- Frames sent to AI Engine `/predict-frame`
- Returns gloss + emotion per frame

### Emotion-Aware Chat
- Accumulates emotion per frame
- Calculates statistical mode
- Sends to AI Engine for empathetic response

### Avatar Animation
- Double-buffer video player
- Pre-fetches next videos
- Smooth transitions (250ms overlap)
- Click chat message to replay

### Session Management
- Auto-save on every message
- History sidebar with pin/rename/delete
- Max 3 pinned sessions
- AI-generated titles after 6 messages

### Authentication
- Local (email/password)
- OAuth (Google + GitHub)
- JWT tokens (30-day expiry)
- Password reset via OTP

---

# 10. Panel Questions & Answers

### Q1: How does real-time sign recognition work?
**A:**
1. Webcam captures frames at 30fps
2. Each frame sent to AI Engine `/predict-frame`
3. Returns: `{gloss: "hello", emotion: "happy"}`
4. Frontend accumulates gloss words + emotion buffer

### Q2: How does emotion affect the chatbot response?
**A:**
- Emotion buffer collects every frame's emotion
- On "Enter": calculates statistical mode
- Sends mode to AI Engine as context
- AI uses it to tailor empathetic response

### Q3: How does the avatar animation work?
**A:**
- Double-buffer video player (2 `<video>` elements)
- When bot responds with `animation_sequence`
- Pre-fetches videos, plays with 250ms overlap
- Click any chat message to replay its sequence

### Q4: What happens when user clicks a chat message?
**A:**
- Dispatches `setReplaySequence(msg.signSequence)` to Redux
- VideoStage detects change, triggers `playSequence()`
- Avatar animates that message's sign sequence

### Q5: How does auto-save work?
**A:**
- `useEffect` watches `messages` array
- On any change → POST to `/api/chat/save`
- Backend creates new or updates existing chat
- Returns `_id` for future updates

### Q6: How do you handle OAuth login?
**A:**
1. User clicks "Login with Google"
2. Redirects to backend `/api/auth/google`
3. Google OAuth consent
4. Callback → `/api/auth/google/callback`
5. Redirects to `/auth/success?token=<jwt>`
6. Frontend stores token, redirects to `/chat`

### Q7: What's the max pin limit?
**A:** 3 pinned sessions per user. Backend returns error if exceeded.

### Q8: How does video prefetching work?
**A:**
- `prefetchVideos()` loads first few URLs
- Cached by browser for instant playback
- Prevents lag between sign animations

### Q9: Can users type instead of sign?
**A:** Yes! Text input bar below chat allows direct text input.

### Q10: How does the system handle connection errors?
**A:** Shows "Connection Error" message in chat, logs to console. UI remains usable.

---

# 11. Environment Variables (.env.local)

```
VITE_BACKEND_URL=http://localhost:5005
VITE_AI_ENGINE_URL=http://localhost:8000
VITE_USE_LOCAL_VIDEOS=true  # For local development
```

---

*Documentation prepared for FYP Panel Presentation*
*QuiteCare AI Frontend - React + Redux + Tailwind*