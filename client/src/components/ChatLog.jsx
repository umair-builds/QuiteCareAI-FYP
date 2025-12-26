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
          // LOGIC FLIPPED: User = Left (Start), Bot = Right (End)
          const isUser = msg.sender === 'user';
          
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
               <div className={`max-w-[80%] px-4 py-2 text-sm shadow-sm ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tl-none' // User: Blue, Left Tail
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-none' // Bot: Gray, Right Tail
                }`}>
                {msg.text}
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