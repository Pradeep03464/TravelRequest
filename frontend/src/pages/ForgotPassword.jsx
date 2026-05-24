import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, Key, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setIsResending(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setResendTimer(60); 
            toast.success('OTP resent to your email!', {
                icon: '📧',
                style: { borderRadius: '20px', background: '#fff', color: '#000' }
            });
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error('Failed to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setIsSubmitted(true);
            setResendTimer(60); 
            toast.success('OTP sent to your email!', {
                icon: '📧',
                style: { borderRadius: '20px', background: '#fff', color: '#000' }
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
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
                                <Mail className="h-8 w-8 text-green-600" />
                            </motion.div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4">Check Your Email</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                We've sent a password reset OTP to <strong>{email}</strong>.
                            </p>
                            <div className="space-y-4">
                                <Link
                                    to="/reset-password"
                                    state={{ email }}
                                    className="btn-mmt-primary w-full py-4 text-lg"
                                >
                                    Enter OTP
                                </Link>
                                <div className="text-center">
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || isResending}
                                        className="text-slate-500 hover:text-slate-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                    >
                                        {isResending ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin"></div>
                                                Resending...
                                            </>
                                        ) : resendTimer > 0 ? (
                                            <>
                                                <RotateCcw className="h-4 w-4" />
                                                Resend OTP in {resendTimer}s
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw className="h-4 w-4" />
                                                Didn't receive OTP? Resend
                                            </>
                                        )}
                                    </button>
                                </div>
                                <Link
                                    to="/login"
                                    className="text-slate-500 hover:text-slate-700 font-bold block text-center"
                                >
                                    ← Back to Login
                                </Link>
                            </div>
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
                            <Key className="w-12 h-12 text-white" />
                        </motion.div>
                        <h1 className="text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                            Reset Your <br /><span className="text-white/70">Password</span>
                        </h1>
                        <p className="text-xl text-indigo-50 font-medium max-w-sm leading-relaxed opacity-90 border-l-4 border-indigo-400 pl-6">
                            Secure password recovery with OTP verification. Your account safety is our priority.
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
                            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Forgot Password</h2>
                            <p className="text-slate-500 font-bold text-lg">We'll send you a reset OTP</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-mmt-primary py-5 text-xl mt-6 tracking-tighter"
                            >
                                {isLoading ? (
                                    <div className="h-7 w-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Send Reset OTP</span>
                                        <Mail className="h-6 w-6" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <Link
                                to="/login"
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;