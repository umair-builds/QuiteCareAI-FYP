import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const Navbar = ({ page }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Ref to detect clicks outside the menu
  const menuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- 1. CLICK OUTSIDE LOGIC ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    dispatch(logout());
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 w-full bg-white z-50 px-6 py-4 flex justify-between items-center border-b border-gray-100 transition-all duration-300">
      
      {/* --- LEFT: LOGO --- */}
      {/* On Chat page, logo is static (cursor-default) so users don't accidentally leave */}
      {page === 'chat' ? (
        <div className="flex items-center gap-2 cursor-default select-none">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Q</span>
          </div>
          <span className="text-gray-900 text-xl font-bold tracking-tight">QuietCare AI</span>
        </div>
      ) : (
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-transform hover:scale-105">
            <span className="text-white text-sm font-semibold">Q</span>
          </div>
          <span className="text-gray-900 text-xl font-bold tracking-tight">QuietCare AI</span>
        </Link>
      )}


      {/* --- RIGHT: ACTIONS --- */}
      <div className="flex gap-4 text-sm font-medium">
        
        {/* HOME PAGE */}
        {page === 'home' && (
          <>
            <Link to="/signin" className="px-5 py-2.5 rounded-full text-gray-600 hover:text-black hover:bg-gray-50 transition">
              Log in
            </Link>
            <Link to="/signup" className="px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition shadow-sm hover:shadow-md">
              Sign up
            </Link>
          </>
        )}

        {/* SIGN UP PAGE */}
        {page === 'signup' && (
           <div className="flex items-center gap-3">
             <span className="text-gray-400 hidden sm:inline font-normal">Already have an account?</span>
             <Link to="/signin" className="px-5 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-full hover:bg-gray-100 transition">
               Log in
             </Link>
           </div>
        )}

        {/* SIGN IN PAGE */}
        {page === 'signin' && (
           <div className="flex items-center gap-3">
             <span className="text-gray-400 hidden sm:inline font-normal">Don't have an account?</span>
             <Link to="/signup" className="px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition shadow-sm hover:shadow-md">
               Sign up
             </Link>
           </div>
        )}

        {/* --- CHAT PAGE: PROFILE DROPDOWN --- */}
        {page === 'chat' && user && (
           <div className="relative" ref={menuRef}>
             
             {/* Trigger Button: Clean Pill Shape */}
             <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-3 pl-4 pr-1 py-1 rounded-full border transition-all duration-200 ${isDropdownOpen ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
             >
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                    {user.username}
                </span>
                
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                </div>
             </button>

             {/* --- DROPDOWN MENU --- */}
             {/* Uses CSS transition for smooth slide/fade effect */}
             <div 
                className={`absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 transform transition-all duration-200 ease-out origin-top-right z-50 overflow-hidden
                ${isDropdownOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}
             >
                 {/* Menu Header */}
                 <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                     <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                     <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                 </div>

                 {/* Menu Items */}
                 <div className="py-2">
                     <button
                       onClick={handleLogout}
                       className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 group"
                     >
                       {/* Simple Icon */}
                       <svg className="w-4 h-4 text-red-500 group-hover:text-red-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                       </svg>
                       Sign out
                     </button>
                 </div>
             </div>
           </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;