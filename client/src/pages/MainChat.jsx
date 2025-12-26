import React, { useState } from 'react';
import axios from 'axios';

// Import Components
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoStage from '../components/VideoStage';
import ControlPanel from '../components/ControlPanel';
import ChatLog from '../components/ChatLog';

const MainChat = () => {
  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [currentGlosses, setCurrentGlosses] = useState([]); 
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Press START to begin signing.' }
  ]);

  // --- HANDLERS ---
  const handleGlossDetected = (newGloss) => {
    setCurrentGlosses((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === newGloss) return prev;
        return [...prev, newGloss];
    });
  };

  const handleStart = () => {
    setIsRecording(true);
    setCurrentGlosses([]); 
    console.log("Recording Started");
  };

  const handlePause = () => {
    setIsRecording(false);
    console.log("Recording Paused");
  };

  const handleRetake = () => {
    setIsRecording(false);
    setCurrentGlosses([]);
    console.log("Session Cleared");
  };

  const handleEnter = async () => {
    setIsRecording(false); 
    
    if (currentGlosses.length === 0) return;

    const rawGlossText = currentGlosses.join(" ");
    setMessages(prev => [...prev, { sender: 'user', text: `[${rawGlossText}] ... Translating` }]);

    try {
      const formData = new FormData();
      formData.append('gloss_text', rawGlossText);

      const response = await axios.post('http://127.0.0.1:8000/translate', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });

      const finalSentence = response.data.sentence;

      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); 
        newLog.push({ sender: 'user', text: finalSentence });
        return newLog;
      });

    } catch (err) {
      console.error("Translation Error:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Error connecting to AI Brain." }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900">
      
      <Navbar page="chat" />

      {/* Main Workspace (padded top for fixed Navbar) */}
      <div className="flex flex-1 overflow-hidden pt-20">
        
        <Sidebar />

        <div className="flex-1 flex flex-col relative h-full">
          
          {/* COMPACT HEADER (Reduced Height) */}
          <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0">
            <h2 className="font-semibold text-sm text-gray-800">New Session</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
              <span className="text-[10px] uppercase font-bold text-gray-500">
                {isRecording ? "Listening" : "Active"}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              
              {/* VIDEO AREA */}
              <VideoStage 
                 isRecording={isRecording} 
                 onGlossDetected={handleGlossDetected} 
              />
              
              {/* LIVE GLOSS PREVIEW BAR */}
              <div className="mb-2 text-center">
                 <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-lg text-xs font-mono font-bold shadow-sm border border-blue-100 block min-h-[30px] flex items-center justify-center">
                    {currentGlosses.length > 0 ? currentGlosses.join(" ") : "Waiting for signs..."}
                 </span>
              </div>

              {/* CONTROLS (Compacted) */}
              <ControlPanel 
                onStart={handleStart}
                onPause={handlePause}
                onEnter={handleEnter}
                onRetake={handleRetake}
                onClose={() => console.log("Close session")}
              />
              
              {/* CHAT LOG (Expanded) */}
              <ChatLog messages={messages} />

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainChat;