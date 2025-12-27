import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';

// [CHANGE 1] Accept 'onNewSession' prop from parent
const Sidebar = ({ onNewSession }) => {
  return (
    <div className="w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col hidden md:flex">
      
      {/* --- FIXED TOP SECTION: NEW SESSION BUTTON --- */}
      <div className="p-4 flex-shrink-0">
        <button 
          onClick={onNewSession} // [CHANGE 2] Connect the click to the function
          className="w-full flex items-center gap-3 px-3 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all text-gray-700 shadow-sm group"
        >
          {/* Icon Box */}
          <div className="bg-gray-50 p-1 rounded-md border border-gray-200 group-hover:bg-white transition-colors">
            <Plus size={16} className="text-gray-900" />
          </div>
          <span className="font-semibold text-sm">New Session</span>
        </button>
      </div>

      {/* --- SCROLLABLE SECTION: HISTORY --- */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="text-[11px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider mb-1">
          Today
        </div>
        
        {['Sign Translation 01', 'Learning Alphabets', 'Emergency Signs'].map((item, index) => (
          <button 
            key={index} 
            className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors text-left"
          >
            <MessageSquare size={16} className="text-gray-400" />
            <span className="truncate">{item}</span>
          </button>
        ))}
      </div>

      {/* --- FOOTER: USER PROFILE --- */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            QC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">QuietCare User</p>
            <p className="text-xs text-gray-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;