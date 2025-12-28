import React from 'react';
import { Play, Pause, Send, RotateCcw, XCircle } from 'lucide-react';

// [CHECK] Ensure 'isRecording' is in this list
const ControlPanel = ({ isRecording, onStart, onPause, onEnter, onRetake, onClose }) => {
  
  const baseBtnClass = "flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all active:scale-95 border";

  // Active = Dark Gray | Inactive = Transparent
  const activeBtnClass = `${baseBtnClass} bg-gray-200 text-gray-900 border-gray-300 shadow-inner`;
  const inactiveBtnClass = `${baseBtnClass} bg-transparent text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700`;

  return (
    <div className="flex items-center justify-center gap-4 mb-2 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
      
      {/* GROUP 1 */}
      <div className="flex gap-2">
        {/* START BUTTON: Selected if isRecording is TRUE */}
        <button 
          onClick={onStart} 
          className={isRecording ? activeBtnClass : inactiveBtnClass} 
          title="Start Recording"
        >
          <Play size={20} className={isRecording ? "fill-current" : ""} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Start</span>
        </button>

        {/* PAUSE BUTTON: Selected if isRecording is FALSE */}
        <button 
          onClick={onPause} 
          className={!isRecording ? activeBtnClass : inactiveBtnClass} 
          title="Pause Recording"
        >
          <Pause size={20} className={!isRecording ? "fill-current" : ""} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Pause</span>
        </button>
      </div>

      <div className="h-8 w-[1px] bg-gray-200"></div>

      {/* GROUP 2 */}
      <button 
        onClick={onEnter} 
        className="flex flex-col items-center gap-1 bg-[#10a37f] text-white hover:bg-[#0d8a6c] px-10 py-2 rounded-lg transition-all active:scale-95 shadow-md mx-2"
        title="Translate Signs"
      >
        <Send size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wide">Enter</span>
      </button>

      <div className="h-8 w-[1px] bg-gray-200"></div>

      {/* GROUP 3 */}
      <div className="flex gap-2">
        <button onClick={onRetake} className={inactiveBtnClass} title="Clear & Retake">
          <RotateCcw size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Retake</span>
        </button>

        <button onClick={onClose} className={inactiveBtnClass} title="Close Session">
          <XCircle size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Close</span>
        </button>
      </div>

    </div>
  );
};

export default ControlPanel;