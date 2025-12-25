import React from 'react';
import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({ mode: "all" });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const loadingToast = toast.loading("Sending OTP...");
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("✅ OTP sent! Check your email.");
        // Navigate to the next page and carry the email over so user doesn't re-type it
        navigate('/reset-password', { state: { email: data.email } });
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error:", error);
      toast.error("Server connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar showing "Sign In" button just in case */}
      <Navbar page="signup" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-[400px] flex flex-col items-center">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Reset password</h1>
            <p className="text-gray-500 mb-8 text-center">
              Enter the email address associated with your account and we'll send you a code.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3" noValidate>
                
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

                {/* Primary Button */}
                <button 
                    type="submit" 
                    className="w-full bg-black text-white font-medium p-4 rounded-lg hover:bg-gray-800 transition mt-2 text-lg"
                >
                    Send Code
                </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6">
                <Link to="/signin" className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back to Log in
                </Link>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;