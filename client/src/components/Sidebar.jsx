import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, MoreHorizontal,
  Edit2, Pin, PinOff, X, Check
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE from '../services/api';

/* ─────────────────────────────────────────────
   Rename Modal Component
───────────────────────────────────────────── */
const RenameModal = ({ session, onClose, onRename }) => {
  const [value, setValue] = useState(session?.title || '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus & select all text on open
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 60);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed === session.title) { onClose(); return; }
    setLoading(true);
    await onRename(session._id, trimmed);
    setLoading(false);
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Edit2 size={14} className="text-black" />
              </div>
              <h2 className="text-gray-900 font-semibold text-sm">Rename Session</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              Session Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 border border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
              placeholder="Enter a new name..."
            />
            <p className="text-right text-[10px] text-gray-400 mt-1">{value.length}/80</p>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !value.trim()}
                className="flex-1 py-2 px-4 rounded-lg text-sm text-white bg-black hover:bg-gray-800 font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check size={13} /> Save</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Keyframe for modal pop-in */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Session Row Component
───────────────────────────────────────────── */
const SessionRow = ({ chat, openMenuId, setOpenMenuId, onLoadSession, onPin, onRename, onDelete, pinLimitReached }) => {
  const isMenuOpen = openMenuId === chat._id;

  return (
    <div
      className="group relative w-full flex items-center gap-2 px-2 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs transition-colors cursor-pointer"
      onClick={() => onLoadSession(chat._id)}
    >
      <MessageSquare size={14} className="text-gray-400 shrink-0" />

      {/* Swipeable title */}
      <div className="flex-1 overflow-x-auto whitespace-nowrap hide-scroll text-left">
        {chat.title}
      </div>

      {/* PIN badge */}
      {chat.isPinned && (
        <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-black text-white rounded-md uppercase tracking-wider">
          PIN
        </span>
      )}

      {/* 3-dot menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(isMenuOpen ? null : chat._id);
        }}
        className={`p-1 rounded-md hover:bg-gray-300 transition-all shrink-0 ${
          isMenuOpen ? 'opacity-100 bg-gray-300' : 'opacity-0 group-hover:opacity-100 text-gray-500'
        }`}
      >
        <MoreHorizontal size={14} />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
          />
          <div className="absolute right-2 top-8 w-40 bg-white border border-gray-200 shadow-xl rounded-lg z-50 py-1 overflow-hidden">
            {/* Pin / Unpin */}
            <button
              onClick={(e) => { e.stopPropagation(); onPin(chat); }}
              disabled={!chat.isPinned && pinLimitReached}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                !chat.isPinned && pinLimitReached
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {chat.isPinned ? (
                <><PinOff size={12} className="text-gray-500" /> Unpin</>
              ) : (
                <><Pin size={12} className={pinLimitReached ? 'text-gray-300' : 'text-gray-500'} /> Pin to Top</>
              )}
            </button>
            {/* Rename */}
            <button
              onClick={(e) => { e.stopPropagation(); onRename(chat); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors text-xs"
            >
              <Edit2 size={12} className="text-gray-500" /> Rename
            </button>
            <div className="h-px bg-gray-100 my-1" />
            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(chat._id); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-500 transition-colors text-xs"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Sidebar Component
───────────────────────────────────────────── */
const Sidebar = ({ onNewSession, onLoadSession, onSessionDeleted, isMobileOpen, setIsMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);

  // Swipe logic for mobile
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX.current - e.changedTouches[0].clientX > 50) {
      setIsMobileOpen(false); // Swipe left closes sidebar
    }
  };

  /* ── Fetch History ── */
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

  /* ── Derived lists ── */
  const pinned   = history.filter((c) => c.isPinned);
  const unpinned = history.filter((c) => !c.isPinned);

  /* ── Handlers ── */
  const handleDelete = async (chatId) => {
    setOpenMenuId(null);
    try {
      await axios.delete(`${API_BASE}/api/chat/${chatId}`);
      toast.success("Session deleted", { duration: 2000 });
      setHistory((prev) => prev.filter((c) => c._id !== chatId));
      if (onSessionDeleted) onSessionDeleted(chatId);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Could not delete session");
    }
  };

  const handlePin = async (chat) => {
    setOpenMenuId(null);

    const wasPinned = chat.isPinned;
    const newPinnedAt = wasPinned ? null : new Date().toISOString();

    // Optimistic UI: update + re-sort so newly pinned floats to top
    setHistory((prev) => {
      const updated = prev.map((c) =>
        c._id === chat._id
          ? { ...c, isPinned: !wasPinned, pinnedAt: newPinnedAt }
          : c
      );
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isPinned && b.isPinned) return new Date(b.pinnedAt) - new Date(a.pinnedAt);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });

    try {
      await axios.patch(`${API_BASE}/api/chat/${chat._id}/pin`);
      toast.success(wasPinned ? "Session unpinned" : "Session pinned 📌", { duration: 2000 });
      fetchHistory();
    } catch (err) {
      // Revert on API error
      setHistory((prev) =>
        prev.map((c) =>
          c._id === chat._id ? { ...c, isPinned: wasPinned, pinnedAt: chat.pinnedAt } : c
        )
      );
      const msg = err?.response?.data?.message || "Could not pin session";
      toast.error(msg, { duration: 3000 });
    }
  };

  const handleRename = async (chatId, newTitle) => {
    try {
      await axios.patch(`${API_BASE}/api/chat/${chatId}/rename`, { title: newTitle });
      setHistory((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, title: newTitle } : c))
      );
      toast.success("Session renamed ✏️", { duration: 2000 });
    } catch (err) {
      toast.error("Could not rename session");
    }
  };

  const sharedRowProps = {
    openMenuId,
    setOpenMenuId,
    onLoadSession: (id) => {
      onLoadSession(id);
      if (window.innerWidth < 768 && setIsMobileOpen) setIsMobileOpen(false);
    },
    onPin: handlePin,
    onRename: (chat) => setRenameTarget(chat),
    onDelete: handleDelete,
    pinLimitReached: pinned.length >= 3,
  };

  /* ─────────── RENDER ─────────── */
  return (
    <>
      {/* ── MOBILE BACKDROP ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR CONTAINER ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 h-full border-r border-gray-200 flex flex-col overflow-hidden transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        {/* Hide scrollbar utility */}
        <style>{`
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* NEW SESSION BUTTON */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768 && setIsMobileOpen) setIsMobileOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all text-gray-700 shadow-sm group"
          >
            <div className="bg-gray-50 p-1 rounded-md border border-gray-200 group-hover:bg-white transition-colors">
              <Plus size={16} className="text-gray-900" />
            </div>
            <span className="font-semibold text-sm">New Session</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 hide-scroll">

          {/* ── PINNED SECTION ── */}
          {pinned.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-2 py-2 mb-1">
                <Pin size={10} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Pinned
                </span>
              </div>
              {pinned.map((chat) => (
                <SessionRow key={chat._id} chat={chat} {...sharedRowProps} />
              ))}
              {/* Divider */}
              <div className="flex items-center gap-2 px-2 my-2">
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* ── RECENT SECTION ── */}
          <div className="text-[10px] font-bold text-gray-400 px-2 py-2 uppercase tracking-wider mb-1">
            Recent Sessions
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 italic">No sessions yet.</p>
          ) : unpinned.length === 0 && pinned.length > 0 ? (
            <p className="text-xs text-gray-400 px-2 italic">All sessions are pinned.</p>
          ) : (
            unpinned.map((chat) => (
              <SessionRow key={chat._id} chat={chat} {...sharedRowProps} />
            ))
          )}
        </div>
      </div>

      {/* ── RENAME MODAL ── */}
      {renameTarget && (
        <RenameModal
          session={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRename={handleRename}
        />
      )}
    </>
  );
};

export default Sidebar;