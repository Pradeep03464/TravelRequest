import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserCheck, Plane, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [userData, setUserData] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await register(userData);
            toast.success('account Created Successfully', {
                icon: '🌟',
                style: { borderRadius: '20px', background: '#fff', color: '#000' }
            });
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
            const message =
                typeof error === 'string'
                    ? error
                    : error?.message || (error?.toString && error.toString()) || 'Registration failed';
            toast.error(message);
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
                            <Plane className="w-12 h-12 text-white transform rotate-45" />
                        </motion.div>
                        <h1 className="text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                            Where Every Journey Begins with Excellence.<br /><span className="text-white/70"></span>
                        </h1>
                        <p className="text-xl text-indigo-50 font-medium max-w-sm leading-relaxed opacity-90 border-l-4 border-indigo-400 pl-6">
                            Simplify your business travel—begin today.
                        </p>
                    </div>
                </motion.div>

                {/* Right Side - Registration Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-md py-8"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Travel Request </h2>
                            <p className="text-slate-500 font-bold text-lg">Create your Account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Full Identity Name</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={userData.name}
                                        onChange={handleChange}
                                        placeholder="User Name"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={userData.email}
                                        onChange={handleChange}
                                        placeholder="Gmail"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Portal Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={userData.password}
                                        onChange={handleChange}
                                        placeholder="************"
                                        className="mmt-input pl-16 py-4"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366f1] ml-1">Access Tier</label>
                                <div className="relative group">
                                    <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6366f1] transition-all" />
                                    <select
                                        name="role"
                                        value={userData.role}
                                        onChange={handleChange}
                                        className="mmt-input pl-16 py-4 appearance-none bg-slate-50/50 cursor-pointer"
                                        required
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronRight className="h-5 w-5 text-slate-400 rotate-90" />
                                    </div>
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
                                        <span>Sign Up</span>
                                        <ChevronRight className="h-6 w-6" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-slate-500 font-bold text-sm">
                                old user? <Link to="/login" className="text-[#6366f1] font-black hover:underline uppercase tracking-tighter">Sign In</Link>
                            </p>
                            <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 px-5 py-2.5 rounded-[2rem] border border-emerald-100/50">
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;
