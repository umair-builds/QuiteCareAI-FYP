import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { clearReplaySequence } from '../features/chat/chatSlice';
import API_BASE, { AI_ENGINE_URL } from '../services/api';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoStage from '../components/VideoStage';
import ControlPanel from '../components/ControlPanel';
import ChatLog from '../components/ChatLog';

const MainChat = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { replaySequence } = useSelector((state) => state.chat);

  // --- STATE ---
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentGlosses, setCurrentGlosses] = useState([]);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Press START to begin signing.' }
  ]);
  const [isAiOutput, setIsAiOutput] = useState(false);

  // Track active chat ID and Title
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState("New Sign Session"); // [NEW]

  // Track how many times bot has responded
  const [responseCount, setResponseCount] = useState(0);

  // Index of the gloss word currently being signed by the avatar (-1 = idle)
  const [activeSignIndex, setActiveSignIndex] = useState(-1);

  // Text input state
  const [textInput, setTextInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- EMOTION BUFFER ---
  // Collects the live emotion label from every /predict-frame response.
  // When the user presses Enter we compute the statistical mode and send it
  // to Aria so the LLM can personalise its empathetic response.
  const [emotionBuffer, setEmotionBuffer] = useState([]);
  // Stores the last emotion sent to Aria — shown as a sleek badge, auto-clears
  const [lastSentEmotion, setLastSentEmotion] = useState(null);

  // Auto-clear the emotion badge after 4 seconds
  useEffect(() => {
    if (!lastSentEmotion) return;
    const timer = setTimeout(() => setLastSentEmotion(null), 4000);
    return () => clearTimeout(timer);
  }, [lastSentEmotion]);

  // Helper: return the most-frequent element in an array of strings.
  // Falls back to 'Neutral' if the array is empty.
  const calculateMode = (arr) => {
    if (!arr || arr.length === 0) return 'Neutral';
    const freq = {};
    let maxCount = 0;
    let mode = arr[0];
    for (const item of arr) {
      freq[item] = (freq[item] || 0) + 1;
      if (freq[item] > maxCount) {
        maxCount = freq[item];
        mode = item;
      }
    }
    return mode;
  };

  // --- BACKGROUND AUTO-SAVE [NEW] ---
  useEffect(() => {
    const autoSave = async () => {
      // Only run auto-save if session is active and we have real messages
      if (sessionStarted && user && messages.length > 1) {
        // Prevent saving if the last message is a loading state
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.text === "Thinking..." || lastMessage.text.includes("... Translating")) {
            return; 
        }

        try {
          const res = await axios.post(`${API_BASE}/api/chat/save`, {
            userId: user.id || user._id,
            chatId: currentChatId,
            existingTitle: chatTitle,
            messages: messages
          });
          
          if (res.data.chat) {
            // Lock in the database ID so future messages update this exact file
            if (!currentChatId) setCurrentChatId(res.data.chat._id);
            // Update the title if Groq generated a new one
            if (res.data.chat.title !== chatTitle) setChatTitle(res.data.chat.title);
          }
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    };
    
    // Trigger the save every time the 'messages' array changes
    autoSave();
  }, [messages, sessionStarted, user, currentChatId, chatTitle]); 

  // --- [NEW] LISTENER FOR AVATAR REPLAY ---
  useEffect(() => {
    if (replaySequence) {
      setCurrentGlosses(replaySequence); // Push words to the bar
      setIsAiOutput(true);               // Tell UI the bot is controlling it
      setResponseCount(prev => prev + 1);// Trigger VideoStage update
      dispatch(clearReplaySequence());   // Reset Redux state
    }
  }, [replaySequence, dispatch]);

  // --- HANDLERS ---
  const handleNewSession = () => {
    setSessionStarted(true);
    setIsRecording(false);
    setCurrentGlosses([]);
    setIsAiOutput(false);
    setResponseCount(0);
    setActiveSignIndex(-1);
    setCurrentChatId(null);
    setChatTitle("New Sign Session");
    setMessages([{ sender: 'bot', text: 'Hello! Press START to begin signing.' }]);
  };

  const handleLoadSession = async (chatId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/chat/${chatId}`);

      setMessages(res.data.messages);
      setSessionStarted(true);
      setIsRecording(false);
      setCurrentGlosses([]);
      setIsAiOutput(false);
      setCurrentChatId(chatId);
      setChatTitle(res.data.title || "New Sign Session"); // [UPDATED] Load the existing title
      setResponseCount(0);

    } catch (err) {
      console.error("Error loading session:", err);
    }
  };

  const handleDeleteActiveSession = (deletedChatId) => {
    if (currentChatId === deletedChatId) {
      setSessionStarted(false);
      setIsRecording(false);
      setCurrentGlosses([]);
      setIsAiOutput(false);
      setCurrentChatId(null);
      setChatTitle("New Sign Session"); // [UPDATED]
      setResponseCount(0);
      setMessages([{ sender: 'bot', text: 'Hello! Press START to begin signing.' }]);
    }
  };

  const handleGlossDetected = (newGloss, emotion) => {
    // Push emotion into the buffer every time VideoStage fires a frame result
    if (emotion) {
      setEmotionBuffer(prev => [...prev, emotion]);
    }

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
    if (isAiOutput) return;
    const newText = e.target.value;
    setCurrentGlosses(newText ? newText.split(" ") : []);
  };

  const handleStart = () => {
    setIsRecording(true);
    if (isAiOutput) {
      setCurrentGlosses([]);
      setIsAiOutput(false);
    }
  };

  const handlePause = () => setIsRecording(false);

  const handleRetake = () => {
    setIsRecording(false);
    setIsAiOutput(false);
    setCurrentGlosses([]);
    setActiveSignIndex(-1);
  };

  const handleCloseSession = () => {
    // [UPDATED] Axios call removed because Auto-Save handles it!
    setSessionStarted(false);
    setIsRecording(false);
    setIsAiOutput(false);
    setCurrentGlosses([]);
    setCurrentChatId(null);
    setChatTitle("New Sign Session"); // [UPDATED]
    setMessages([{ sender: 'bot', text: 'Hello! Press START to begin signing.' }]);
  };

  const handleEnter = async () => {
    setIsRecording(false);
    if (isAiOutput) return;
    if (currentGlosses.length === 0) return;

    const rawGlossText = currentGlosses.join(" ");

    // ── EMOTION BUFFER: calculate mode then clear for next sentence ──────────
    const finalEmotion = calculateMode(emotionBuffer);
    setEmotionBuffer([]);        // reset buffer — next sentence starts fresh
    setLastSentEmotion(finalEmotion);  // show badge in UI
    console.log(`[EmotionBuffer] Mode emotion sent to Aria: ${finalEmotion}`);

    // Temporarily show the "Translating" message
    setMessages(prev => [...prev, { sender: 'user', text: `[${rawGlossText}] ... Translating` }]);

    try {
      const formData = new FormData();
      formData.append('gloss_text', rawGlossText);

      const transResponse = await axios.post(`${AI_ENGINE_URL}/translate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': '1' }
      });
      const userSentence = transResponse.data.sentence;

      // Attach user's signSequence to the message
      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); // Remove translating state
        newLog.push({ sender: 'user', text: userSentence, signSequence: currentGlosses });
        newLog.push({ sender: 'bot', text: "Thinking..." });
        return newLog;
      });

      const chatFormData = new FormData();
      chatFormData.append('user_text', userSentence);
      // ── Send the emotion mode so Aria can tailor its empathetic response ─────
      chatFormData.append('emotion', finalEmotion);

      const botResponse = await axios.post(`${AI_ENGINE_URL}/chat-response`, chatFormData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': '1' }
      });

      const { natural_response, animation_sequence } = botResponse.data;

      // Attach bot's signSequence to the message
      setMessages(prev => {
        const newLog = [...prev];
        newLog.pop(); // Remove thinking state
        newLog.push({ sender: 'bot', text: natural_response, signSequence: animation_sequence });
        return newLog;
      });

      setCurrentGlosses(animation_sequence);
      setIsAiOutput(true);
      setResponseCount(prev => prev + 1);

    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => {
        const newLog = [...prev];
        if (newLog[newLog.length - 1].text.includes("Thinking") || newLog[newLog.length - 1].text.includes("Translating")) {
          newLog.pop();
        }
        newLog.push({ sender: 'bot', text: "Connection Error" });
        return newLog;
      });
    }
  };

  const handleTextSend = async () => {
    const text = textInput.trim();
    if (!text || isBotThinking) return;
    setTextInput('');
    setIsBotThinking(true);

    // Add User text
    setMessages(prev => [...prev, { sender: 'user', text, signSequence: [] }, { sender: 'bot', text: 'Thinking...' }]);

    try {
      const formData = new FormData();
      formData.append('user_text', text);
      const botResponse = await axios.post(`${AI_ENGINE_URL}/chat-response`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': '1' }
      });
      const { natural_response, animation_sequence } = botResponse.data;

      // Attach bot's signSequence to the message
      setMessages(prev => {
        const log = [...prev];
        log.pop();
        log.push({ sender: 'bot', text: natural_response, signSequence: animation_sequence });
        return log;
      });

      setCurrentGlosses(animation_sequence);
      setIsAiOutput(true);
      setResponseCount(prev => prev + 1);
    } catch (err) {
      console.error('Text send error:', err);
      setMessages(prev => {
        const log = [...prev];
        log.pop();
        log.push({ sender: 'bot', text: 'Connection Error' });
        return log;
      });
    } finally {
      setIsBotThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900">
      <Navbar page="chat" />
      <div className="flex flex-1 overflow-hidden pt-20">

        <Sidebar
          onNewSession={handleNewSession}
          onLoadSession={handleLoadSession}
          onSessionDeleted={handleDeleteActiveSession}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        <div className="flex-1 flex flex-col relative h-full">
          <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-1 -ml-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <h2 className="font-semibold text-sm text-gray-800">
                {sessionStarted ? "Current Session" : "Welcome"}
              </h2>
            </div>
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
                  <VideoStage
                    isRecording={isRecording}
                    onGlossDetected={handleGlossDetected}
                    onEmotionDetected={(emotion) => setEmotionBuffer(prev => [...prev, emotion])}
                    botResponseCount={responseCount}
                    signSequence={currentGlosses}
                    onActiveSignChange={(idx) => setActiveSignIndex(idx)}
                  />

                  {/* EMOTION CHIP — subtle, matches app theme */}
                  <style>{`
                    @keyframes chipFade {
                      from { opacity: 0; transform: translateY(-4px); }
                      to   { opacity: 1; transform: translateY(0); }
                    }
                    .emotion-chip { animation: chipFade 0.25s ease forwards; }
                  `}</style>

                  {lastSentEmotion && (
                    <div key={lastSentEmotion} className="flex justify-center mb-1">
                      <span className="emotion-chip inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-400 font-medium">Detected emotion</span>
                        <span className="text-[10px] font-semibold text-gray-800 font-mono uppercase tracking-wide">
                          {lastSentEmotion}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* ── GLOSS BAR ─────────────────────────────────────────────── */}
                  <div className="mb-2 px-1 md:px-4">
                    {isRecording ? (
                      /* Recording: single live readout */
                      <span className="bg-blue-50 text-blue-700 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-mono font-bold shadow-sm border border-blue-100 flex items-center justify-center w-full min-h-[35px]">
                        {currentGlosses.length > 0 ? currentGlosses.join(' ') : 'Waiting for signs...'}
                      </span>
                    ) : isAiOutput ? (
                      /* AI is responding: word-chip bar with live highlight */
                      <div className="flex flex-wrap justify-center gap-1.5 min-h-[35px] items-center px-1 py-1 rounded-lg bg-gray-50 border border-gray-200">
                        {currentGlosses.length > 0 ? (
                          currentGlosses.map((word, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-mono font-bold transition-all duration-300 ${
                                idx === activeSignIndex
                                  ? 'bg-emerald-500 text-white shadow-md scale-110'
                                  : 'bg-white text-gray-500 border border-gray-200'
                              }`}
                            >
                              {word.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">No gloss sequence</span>
                        )}
                      </div>
                    ) : (
                      /* Idle / user edit mode: editable text field */
                      <div className="relative w-full">
                        <input
                          type="text"
                          value={currentGlosses.join(' ')}
                          onChange={handleManualEdit}
                          placeholder="Type or correct signs here..."
                          className="w-full px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-mono font-bold shadow-sm border bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-center transition-all"
                        />
                        <span className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-sans pointer-events-none">
                          EDIT MODE
                        </span>
                      </div>
                    )}
                  </div>

                  <ControlPanel
                    isRecording={isRecording}
                    onStart={handleStart}
                    onPause={handlePause}
                    onEnter={handleEnter}
                    onRetake={handleRetake}
                    onClose={handleCloseSession}
                  />

                  <ChatLog messages={messages} />

                  {/* --- TEXT INPUT BAR --- */}
                  <div className="flex items-center gap-2 mt-2 px-1 pb-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTextSend()}
                      disabled={isBotThinking}
                      placeholder={isBotThinking ? 'Bot is thinking...' : 'Or type a message directly...'}
                      className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:opacity-50"
                    />
                    <button
                      onClick={handleTextSend}
                      disabled={isBotThinking || !textInput.trim()}
                      className="px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-20">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 mb-6">
                    <Bot size={32} className="text-gray-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">QuietCare AI</h1>
                  <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                    Please click <span className="font-bold text-gray-700 mx-1">"New Session"</span> or select a history item.
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