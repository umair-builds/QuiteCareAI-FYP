# QuiteCareAI Animation System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Workflow Diagrams](#workflow-diagrams)
4. [Detailed Process Flow](#detailed-process-flow)
5. [Double-Buffer Animation Technique](#double-buffer-animation-technique)
6. [API Integration](#api-integration)
7. [Video URL Resolution](#video-url-resolution)
8. [Prefetching Mechanism](#prefetching-mechanism)
9. [Key Code References](#key-code-references)
10. [Configuration](#configuration)

---

## System Overview

The animation system in QuiteCareAI is responsible for playing sign language videos (ASL) in response to user interactions. When the AI engine responds to user messages (voice or text), it returns both a natural language response and an **animation sequence** — a list of gloss words representing the signs to be animated.

The system uses a **double-buffer technique** to seamlessly transition between sign videos, creating a smooth animation experience similar to video game character rendering.

### Key Features
- **Real-time webcam capture** for user sign language input
- **AI-powered gloss detection** from video frames
- **Smooth video playback** using double-buffer technique
- **Smart prefetching** for zero-latency transitions
- **Video source switching** between local development and production CDN

---

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                              │
│                              (MainChat.jsx)                              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VIDEO STAGE COMPONENT                            │
│                         (VideoStage.jsx)                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────┐  │
│  │  Webcam Input   │    │ Double-Buffer   │    │  Animation Engine  │  │
│  │  (user signs)   │    │ Video Players   │    │  (rAF Loop)       │  │
│  └─────────────────┘    └─────────────────┘    └────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐   │
│  │   AI Engine Server   │    │        Main Backend Server          │   │
│  │  (HuggingFace Space) │    │         (Express.js)                │   │
│  │  /predict-frame      │    │         /api/chat                   │   │
│  │  /chat-response      │    │                                      │   │
│  └──────────────────────┘    └──────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VIDEO STORAGE                                   │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐   │
│  │   Local (dev mode)      │    │   Cloudflare R2 (production)    │   │
│  │   /public/videos/       │    │   r2.dev/animations/             │   │
│  └─────────────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Diagrams

### Complete System Workflow

```
User Message (Voice/Text)
         │
         ▼
┌─────────────────────────────────────┐
│       MainChat.jsx                   │
│  1. Sends request to AI Engine       │
│  2. Receives response with:          │
│     - natural_response (text)        │
│     - animation_sequence (gloss[])   │
└─────────────────────────────────────┘
         │
         │ natural_response
         │ animation_sequence
         ▼
┌─────────────────────────────────────┐
│       VideoStage.jsx                 │
│  1. Receives botResponseCount (++)   │
│  2. Receives signSequence (gloss[])  │
│  3. Resolves video URLs              │
│  4. Prefetches first videos          │
│  5. Starts double-buffer playback    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│       Animation Loop (rAF)           │
│  1. Monitor current video time       │
│  2. Detect near-end (250ms)          │
│  3. Swap active player               │
│  4. Preload next video               │
│  5. Repeat until sequence ends       │
└─────────────────────────────────────┘
```

### Animation Sequence Flow

```
START: animation_sequence = ["hello", "how", "are", "you"]

Step 1: Initial Load
┌──────────────────────────────────────┐
│ Player 1: hello.mp4 ──► PLAYING       │
│ Player 2: how.mp4   ──► LOADED       │
│ playlist: [hello, how, are, you]      │
└──────────────────────────────────────┘
         │
         │ (250ms before end of hello.mp4)
         ▼
Step 2: First Transition
┌──────────────────────────────────────┐
│ Player 1: hello.mp4 ──► PAUSED       │
│ Player 2: how.mp4   ──► PLAYING     │
│ Preload are.mp4 into Player 1        │
└──────────────────────────────────────┘
         │
         │ (250ms before end of how.mp4)
         ▼
Step 3: Second Transition
┌──────────────────────────────────────┐
│ Player 1: are.mp4    ──► PLAYING     │
│ Player 2: how.mp4   ──► PAUSED       │
│ Preload you.mp4 into Player 2        │
└──────────────────────────────────────┘
         │
         │ (250ms before end of are.mp4)
         ▼
Step 4: Third Transition
┌──────────────────────────────────────┐
│ Player 1: are.mp4    ──► PAUSED      │
│ Player 2: you.mp4   ──► PLAYING      │
└──────────────────────────────────────┘
         │
         │ (video ends)
         ▼
Step 5: End of Sequence
┌──────────────────────────────────────┐
│ Animation Complete                   │
│ Return to idle/welcome video         │
└──────────────────────────────────────┘
```

### Webcam Prediction Flow

```
User's Webcam (Recording = true)
         │
         ▼
┌─────────────────────────────────────┐
│ VideoStage.jsx                      │
│ Capture frame every 30ms            │
│ Convert to canvas → blob (JPEG)     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ POST /predict-frame                  │
│ to AI Engine Server                 │
│ (localhost:8000 or HF Space)        │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ AI Engine Returns:                  │
│ {                                   │
│   gloss: "hello",                   │
│   emotion: "happy"                  │
│ }                                   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ MainChat.jsx                        │
│ - Display detected gloss            │
│ - Send to AI for response           │
└─────────────────────────────────────┘
```

---

## Detailed Process Flow

### Step 1: User Sends Message

In `MainChat.jsx`, the user can send either:
- **Voice input**: From webcam with sign language
- **Text input**: Regular text message

```jsx
// Voice input handler (lines 230-282)
const handleVoiceSend = async (finalEmotion) => {
  // ... capture and send to AI engine
  const botResponse = await axios.post(`${AI_ENGINE_URL}/chat-response`, formData);
  const { natural_response, animation_sequence } = botResponse.data;
};

// Text input handler (lines 284-323)
const handleTextSend = async () => {
  const botResponse = await axios.post(`${AI_ENGINE_URL}/chat-response`, formData);
  const { natural_response, animation_sequence } = botResponse.data;
};
```

### Step 2: AI Engine Response

The AI engine returns a JSON object:

```json
{
  "natural_response": "Hello! How are you today?",
  "animation_sequence": ["hello", "how", "are", "you", "today"]
}
```

Where:
- `natural_response`: The text to display in the chat
- `animation_sequence`: Array of gloss words (sign language vocabulary)

### Step 3: MainChat Passes Data to VideoStage

```jsx
// MainChat.jsx lines 267-269
setCurrentGlosses(animation_sequence);
setIsAiOutput(true);
setResponseCount(prev => prev + 1);  // KEY: Triggers animation
```

The `botResponseCount` prop increment triggers the animation in VideoStage.

### Step 4: VideoStage Animation Engine

The animation engine (`VideoStage.jsx:157-263`) performs these operations:

1. **Resolve URLs**: Convert gloss words to video URLs
2. **Prefetch**: Load first few videos into browser cache
3. **Initialize**: Load first 2 videos into double buffers
4. **Start Loop**: Begin the requestAnimationFrame monitoring loop

---

## Double-Buffer Animation Technique

### Why Double Buffer?

Traditional single-video playback causes:
- **Visible gap** between videos (loading delay)
- **Choppy transitions** as new video loads
- **Poor user experience**

### How Double Buffer Works

The system uses **two hidden HTML5 `<video>` elements** that alternate:

```
Time ──────────────────────────────────────────────────────────►

Player 1: [████████████]─────────────────[░░░░░░░░░░░░]────────
Player 2: ──────────────[████████████]──────────────────────────
              ▲                     ▲
              │                     │
         swap here            swap here
         (250ms overlap)      (250ms overlap)
```

### Implementation Details

```javascript
// VideoStage.jsx - Lines 39-51
const player1Ref = useRef(null);  // First video player
const player2Ref = useRef(null);   // Second video player
const [activePlayer, setActivePlayer] = useState(1);  // Which is visible
const playlistRef = useRef([]);    // Array of video URLs

// Animation loop (lines 195-263)
const startAnimationLoop = () => {
  const checkTime = () => {
    const currentPlayer = activePlayerRef.current === 1 ? player1Ref.current : player2Ref.current;
    const nextPlayer = activePlayerRef.current === 1 ? player2Ref.current : player1Ref.current;

    // Check if we're near the end (250ms before finish)
    const timeLeft = currentPlayer.duration - currentPlayer.currentTime;
    const isNearEnd = timeLeft <= TRANSITION_DURATION;

    if (isNearEnd) {
      // Start playing next video
      nextPlayer.play();

      // Swap active player
      const newActive = activePlayerRef.current === 1 ? 2 : 1;
      setActivePlayer(newActive);
      activePlayerRef.current = newActive;

      // Preload the video AFTER next into the now-idle player
      const videoAfterNext = playlistRef.current[nextIndex + 1];
      if (videoAfterNext) {
        currentPlayer.src = videoAfterNext;
        currentPlayer.load();
      }
    }

    animationFrameRef.current = requestAnimationFrame(checkTime);
  };
};
```

### Visual Transition

```jsx
{/* VideoStage.jsx - Lines 314-332 */}

{/* Player 1 - visible when activePlayer === 1 */}
<video
  ref={player1Ref}
  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
    isAnimating && activePlayer === 1 ? 'opacity-100' : 'opacity-0'
  }`}
/>

{/* Player 2 - visible when activePlayer === 2 */}
<video
  ref={player2Ref}
  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
    isAnimating && activePlayer === 2 ? 'opacity-100' : 'opacity-0'
  }`}
/>
```

The `transition-opacity duration-300` creates a smooth 300ms crossfade between videos.

---

## API Integration

### AI Engine Endpoints

#### 1. Predict Frame (Webcam Analysis)
```
POST /predict-frame
Content-Type: multipart/form-data
Body: file (JPEG image from webcam)
```

**Response:**
```json
{
  "gloss": "hello",
  "emotion": "happy",
  "confidence": 0.95
}
```

**Location:** `VideoStage.jsx:112-121`

#### 2. Chat Response (Generate Reply)
```
POST /chat-response
Content-Type: multipart/form-data (voice) or application/x-www-form-urlencoded (text)

For Voice:
  - file: audio/image blob
  - emotion: "happy" | "sad" | "neutral" | "angry" | "surprised"

For Text:
  - user_text: "Hello, how are you?"
```

**Response:**
```json
{
  "natural_response": "Hello! I'm doing great, thank you for asking!",
  "animation_sequence": ["hello", "i", "am", "great", "thank", "you"]
}
```

**Location:** `MainChat.jsx:253-269` and `294-311`

### URL Configuration

```javascript
// api.js - Lines 14-28
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';
const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';
```

---

## Video URL Resolution

### How Videos Are Located

```javascript
// VideoStage.jsx - Lines 147-148
const resolveUrl = (word) =>
  `${VIDEO_BASE_URL}/${encodeURIComponent(word.toLowerCase().trim())}.mp4`;
```

### URL Resolution Flow

```
Input: "Hello" (gloss word from AI)
         │
         ▼
Lowercase & trim: "hello"
         │
         ▼
Encode: "hello"
         │
         ▼
Append base URL:
  - Dev: /videos/hello.mp4
  - Prod: https://...r2.dev/animations/hello.mp4
         │
         ▼
Final URL for video player
```

### Example Resolutions

| Gloss Word | Dev URL | Production URL |
|------------|---------|----------------|
| hello | `/videos/hello.mp4` | `https://pub-...r2.dev/animations/hello.mp4` |
| thankyou | `/videos/thankyou.mp4` | `https://pub-...r2.dev/animations/thankyou.mp4` |
| howareyou | `/videos/howareyou.mp4` | `https://pub-...r2.dev/animations/howareyou.mp4` |

**Important:** All video files must be stored in **lowercase** filenames.

---

## Prefetching Mechanism

### Why Prefetch?

When a user triggers an animation, waiting for each video to load before playing causes:
- Visible pauses between signs
- Choppy animation
- Poor user experience

### How Prefetch Works

```javascript
// utils/prefetch.js
export const prefetchVideos = (videoUrls) => {
  // Filter out null/undefined URLs
  const toPrefetch = videoUrls.slice(0, 3);  // Prefetch first 3

  toPrefetch.forEach(videoUrl => {
    // Create a link element for browser to cache
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = videoUrl;
    link.as = 'video';
    document.head.appendChild(link);
  });
};
```

### Prefetch Flow

```
Animation Sequence: ["hello", "how", "are", "you"]
         │
         ▼
Resolve URLs:
  ["https://.../hello.mp4", "https://.../how.mp4", ...]
         │
         ▼
Call prefetchVideos(playlist)
         │
         ▼
Browser caches first 3 videos in background
         │
         ▼
When animation starts, videos are already in cache → instant playback
```

**Location:** `VideoStage.jsx:166`

---

## Key Code References

### MainChat.jsx
| Line | Description |
|------|-------------|
| 230-282 | Voice input handler - sends frame to AI |
| 284-323 | Text input handler - sends text to AI |
| 257 | Extracts `animation_sequence` from response |
| 263 | Attaches sign sequence to bot message |
| 267 | Sets current glosses for VideoStage |
| 269 | Increments `botResponseCount` to trigger animation |

### VideoStage.jsx
| Line | Description |
|------|-------------|
| 33-35 | Webcam video reference |
| 40-43 | Double-buffer player references |
| 48-50 | Playlist and index refs |
| 147-148 | URL resolution function |
| 151-155 | Effect that triggers on `botResponseCount` change |
| 157-193 | `playSequence` - initializes playback |
| 195-263 | `startAnimationLoop` - animation frame loop |
| 279-332 | Render - video elements with opacity transitions |

### api.js
| Line | Description |
|------|-------------|
| 14-15 | Backend URL configuration |
| 22 | Cloudflare R2 base URL |
| 23-25 | Video base URL (local vs production) |
| 27-28 | AI Engine URL configuration |

### utils/prefetch.js
| Line | Description |
|------|-------------|
| 12-22 | Video prefetch implementation |

---

## Configuration

### Environment Variables

| Variable | Purpose | Dev Value | Prod Value |
|----------|---------|-----------|-------------|
| `VITE_BACKEND_URL` | Main backend server | `http://localhost:5005` | Vercel URL |
| `VITE_AI_ENGINE_URL` | AI Engine (sign detection + chat) | `http://localhost:8000` | HF Space URL |
| `VITE_USE_LOCAL_VIDEOS` | Use local videos instead of R2 | `true` | (not set) |

### Video Storage

**Development:**
```
client/public/videos/
  ├── hello.mp4
  ├── how.mp4
  ├── thankyou.mp4
  └── ... (all lowercase filenames)
```

**Production:**
```
Cloudflare R2 Bucket: pub-c4751c4c00514714b4e7a941dd0d90d1
Path: /animations/
  ├── hello.mp4
  ├── how.mp4
  └── ...
```

### How to Add New Signs

1. Create video file (e.g., `myname.mp4`)
2. Save in appropriate location:
   - Dev: `client/public/videos/myname.mp4`
   - Prod: Upload to R2 bucket `/animations/` folder
3. Ensure filename is **lowercase**
4. The AI engine will return the gloss word (e.g., "myname") in `animation_sequence`
5. The system will automatically resolve and play the video

---

## Troubleshooting

### Videos Not Playing

1. **Check filename case**: All files must be lowercase
2. **Verify URL resolution**: Check browser console for resolved URLs
3. **Check network**: Ensure R2 bucket is accessible
4. **Local mode**: Ensure `VITE_USE_LOCAL_VIDEOS=true` is set

### Animation Not Triggering

1. Verify `botResponseCount` is incrementing in React DevTools
2. Check console for `[Avatar] Starting sequence:` log
3. Ensure `signSequence` is not empty

### Webcam Not Working

1. Requires HTTPS or localhost (not http)
2. Check browser permissions for camera access
3. Use Chrome/Firefox (Safari may have restrictions)

---

## Summary

The animation system works as follows:

1. **User interacts** (voice/text) → MainChat sends to AI Engine
2. **AI Engine returns** → `natural_response` + `animation_sequence` (gloss words)
3. **MainChat passes** → `signSequence` + increments `botResponseCount`
4. **VideoStage triggers** → Resolves URLs, prefetches, starts double-buffer playback
5. **Animation runs** → requestAnimationFrame monitors and swaps videos smoothly
6. **Sequence ends** → Returns to idle/welcome video

The double-buffer technique ensures smooth, gap-free transitions between sign videos by preloading and alternating between two video players.
