import React, { useEffect, useRef } from 'react';

const ChatLog = ({ messages }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto shadow-sm min-h-[250px] flex flex-col">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Conversation Log</h3>
      
      <div className="space-y-4 flex-1">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          
          // [UX] Check if this is a "Loading State"
          const isThinking = msg.text === "Thinking...";
          const isTranslating = msg.text.includes("... Translating");
          const isLoading = isThinking || isTranslating;

          return (
            <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
               <div className={`max-w-[80%] px-4 py-2 text-sm shadow-sm transition-all duration-300 ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tl-none' // User
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-none' // Bot
                  } ${
                    // [UX] Apply the "Sunlight/Pulse" Animation if loading
                    isLoading ? 'animate-pulse opacity-80' : ''
                  }`}
               >
                  {/* Content Logic */}
                  {isThinking ? (
                    // Custom "Thinking" UI (Three Dots)
                    <div className="flex items-center gap-1 h-5">
                      <span className="text-xs font-medium">Thinking</span>
                      <span className="flex gap-1 mt-1 ml-1">
                        <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                      </span>
                    </div>
                  ) : (
                    // Standard Text
                    <span>{msg.text}</span>
                  )}
               </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatLog;