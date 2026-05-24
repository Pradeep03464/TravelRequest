import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const ResetPassword = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Email not found. Please go back and try again.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword
            });

            setIsSuccess(true);
            toast.success('Password reset successfully!', {
                icon: '✅',
                style: { borderRadius: '20px', background: '#fff', color: '#000' }
            });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Reset password error:', error);
            const message = error?.response?.data?.message || 'Failed to reset password';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex bg-slate-50">
                <div className="flex w-full max-w-[1400px] mx-auto m-6 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md mx-auto flex items-center justify-center p-8"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-6"
                            >
                                <ShieldCheck className="h-8 w-8 text-green-600" />
                            </motion.div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4">Password Reset!</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Your password has been successfully reset. You can now log in with your new password.
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                Redirecting to login page...
                            </p>
                            <Link
                                to="/login"
                                className="btn-mmt-primary w-full py-4 text-lg"
                            >
                                Go to Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex bg-slate-50">
            <div className="flex w-full max-w-[1400px] mx-auto m-6 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                {/* Visual Side */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex lg:w-1/2 hero-bg flex-col justify-center px-16 text-white relative"
                >
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/20 backdrop-blur-xl p-5 rounded-[2rem] w-fit mb-8 border border-white/30"
                        >
                            <Lock className="w-12 h-12 text-white" />
                        </motion.div>
                        <h1 className="text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                            New <br /><span className="text-white/70">Password</span>
                        </h1>
                        <p className="text-xl text-indigo-50 font-medium max-w-sm leading-relaxed opacity-90 border-l-4 border-indigo-400 pl-6">
                            Enter your OTP and create a strong new password to secure your account.
                        </p>
                    </div>
                </motion.div>

                {/* Form Side */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-md"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Reset Password</h2>
                            <p className="text-slate-500 font-bold text-lg">Enter OTP and new password</p>
                            {email && (
                                <p className="text-sm text-slate-400 mt-2">Resetting password for: <strong>{email}</strong></p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">OTP Code</label>
                                <div className="relative group">
                                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        className="mmt-input pl-16 py-4 text-center font-mono text-lg tracking-widest"
                                        maxLength="6"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-400 ml-1">Enter the 6-digit code sent to your email</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-mmt-primary py-5 text-xl mt-4 tracking-tighter"
                            >
                                {isLoading ? (
                                    <div className="h-7 w-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <Key className="h-6 w-6" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <Link
                                to="/forgot-password"
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Forgot Password
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;