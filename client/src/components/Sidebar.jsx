import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, MoreHorizontal, Edit2, Pin } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE from '../services/api';

const Sidebar = ({ onNewSession, onLoadSession, onSessionDeleted }) => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);
  
  // Track which chat has its dropdown menu open
  const [openMenuId, setOpenMenuId] = useState(null);

  // Fetch History Logic
  const fetchHistory = async () => {
    if (user) {
      try {
        const res = await axios.get(`${API_BASE}/api/chat/history/${user.id || user._id}`);
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

  // Handle Delete (Now happens instantly from the dropdown)
  const handleDelete = async (chatId) => {
    setOpenMenuId(null); // Close the menu
    try {
      await axios.delete(`${API_BASE}/api/chat/${chatId}`);
      toast.success("Session deleted", { duration: 2000 });
      fetchHistory(); 
      if (onSessionDeleted) {
          onSessionDeleted(chatId);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Could not delete session");
    }
  };

  return (
    <div className="w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col hidden md:flex overflow-hidden">
      
      {/* --- INVISIBLE STYLE BLOCK TO HIDE SWIPE SCROLLBARS --- */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* NEW SESSION BUTTON */}
      <div className="p-3 flex-shrink-0">
        <button 
          onClick={onNewSession} 
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all text-gray-700 shadow-sm group"
        >
          <div className="bg-gray-50 p-1 rounded-md border border-gray-200 group-hover:bg-white transition-colors">
            <Plus size={16} className="text-gray-900" />
          </div>
          <span className="font-semibold text-sm">New Session</span>
        </button>
      </div>

      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="text-[10px] font-bold text-gray-400 px-2 py-2 uppercase tracking-wider mb-1">
          Recent Sessions
        </div>
        
        {history.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 italic">No sessions yet.</p>
        ) : (
            history.map((chat) => (
              <div 
                key={chat._id} 
                // Tighter padding (py-2, px-2) and reduced gap
                className="group relative w-full flex items-center gap-2 px-2 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs transition-colors cursor-pointer"
                onClick={() => onLoadSession(chat._id)}
              >
                <MessageSquare size={14} className="text-gray-400 shrink-0" />
                
                {/* SWIPEABLE TEXT: Replaced truncate with overflow-x-auto */}
                <div className="flex-1 overflow-x-auto whitespace-nowrap hide-scroll text-left">
                  {chat.title}
                </div>
                
                {/* 3-DOT MENU BUTTON */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === chat._id ? null : chat._id);
                  }}
                  className={`p-1 rounded-md hover:bg-gray-300 transition-all shrink-0 ${openMenuId === chat._id ? 'opacity-100 bg-gray-300' : 'opacity-0 group-hover:opacity-100 text-gray-500'}`}
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* THE CHATGPT-STYLE DROPDOWN MENU */}
                {openMenuId === chat._id && (
                  <>
                    {/* Invisible full-screen backdrop to close menu when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                    />
                    
                    {/* The Menu Window */}
                    <div className="absolute right-2 top-8 w-36 bg-white border border-gray-200 shadow-xl rounded-lg z-50 py-1 overflow-hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toast("Pin feature coming soon!"); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <Pin size={12} /> Pin
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toast("Rename feature coming soon!"); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <Edit2 size={12} /> Rename
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(chat._id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;