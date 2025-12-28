import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';

// [CHANGE] Accept 'onLoadSession' as a prop
const Sidebar = ({ onNewSession, onLoadSession }) => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        try {
          const res = await axios.get(`http://localhost:5000/api/chat/history/${user.id || user._id}`);
          setHistory(res.data);
        } catch (err) {
          console.error("Error loading history:", err);
        }
      }
    };
    
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); 
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col hidden md:flex">
      
      <div className="p-4 flex-shrink-0">
        <button 
          onClick={onNewSession} 
          className="w-full flex items-center gap-3 px-3 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all text-gray-700 shadow-sm group"
        >
          <div className="bg-gray-50 p-1 rounded-md border border-gray-200 group-hover:bg-white transition-colors">
            <Plus size={16} className="text-gray-900" />
          </div>
          <span className="font-semibold text-sm">New Session</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="text-[11px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider mb-1">
          Recent Sessions
        </div>
        
        {history.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 italic">No sessions yet.</p>
        ) : (
            history.map((chat) => (
              <button 
                key={chat._id} 
                // [CHANGE] Call the load function with the specific Chat ID
                onClick={() => onLoadSession(chat._id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors text-left focus:outline-none focus:bg-gray-200"
              >
                <MessageSquare size={16} className="text-gray-400" />
                <span className="truncate">{chat.title}</span>
              </button>
            ))
        )}
      </div>

    </div>
  );
};

export default Sidebar;