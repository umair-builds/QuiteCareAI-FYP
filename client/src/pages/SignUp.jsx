import React from 'react';
import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import Toast logic

// --- 1. NEW LOGIC IMPORTS ---
import { useDispatch } from 'react-redux';
import { login } from '../features/auth/authSlice';

const SignUp = () => {
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm({
    mode: "all" // Validates as you type
  });

  const navigate = useNavigate();
  const dispatch = useDispatch(); // --- 2. SETUP DISPATCH ---

  // --- SUBMIT FUNCTION (Connects to Backend) ---
  const onSubmit = async (data) => {
    // 1. Show a loading toast
    const loadingToast = toast.loading("Creating your account...");

    try {
        // 2. Send data to Backend
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password
            }),
        });

        const result = await response.json();

        // 3. Remove the loading toast
        toast.dismiss(loadingToast);

        if (response.ok) {
            // --- 3. AUTO-LOGIN LOGIC (The only change) ---
            // This fixes the empty Navbar issue
            localStorage.setItem('user', JSON.stringify(result)); 
            dispatch(login(result)); 

            // SUCCESS: Show green toast & Redirect
            toast.success("✅ Account created! Welcome to QuietCare AI.");
            
            // Wait 2 seconds so user can read the message, then go to Chat
            setTimeout(() => {
                navigate('/chat');
            }, 2000);
            
        } else {
            // ERROR: Show red toast with message from Backend (e.g. "User exists")
            toast.error(result.message || "Something went wrong.");
        }
    } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Connection Error:", error);
        toast.error("❌ Server connection failed. Is Backend running?");
    }
  };
  // ---------------------------------------------

  const password = watch("password");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar: Hides 'Sign Up' button, shows 'Log In' */}
      <Navbar page="signup" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-[400px] flex flex-col items-center">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create your account</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3" noValidate>
                
                {/* Username Input */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Username"
                        {...register("username", { required: "Username is required" })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition ${
                            errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.username.message}</p>}
                </div>

                {/* Email Input */}
                <div className="relative">
                    <input 
                        type="email" 
                        placeholder="Email address"
                        {...register("email", { 
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                            }
                        })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition ${
                            errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.email.message}</p>}
                </div>

                {/* Password Input */}
                <div className="relative">
                    <input 
                        type="password" 
                        placeholder="Password"
                        {...register("password", { 
                            required: "Password is required",
                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                        })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition ${
                            errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.password.message}</p>}
                </div>

                 {/* Confirm Password Input */}
                 <div className="relative">
                    <input 
                        type="password" 
                        placeholder="Confirm Password"
                        {...register("confirmPassword", { 
                            required: "Please confirm your password",
                            validate: (value) => value === password || "Passwords do not match"
                        })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition ${
                            errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.confirmPassword.message}</p>}
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="w-full bg-black text-white font-medium p-4 rounded-lg hover:bg-gray-800 transition mt-2 text-lg"
                >
                    Sign Up
                </button>
            </form>

            {/* Divider */}
            <div className="w-full flex items-center gap-4 my-6">
                <div className="h-px bg-gray-300 flex-1"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            {/* Social Buttons */}
            <div className="w-full flex flex-col gap-3">
                {/* Google Button */}
                <button className="w-full border border-gray-300 rounded-lg p-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-gray-700 font-medium">Continue with Google</span>
                </button>

                {/* GitHub Button */}
                <button className="w-full border border-gray-300 rounded-lg p-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Continue with GitHub</span>
                </button>
            </div>
            
            <p className="mt-8 text-xs text-gray-500 text-center">
                Localhost Only: Social buttons are for UI demonstration.
            </p>

        </div>
      </div>
    </div>
  );
};

export default SignUp;