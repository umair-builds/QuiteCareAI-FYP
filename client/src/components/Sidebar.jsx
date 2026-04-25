import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';

// [UPDATED] Added 'onSessionDeleted' prop
const Sidebar = ({ onNewSession, onLoadSession, onSessionDeleted }) => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);

  // Fetch History Logic
  const fetchHistory = async () => {
    if (user) {
      try {
        const res = await axios.get(`http://localhost:5005/api/chat/history/${user.id || user._id}`);
        setHistory(res.data);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); 
    return () => clearInterval(interval);
  }, [user]);

  // Handle Delete
  const handleDelete = (e, chatId) => {
    e.stopPropagation(); 
    
    toast.dismiss();

    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <span className="text-sm font-semibold text-gray-800">
          Delete this session?
        </span>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id); 
              try {
                await axios.delete(`http://localhost:5005/api/chat/${chatId}`);
                toast.success("Session deleted");
                
                // 1. Refresh list
                fetchHistory(); 
                
                // 2. [NEW] Notify parent to close window if it's open
                if (onSessionDeleted) {
                    onSessionDeleted(chatId);
                }

              } catch (err) {
                console.error("Delete failed:", err);
                toast.error("Could not delete");
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000, 
      position: 'top-left',
      style: {
        background: '#fff',
        color: '#333',
        padding: '12px 16px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
      },
    });
  };

  return (
    <div className="w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col hidden md:flex">
      
      {/* NEW SESSION BUTTON */}
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

      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="text-[11px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider mb-1">
          Recent Sessions
        </div>
        
        {history.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 italic">No sessions yet.</p>
        ) : (
            history.map((chat) => (
              <div 
                key={chat._id} 
                className="group relative w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
                onClick={() => onLoadSession(chat._id)}
              >
                <MessageSquare size={16} className="text-gray-400" />
                <span className="truncate flex-1">{chat.title}</span>
                
                {/* DELETE BUTTON */}
                <button 
                  onClick={(e) => handleDelete(e, chat._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded-md text-gray-400 hover:text-red-500 transition-all"
                  title="Delete Session"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
        )}
      </div>

    </div>
  );
};

export default Sidebar;