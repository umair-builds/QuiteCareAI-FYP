import React from 'react';
import { Play, Pause, Send, RotateCcw, XCircle } from 'lucide-react';

const ControlPanel = ({ onStart, onPause, onEnter, onRetake, onClose }) => {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 bg-white rounded-lg shadow-sm border border-gray-100 w-full max-w-3xl mx-auto p-1">
      
      <button onClick={onStart} className="flex flex-col items-center gap-1 text-green-600 hover:bg-green-50 px-3 py-1 rounded-md transition-all active:scale-95">
        <Play size={18} />
        <span className="text-[9px] font-bold uppercase tracking-wide">Start</span>
      </button>

      <button onClick={onPause} className="flex flex-col items-center gap-1 text-amber-600 hover:bg-amber-50 px-3 py-1 rounded-md transition-all active:scale-95">
        <Pause size={18} />
        <span className="text-[9px] font-bold uppercase tracking-wide">Pause</span>
      </button>

      <div className="h-6 w-[1px] bg-gray-200"></div>

      <button onClick={onEnter} className="flex flex-col items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition-all active:scale-95">
        <Send size={18} />
        <span className="text-[9px] font-bold uppercase tracking-wide">Enter</span>
      </button>

      <button onClick={onRetake} className="flex flex-col items-center gap-1 text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-md transition-all active:scale-95">
        <RotateCcw size={18} />
        <span className="text-[9px] font-bold uppercase tracking-wide">Retake</span>
      </button>

      <div className="h-6 w-[1px] bg-gray-200"></div>

      <button onClick={onClose} className="flex flex-col items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-1 rounded-md transition-all active:scale-95">
        <XCircle size={18} />
        <span className="text-[9px] font-bold uppercase tracking-wide">Close</span>
      </button>

    </div>
  );
};

export default ControlPanel;