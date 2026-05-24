import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Plane, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userData = await login(credentials.email, credentials.password);
            toast.success('Welcome back to TravelRequest!', {
                icon: '👋',
                style: { borderRadius: '15px', background: '#fff', color: '#000' }
            });
            // Navigate directly using role from API response — avoids React state update race condition
            const role = userData?.role;
            if (role === 'ROLE_ADMIN') navigate('/admin');
            else if (role === 'ROLE_MANAGER') navigate('/manager');
            else navigate('/employee');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.toString());
        } finally {
            setIsLoading(false);
        }
    };

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
                            <Plane className="w-12 h-12 text-white transform -rotate-12" />
                        </motion.div>
                        <h1 className="text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                            Experience Travel Like Never Before. <br /><span className="text-white/70"></span>
                        </h1>
                        <p className="text-xl text-indigo-50 font-medium max-w-sm leading-relaxed opacity-90 border-l-4 border-indigo-400 pl-6">
                            A smarter approach to business travel starts here.
                        </p>
                    </div>
                </motion.div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-md"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">WelCome To TravelRequest</h2>
                            <p className="text-slate-500 font-bold text-lg">Login to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={credentials.email}
                                        onChange={handleChange}
                                        placeholder="Gmail"
                                        className="mmt-input pl-16 py-5"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1]">Password</label>
                                    <Link to="/forgot-password" className="text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:underline">Forgot?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        placeholder="************"
                                        className="mmt-input pl-16 py-5"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-mmt-primary py-6 text-xl tracking-tighter"
                            >
                                {isLoading ? (
                                    <div className="h-7 w-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <ChevronRight className="h-6 w-6" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-slate-500 font-medium text-sm">
                                Register <Link to="/register" className="text-[#008cff] font-bold hover:underline">SignUp</Link>
                            </p>
                            <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-full">
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Login;
