import React, { useState } from 'react';
import axios from 'axios';
import { Bot } from 'lucide-react'; 

// Import Components
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoStage from '../components/VideoStage';
import ControlPanel from '../components/ControlPanel';
import ChatLog from '../components/ChatLog';

const MainChat = () => {
  // --- STATE ---
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentGlosses, setCurrentGlosses] = useState([]); 
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Press START to begin signing.' }
  ]);

  // --- HANDLERS ---
  const handleNewSession = () => {
    setSessionStarted(true);
    setIsRecording(false);
    setCurrentGlosses([]);
    setMessages([{ sender: 'bot', text: 'Hello! Press START to begin signing.' }]);
  };

  const handleGlossDetected = (newGloss) => {
    setCurrentGlosses((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === newGloss) return prev;
        return [...prev, newGloss];
    });
  };

  // Allow manual editing of the blue bar
  const handleManualEdit = (e) => {
    const newText = e.target.value;
    setCurrentGlosses(newText ? newText.split(" ") : []);
  };

  const handleStart = () => {
    setIsRecording(true);
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

  // --- THE FIXED TRANSLATION LOGIC ---
  const handleEnter = async () => {
    setIsRecording(false); 
    
    if (currentGlosses.length === 0) return;

    // 1. Prepare Gloss Text
    const rawGlossText = currentGlosses.join(" ");
    
    // 2. Show "Translating..." immediately so user knows it's working
    setMessages(prev => [...prev, { sender: 'user', text: `[${rawGlossText}] ... Translating ⏳` }]);

    try {
      const formData = new FormData();
      formData.append('gloss_text', rawGlossText);

      // 3. Send to Python Brain
      const response = await axios.post('http://127.0.0.1:8000/translate', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 4. Get the Perfect Sentence
      const finalSentence = response.data.sentence;

      // 5. SWAP the "Translating..." message with the Final Sentence
      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); // Remove the "Translating..." bubble
        newLog.push({ sender: 'user', text: finalSentence }); // Insert the Real Sentence
        return newLog;
      });
      
      // Clear the gloss bar for the next sentence
      setCurrentGlosses([]);

    } catch (err) {
      console.error("Translation Error:", err);
      
      // 6. ERROR HANDLING: If server fails, keep the Gloss and show error
      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); // Remove "Translating..."
        newLog.push({ sender: 'user', text: rawGlossText }); // Keep the Gloss (don't lose user data)
        newLog.push({ sender: 'bot', text: "⚠️ AI Brain is offline. Could not translate." });
        return newLog;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900">
      
      <Navbar page="chat" />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden pt-20">
        
        <Sidebar onNewSession={handleNewSession} />

        <div className="flex-1 flex flex-col relative h-full">
          
          {/* Header */}
          <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0">
            <h2 className="font-semibold text-sm text-gray-800">
                {sessionStarted ? "Current Session" : "Welcome"}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
              <span className="text-[10px] uppercase font-bold text-gray-500">
                {isRecording ? "Listening" : "Ready"}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              
              {sessionStarted ? (
                <>
                  {/* VIDEO AREA */}
                  <VideoStage 
                     isRecording={isRecording} 
                     onGlossDetected={handleGlossDetected} 
                  />
                  
                  {/* LIVE GLOSS PREVIEW BAR (EDITABLE) */}
                  <div className="mb-2 text-center px-4">
                     {isRecording ? (
                        // RECORDING MODE: Read-Only Blue Badge
                        <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-mono font-bold shadow-sm border border-blue-100 block w-full min-h-[35px] flex items-center justify-center">
                            {currentGlosses.length > 0 ? currentGlosses.join(" ") : "Waiting for signs..."}
                        </span>
                     ) : (
                        // PAUSED MODE: Editable White Input
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                value={currentGlosses.join(" ")}
                                onChange={handleManualEdit}
                                placeholder="Type or correct signs here..."
                                className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-mono font-bold shadow-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-sans pointer-events-none">
                                EDIT MODE
                            </span>
                        </div>
                     )}
                  </div>

                  <ControlPanel 
                    onStart={handleStart}
                    onPause={handlePause}
                    onEnter={handleEnter}
                    onRetake={handleRetake}
                    onClose={() => setSessionStarted(false)}
                  />
                  
                  <ChatLog messages={messages} />
                </>
              ) : (
                <>
                  {/* WELCOME SCREEN */}
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-20">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 mb-6">
                        <Bot size={32} className="text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">QuietCare AI</h1>
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                        Please click the 
                        <span className="font-bold text-gray-700 mx-1">"New Session"</span> 
                        button in the sidebar.
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainChat;