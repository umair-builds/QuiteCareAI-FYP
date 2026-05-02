import React, { useEffect, useRef, useState } from 'react';
import { Camera, Bot, Activity } from 'lucide-react';
import axios from 'axios';
import { R2_URL, AI_ENGINE_URL } from '../services/api';
import { prefetchVideos } from '../utils/prefetch';

// --- ASSETS ---
import welcomeVideo from '../assets/welcome.mp4';

const TRANSITION_DURATION = 0.25; // 250ms overlap

// --- FALLBACK SYSTEM (PLACEHOLDER MODE) ---
// Using only the videos you have confirmed are available in R2.
const FALLBACK_POOL = [
  'easy', 'enough', 'feel', 'heavy', 'other', 
  'pain', 'busy', 'also', 'attack'
]; 

const VideoStage = ({ isRecording, onGlossDetected, onEmotionDetected, botResponseCount, signSequence }) => {
  // --- WEBCAM REFS (TOUCHED NOTHING HERE) ---
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
  
  // Ref to track active player instantly inside the loop
  const activePlayerRef = useRef(1); 
  
  const playlistRef = useRef([]);
  const currentVideoIndexRef = useRef(0);
  const animationFrameRef = useRef(null);

  // =========================================================
  // 🟢 SECTION 1: SENSITIVE PREDICTION LOGIC (UNTOUCHED)
  // =========================================================
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // 1. Start Webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Webcam error:", err);
      }
    };
    startWebcam();
  }, []);

  // 2. The "Smart Loop" (No Lag)
  useEffect(() => {
    let intervalId;

    if (isRecording && cameraActive) {
      intervalId = setInterval(async () => {
        if (!isRecordingRef.current) return;
        if (isBusyRef.current) return; // Skip frame if busy

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
                const response = await axios.post(`${AI_ENGINE_URL}/predict-frame`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Always forward the per-frame emotion to the buffer in MainChat
                const frameEmotion = response.data.emotion;
                if (frameEmotion && onEmotionDetected) {
                  onEmotionDetected(frameEmotion);
                }

                // Only fire onGlossDetected when a new sign word is confirmed
                if (response.data.gloss) {
                  onGlossDetected(response.data.gloss, frameEmotion);
                }
              } catch (error) {
                // console.error("Frame dropped (Server busy)");
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
  // 🔵 SECTION 2: AVATAR ANIMATION ENGINE (RESTORED DOUBLE BUFFER)
  // =========================================================

  // Trigger animation when botResponseCount changes
  useEffect(() => {
    if (botResponseCount > 0) {
      // PLACEHOLDER MODE: Ignore actual signs and pick 5 random safe ones
      const randomSigns = Array.from({ length: 5 }, () => 
        FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)]
      );
      
      playSequence(randomSigns);
    }
  }, [botResponseCount]); // Ignore signSequence for now

  const playSequence = (signs) => {
    console.log("Starting Animation Sequence:", signs);
    prefetchVideos(signs);
    
    // Map signs to actual Cloudflare R2 video URLs (ensure lowercase and URL-encoded)
    const playlist = signs.map(sign => `${R2_URL}/${encodeURIComponent(sign.toLowerCase().trim())}.mp4`);
    
    playlistRef.current = playlist;
    currentVideoIndexRef.current = 0;
    
    // Reset players
    if (player1Ref.current && player2Ref.current) {
      player1Ref.current.src = playlist[0];
      player1Ref.current.currentTime = 0;
      
      // Prepare second player if exists
      if (playlist.length > 1) {
        player2Ref.current.src = playlist[1];
        player2Ref.current.currentTime = 0;
      }
      
      // Start!
      setIsAnimating(true);
      setActivePlayer(1);
      activePlayerRef.current = 1; 
      
      player1Ref.current.play().catch(e => console.error("Play error", e));
      
      // Start the monitoring loop
      startAnimationLoop();
    }
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
      
      // If the video failed to load (e.g., 404 Not Found), skip it instead of freezing
      if (currentPlayer.error) {
         timeLeft = 0;
      } else if (isNaN(timeLeft)) {
         animationFrameRef.current = requestAnimationFrame(checkTime);
         return;
      }

      const isNearEnd = timeLeft <= TRANSITION_DURATION;

      if (isNearEnd && !nextPlayer.paused) {
        // We are already transitioning
      } else if (isNearEnd) {
        // TIME TO TRANSITION!
        const nextIndex = currentVideoIndexRef.current + 1;
        
        if (nextIndex < playlistRef.current.length) {
          // Play next video
          nextPlayer.play().catch(e => console.error("Next play error", e));
          
          // Swap active state
          const newActive = currentId === 1 ? 2 : 1;
          setActivePlayer(newActive); 
          activePlayerRef.current = newActive;
          
          currentVideoIndexRef.current = nextIndex;

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
          // End of Playlist
          setTimeout(() => {
            setIsAnimating(false);
            currentPlayer.pause();
            currentPlayer.currentTime = 0;
          }, timeLeft * 1000); 
          return; // Stop loop
        }
      }
      animationFrameRef.current = requestAnimationFrame(checkTime);
    };
    animationFrameRef.current = requestAnimationFrame(checkTime);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[350px] w-full mb-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT: USER INPUT */}
      <div className={`flex-1 rounded-xl overflow-hidden relative shadow-md border-2 transition-colors ${isRecording ? 'border-red-500' : 'border-gray-200'}`}>
        <div className="bg-black w-full h-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
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
      <div className="flex-1 bg-gray-100 rounded-xl flex flex-col items-center justify-center relative shadow-md border border-gray-200 overflow-hidden">
        
        {/* 1. IDLE LOOP (Ensured NO LOOP so it plays once) */}
        <video 
          src={welcomeVideo} 
          autoPlay 
          playsInline 
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* 2. PLAYER 1 */}
        <video 
          ref={player1Ref}
          playsInline 
          muted 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isAnimating && activePlayer === 1 ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* 3. PLAYER 2 */}
        <video 
          ref={player2Ref}
          playsInline 
          muted 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isAnimating && activePlayer === 2 ? 'opacity-100' : 'opacity-0'}`}
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