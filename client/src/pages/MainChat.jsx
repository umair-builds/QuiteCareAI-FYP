import React, { useState } from 'react';
import axios from 'axios';
import { Bot } from 'lucide-react'; 

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

  // [NEW] Logic Flag: Tracks if the text in the bar is from the AI
  const [isAiOutput, setIsAiOutput] = useState(false);

  // --- HANDLERS ---
  const handleNewSession = () => {
    setSessionStarted(true);
    setIsRecording(false);
    setCurrentGlosses([]);
    setIsAiOutput(false); // Reset flag
    setMessages([{ sender: 'bot', text: 'Hello! Press START to begin signing.' }]);
  };

  const handleGlossDetected = (newGloss) => {
    // If we start signing, assume it's user input (safety check)
    if (isAiOutput) {
        setIsAiOutput(false);
        setCurrentGlosses([]);
    }

    setCurrentGlosses((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === newGloss) return prev;
        return [...prev, newGloss];
    });
  };

  const handleManualEdit = (e) => {
    // [FIX] If it is AI output, DO NOT allow editing
    if (isAiOutput) return; 

    const newText = e.target.value;
    setCurrentGlosses(newText ? newText.split(" ") : []);
  };

  const handleStart = () => {
    // [FIX] When START is clicked, always CLEAR the bar and RESET flags
    setIsRecording(true);
    setIsAiOutput(false); 
    setCurrentGlosses([]); 
    console.log("Recording Started - Session Cleared");
  };

  const handlePause = () => {
    setIsRecording(false);
    console.log("Recording Paused");
  };

  const handleRetake = () => {
    setIsRecording(false);
    setIsAiOutput(false);
    setCurrentGlosses([]);
    console.log("Session Cleared");
  };

  // --- THE FULL CONVERSATION LOGIC ---
  const handleEnter = async () => {
    setIsRecording(false); 
    
    // [FIX] If the text currently shown is AI Output, ignore the Enter click.
    if (isAiOutput) return;
    
    if (currentGlosses.length === 0) return;

    // 1. Prepare User's Gloss
    const rawGlossText = currentGlosses.join(" ");
    
    // [UX] Show "Translating" without emoji
    setMessages(prev => [...prev, { sender: 'user', text: `[${rawGlossText}] ... Translating` }]);

    try {
      const formData = new FormData();
      formData.append('gloss_text', rawGlossText);

      // 2. STEP A: Get English Sentence
      const transResponse = await axios.post('http://127.0.0.1:8000/translate', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      const userSentence = transResponse.data.sentence;

      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); 
        newLog.push({ sender: 'user', text: userSentence });
        // [UX] Show "Thinking" without emoji
        newLog.push({ sender: 'bot', text: "Thinking..." }); 
        return newLog;
      });
      
      // 3. STEP B: Get Bot Response
      const chatFormData = new FormData();
      chatFormData.append('user_text', userSentence);

      const botResponse = await axios.post('http://127.0.0.1:8000/chat-response', chatFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { reply, gloss } = botResponse.data;

      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); 
        newLog.push({ sender: 'bot', text: reply });
        return newLog;
      });

      // Display AI Gloss and LOCK it
      setCurrentGlosses(gloss.split(" "));
      setIsAiOutput(true); 

    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => {
         const newLog = [...prev];
         if(newLog[newLog.length-1].text.includes("Thinking") || newLog[newLog.length-1].text.includes("Translating")) {
             newLog.pop();
         }
         newLog.push({ sender: 'bot', text: "Connection Error" });
         return newLog;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900">
      <Navbar page="chat" />
      <div className="flex flex-1 overflow-hidden pt-20">
        <Sidebar onNewSession={handleNewSession} />
        <div className="flex-1 flex flex-col relative h-full">
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

          <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
            <div className="max-w-5xl mx-auto flex flex-col h-full">
              {sessionStarted ? (
                <>
                  <VideoStage isRecording={isRecording} onGlossDetected={handleGlossDetected} />
                  
                  {/* LIVE GLOSS PREVIEW BAR */}
                  <div className="mb-2 text-center px-4">
                     {isRecording ? (
                        // RECORDING MODE: Read-Only Blue Badge
                        <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-mono font-bold shadow-sm border border-blue-100 block w-full min-h-[35px] flex items-center justify-center">
                            {currentGlosses.length > 0 ? currentGlosses.join(" ") : "Waiting for signs..."}
                        </span>
                     ) : (
                        // PAUSED MODE: 
                        // If isAiOutput is TRUE -> Grey Box (Locked)
                        // If isAiOutput is FALSE -> White Box (Editable)
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                value={currentGlosses.join(" ")}
                                onChange={handleManualEdit}
                                disabled={isAiOutput} // [FIX] Disable typing if it's AI output
                                placeholder={isAiOutput ? "AI Response (Click Start to reply)" : "Type or correct signs here..."}
                                className={`w-full px-4 py-2 rounded-lg text-xs font-mono font-bold shadow-sm border focus:outline-none text-center transition-all ${
                                    isAiOutput 
                                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' // Locked Style
                                    : 'bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-blue-500' // Editable Style
                                }`}
                            />
                            {!isAiOutput && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-sans pointer-events-none">
                                    EDIT MODE
                                </span>
                            )}
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
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-20">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 mb-6">
                        <Bot size={32} className="text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">QuietCare AI</h1>
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                        Please click the <span className="font-bold text-gray-700 mx-1">"New Session"</span> button.
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChat;