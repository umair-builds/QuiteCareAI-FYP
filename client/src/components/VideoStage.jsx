import React, { useEffect, useRef, useState } from 'react';
import { Camera, Bot, Activity } from 'lucide-react';
import axios from 'axios';

// [NEW] Import the video file
import welcomeVideo from '../assets/welcome.mp4'; 

const VideoStage = ({ isRecording, onGlossDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Track recording state
  const isRecordingRef = useRef(isRecording);
  
  // Track busy state to prevent lag
  const isBusyRef = useRef(false);

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
                const response = await axios.post('http://127.0.0.1:8000/predict-frame', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.gloss) {
                  console.log("Python saw:", response.data.gloss);
                  onGlossDetected(response.data.gloss);
                }
              } catch (error) {
                console.error("Frame dropped (Server busy)");
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
  }, [isRecording, cameraActive]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[350px] w-full mb-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Left: User Webcam */}
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

      {/* Right: Avatar Output (UPDATED) */}
      <div className="flex-1 bg-gray-100 rounded-xl flex flex-col items-center justify-center relative shadow-md border border-gray-200 overflow-hidden">
        
        {/* [NEW] The Welcome Video */}
        <video 
          src={welcomeVideo} 
          autoPlay 
          playsInline
          // Removed 'loop' so it stops when done
          // Removed 'controls' so user can't stop it
          className="w-full h-full object-cover"
        />

        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
          <Bot size={12} /> <span>AI Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default VideoStage;