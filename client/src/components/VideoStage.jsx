import React, { useEffect, useRef, useState } from 'react';
import { Camera, Bot, Activity } from 'lucide-react';
import axios from 'axios';
import { VIDEO_BASE_URL, AI_ENGINE_URL } from '../services/api';
import { prefetchVideos } from '../utils/prefetch';
import { validSigns } from '../utils/validSigns';

// --- ASSETS ---
import welcomeVideo from '../assets/welcome.mp4';

const TRANSITION_DURATION = 0.25; // 250ms overlap

/**
 * VideoStage
 *
 * Props:
 *   isRecording        – bool   – webcam is actively capturing frames
 *   onGlossDetected    – fn     – called when the AI predicts a new sign word
 *   onEmotionDetected  – fn     – called with per-frame emotion label
 *   botResponseCount   – number – increments each time the bot replies (triggers animation)
 *   signSequence       – string[] – the gloss sequence the bot wants to animate
 *   onActiveSignChange – fn(index) – called whenever the current video index changes
 *                                    (-1 means animation finished / not started)
 */
const VideoStage = ({
  isRecording,
  onGlossDetected,
  onEmotionDetected,
  botResponseCount,
  signSequence,
  onActiveSignChange,
}) => {
  // --- WEBCAM REFS ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const isRecordingRef = useRef(isRecording);
  const isBusyRef = useRef(false);

  // --- AVATAR ANIMATION REFS (DOUBLE BUFFER) ---
  const player1Ref = useRef(null);
  const player2Ref = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activePlayer, setActivePlayer] = useState(1);

  // Ref to track active player instantly inside the rAF loop
  const activePlayerRef = useRef(1);

  const playlistRef = useRef([]);        // resolved video URLs
  const rawSignsRef = useRef([]);        // original sign words (parallel to playlist)
  const currentVideoIndexRef = useRef(0);
  const animationFrameRef = useRef(null);

  // =========================================================
  // 🟢 SECTION 1: WEBCAM / PREDICTION LOGIC (UNTOUCHED)
  // =========================================================
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // 1. Start Webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("Camera API not available – requires HTTPS or localhost.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Webcam error:', err);
      }
    };
    startWebcam();
  }, []);

  // 2. Smart Frame-Send Loop (fire-and-forget, no lag)
  useEffect(() => {
    let intervalId;

    if (isRecording && cameraActive) {
      intervalId = setInterval(async () => {
        if (!isRecordingRef.current) return;
        if (isBusyRef.current) return;

        if (videoRef.current && canvasRef.current) {
          isBusyRef.current = true;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('file', blob, 'frame.jpg');
              try {
                const response = await axios.post(
                  `${AI_ENGINE_URL}/predict-frame`,
                  formData,
                  { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': '1' } }
                );

                const frameEmotion = response.data.emotion;
                if (frameEmotion && onEmotionDetected) onEmotionDetected(frameEmotion);

                if (response.data.gloss) onGlossDetected(response.data.gloss, frameEmotion);
              } catch (_) {
                // Silently drop frames when the server is busy
              } finally {
                isBusyRef.current = false;
              }
            } else {
              isBusyRef.current = false;
            }
          }, 'image/jpeg', 0.8);
        }
      }, 30);
    }

    return () => clearInterval(intervalId);
  }, [isRecording, cameraActive, onGlossDetected]);

  // =========================================================
  // 🔵 SECTION 2: AVATAR ANIMATION ENGINE (DOUBLE BUFFER)
  // =========================================================

  // Fire whenever the bot sends a new response
  useEffect(() => {
    if (botResponseCount > 0 && signSequence && signSequence.length > 0) {
      playSequence(signSequence);
    }
  }, [botResponseCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const playSequence = (signs) => {
    if (!signs || signs.length === 0) return;

    console.log('[Avatar] Starting sequence:', signs);

    const usedRandoms = new Set();
    const existingSigns = signs.map(s => s.toLowerCase().trim()).filter(s => validSigns.includes(s));

    // Build resolved URL list (lowercase filenames)
    const playlist = signs.map(word => {
      const cleanWord = word.toLowerCase().trim();
      if (validSigns.includes(cleanWord)) {
        return `${VIDEO_BASE_URL}/${encodeURIComponent(cleanWord)}.mp4`;
      } else {
        // Pick a random valid sign that is NOT in the current sentence and NOT already used
        let candidates = validSigns.filter(s => !existingSigns.includes(s) && !usedRandoms.has(s));
        if (candidates.length === 0) candidates = validSigns; // fallback if exhausted
        const randomSign = candidates[Math.floor(Math.random() * candidates.length)];
        usedRandoms.add(randomSign);
        return `${VIDEO_BASE_URL}/${encodeURIComponent(randomSign)}.mp4`;
      }
    });

    // Prefetch first few URLs so they are already in cache when needed
    prefetchVideos(playlist);

    rawSignsRef.current = signs;
    playlistRef.current = playlist;
    currentVideoIndexRef.current = 0;

    if (!player1Ref.current || !player2Ref.current) return;

    // Load first two clips
    player1Ref.current.src = playlist[0];
    player1Ref.current.currentTime = 0;

    if (playlist.length > 1) {
      player2Ref.current.src = playlist[1];
      player2Ref.current.currentTime = 0;
    }

    setIsAnimating(true);
    setActivePlayer(1);
    activePlayerRef.current = 1;

    // Notify parent: word index 0 is now active
    if (onActiveSignChange) onActiveSignChange(0);

    player1Ref.current.play().catch((e) => console.error('[Avatar] Play error:', e));

    startAnimationLoop();
  };

  const startAnimationLoop = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const checkTime = () => {
      const p1 = player1Ref.current;
      const p2 = player2Ref.current;
      if (!p1 || !p2) return;

      const currentId = activePlayerRef.current;
      const currentPlayer = currentId === 1 ? p1 : p2;
      const nextPlayer = currentId === 1 ? p2 : p1;

      let timeLeft = currentPlayer.duration - currentPlayer.currentTime;

      // If a video failed to load (404 / network error), skip it immediately
      if (currentPlayer.error) {
        timeLeft = 0;
      } else if (isNaN(timeLeft)) {
        animationFrameRef.current = requestAnimationFrame(checkTime);
        return;
      }

      const isNearEnd = timeLeft <= TRANSITION_DURATION;

      if (isNearEnd && !nextPlayer.paused) {
        // Already transitioning – do nothing
      } else if (isNearEnd) {
        const nextIndex = currentVideoIndexRef.current + 1;

        if (nextIndex < playlistRef.current.length) {
          // ── Transition to next clip ──────────────────────────
          nextPlayer.play().catch((e) => console.error('[Avatar] Next play error:', e));

          const newActive = currentId === 1 ? 2 : 1;
          setActivePlayer(newActive);
          activePlayerRef.current = newActive;

          currentVideoIndexRef.current = nextIndex;

          // Notify parent which word is now highlighted
          if (onActiveSignChange) onActiveSignChange(nextIndex);

          // Pre-load the clip after next into the now-idle player
          const videoAfterNext = playlistRef.current[nextIndex + 1];
          if (videoAfterNext) {
            setTimeout(() => {
              currentPlayer.pause();
              currentPlayer.currentTime = 0;
              currentPlayer.src = videoAfterNext;
              currentPlayer.load();
            }, TRANSITION_DURATION * 1000 + 100);
          }
        } else {
          // ── End of Playlist ──────────────────────────────────
          setTimeout(() => {
            setIsAnimating(false);
            currentPlayer.pause();
            currentPlayer.currentTime = 0;
            if (onActiveSignChange) onActiveSignChange(-1); // nothing active
          }, timeLeft * 1000);
          return; // stop the rAF loop
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkTime);
    };

    animationFrameRef.current = requestAnimationFrame(checkTime);
  };

  // =========================================================
  // 🖼️ RENDER
  // =========================================================
  return (
    <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[350px] w-full mb-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT: USER INPUT (webcam) */}
      <div
        className={`flex-1 rounded-xl overflow-hidden relative shadow-md border-2 transition-colors aspect-video md:aspect-auto ${
          isRecording ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <div className="bg-black w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Camera size={12} /> <span>User Input</span>
          </div>
          {isRecording && (
            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 animate-pulse">
              <Activity size={12} /> <span>LIVE AI</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: AVATAR OUTPUT */}
      <div className="flex-1 bg-gray-100 rounded-xl flex flex-col items-center justify-center relative shadow-md border border-gray-200 overflow-hidden aspect-video md:aspect-auto">

        {/* 1. IDLE / WELCOME video (visible when not animating) */}
        <video
          src={welcomeVideo}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* 2. PLAYER 1 (double-buffer) */}
        <video
          ref={player1Ref}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isAnimating && activePlayer === 1 ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 3. PLAYER 2 (double-buffer) */}
        <video
          ref={player2Ref}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isAnimating && activePlayer === 2 ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm z-10">
          <Bot size={12} /> <span>AI Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default VideoStage;