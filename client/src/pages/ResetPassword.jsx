import React from 'react';
import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const ResetPassword = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({ mode: "all" });

  const navigate = useNavigate();
  const location = useLocation();
  
  // Grab the email passed from the previous page (if available)
  const emailFromState = location.state?.email || "";

  const onSubmit = async (data) => {
    const loadingToast = toast.loading("Updating password...");

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send email (from state or input), otp, and newPassword
        body: JSON.stringify({ 
            email: emailFromState || data.email, 
            otp: data.otp, 
            newPassword: data.newPassword 
        }),
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success("✅ Password updated! Please log in.");
        navigate('/signin');
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error:", error);
      toast.error("Server connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar page="signup" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-[400px] flex flex-col items-center">
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Check your email</h1>
            <p className="text-gray-500 mb-8 text-center">
              We sent a 6-digit verification code to <span className="font-semibold text-gray-900">{emailFromState || "your email"}</span>.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3" noValidate>
                
                {/* Fallback Email Input (Only shows if user refreshed page and lost state) */}
                {!emailFromState && (
                    <div className="relative">
                        <input 
                            type="email" 
                            placeholder="Confirm your email"
                            {...register("email", { required: "Email is required" })}
                            className="w-full p-4 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                        />
                    </div>
                )}

                {/* OTP Input */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Enter 6-digit code"
                        maxLength="6"
                        {...register("otp", { 
                            required: "OTP is required",
                            pattern: { value: /^[0-9]{6}$/, message: "Must be 6 digits" }
                        })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition tracking-widest ${
                            errors.otp ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.otp && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.otp.message}</p>}
                </div>

                {/* New Password Input */}
                <div className="relative">
                    <input 
                        type="password" 
                        placeholder="New Password"
                        {...register("newPassword", { 
                            required: "New Password is required",
                            minLength: { value: 6, message: "Must be at least 6 characters" }
                        })}
                        className={`w-full p-4 border rounded-lg text-gray-900 focus:outline-none transition ${
                            errors.newPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-600'
                        }`}
                    />
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1 w-full text-left">{errors.newPassword.message}</p>}
                </div>

                {/* Primary Button */}
                <button 
                    type="submit" 
                    className="w-full bg-black text-white font-medium p-4 rounded-lg hover:bg-gray-800 transition mt-2 text-lg"
                >
                    Set New Password
                </button>
            </form>

            {/* Back link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Didn't receive the email? <Link to="/forgot-password" className="text-green-600 hover:underline">Click to resend</Link></p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;