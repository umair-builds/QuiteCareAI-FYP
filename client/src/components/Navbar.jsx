// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ page }) => {
  return (
    <nav className="fixed top-0 w-full bg-white z-50 px-6 py-4 flex justify-between items-center">
      {/* Logo - Always redirects to Home */}
      <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">Q</span>
        </div>
        <span className="text-gray-900">QuietCare AI</span>
      </Link>

      {/* Navigation Links - Dynamic based on 'page' prop */}
      <div className="flex gap-4 text-sm font-medium">
        {page === 'home' && (
          <>
            <Link to="/signin" className="px-4 py-2 hover:bg-gray-100 rounded-md transition text-gray-600 hover:text-black">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition">
              Sign up
            </Link>
          </>
        )}

        {/* If we are on Sign Up page, only show Sign In button */}
        {page === 'signup' && (
           <div className="flex items-center gap-2">
             <span className="text-gray-500 hidden sm:inline">Already have an account?</span>
             <Link to="/signin" className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition">
               Log in
             </Link>
           </div>
        )}

        {/* If we are on Sign In page, only show Sign Up button */}
        {page === 'signin' && (
           <div className="flex items-center gap-2">
             <span className="text-gray-500 hidden sm:inline">Don't have an account?</span>
             <Link to="/signup" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition">
               Sign up
             </Link>
           </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;