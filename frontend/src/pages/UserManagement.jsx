import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    User,
    Mail,
    Shield,
    Trash2,
    Plus,
    X,
    CheckCircle,
    ArrowLeft,
    ShieldCheck,
    Users,
    Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const UserManagement = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            // Normalize roles from ROLE_ADMIN to ADMIN
            const normalized = res.data.map(u => ({
                ...u,
                role: u.role?.startsWith?.('ROLE_') ? u.role.replace('ROLE_', '') : u.role,
            }));
            setUsers(normalized);
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Unable to fetch user roster');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'ROLE_ADMIN') {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [user, navigate]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // Client-side duplication check
        if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
            toast.error('Identity collision: This email is already assigned to an associate.', {
                duration: 6000,
                icon: '⚠️'
            });
            return;
        }

        setSubmitting(true);
        const loadToast = toast.loading('Provisioning new associate node...');
        try {
            await api.post('/users', newUser);
            toast.success('Associate successfully provisioned!', { id: loadToast });
            setShowAddModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'EMPLOYEE' });
            fetchUsers();
        } catch (error) {
            console.error('Provisioning failed', error);
            const errorData = error.response?.data;
            const message = typeof errorData === 'string' ? errorData : (errorData?.message || 'Node provisioning failed');
            
            // Safer toast update: dismiss and show new one
            toast.dismiss(loadToast);
            toast.error(message, { duration: 5000 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This will also delete all travel requests for this user.')) return;
        
        const loadToast = toast.loading('Removing user from system...');
        try {
            await api.delete(`/users/${userId}`);
            toast.success('User and data purged successfully', { id: loadToast });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            const errorMsg = error.response?.data || 'Failed to delete user';
            toast.error(errorMsg, { id: loadToast });
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const loadToast = toast.loading('Updating user permissions...');
        try {
            await api.put(`/users/${userId}`, { role: newRole });
            toast.success('Permissions updated', { id: loadToast });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role', error);
            toast.error('Failed to update role', { id: loadToast });
        }
    };

    return (
        <div className="pb-20">
            {/* Header Section */}
            <div className="hero-bg px-8 py-24 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl mb-12 border border-white/10">
                <div className="relative z-10 max-w-4xl">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Console</span>
                    </button>
                    <div className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl w-fit mb-8 border border-white/30">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter mb-6 leading-[0.9] text-white drop-shadow-2xl">
                        Team <br /><span className="text-white/60">Roster Management.</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 mt-10">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-white text-[#6366f1] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Associate
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden">
                    <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Directory</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Guard</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Associate</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorization</th>
                                    <th className="px-10 py-6 text text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="py-24 text-center">
                                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-[#6366f1] rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Global Directory...</p>
                                        </td>
                                    </tr>
                                ) : users.map((u) => (
                                    <motion.tr 
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl mmt-gradient flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                                                    {u.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{u.name}</p>
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="text-xs font-bold">{u.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <select 
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-indigo-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                <option value="EMPLOYEE">Employee</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                disabled={u.email === user.email}
                                                className={`p-4 rounded-xl transition-all ${u.email === user.email ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white hover:rotate-6 shadow-sm hover:shadow-rose-500/20'}`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 overflow-y-auto pt-10 pb-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border-4 border-white"
                        >
                            <div className="bg-slate-50 p-12 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Add Associate</h2>
                                    <p className="text-[10px] mmt-gradient-text font-black uppercase tracking-[0.4em] mt-2">Provision New Node</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="bg-white border border-slate-200 p-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="p-12 space-y-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Full Identity</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input 
                                            required
                                            type="text"
                                            placeholder="Legal Name"
                                            className="mmt-input pl-16 py-5"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Digital Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input 
                                            required
                                            type="email"
                                            placeholder="Email Address"
                                            className={`mmt-input pl-16 py-5 ${users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase()) ? 'border-rose-500 bg-rose-50/30' : ''}`}
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                        />
                                    </div>
                                    {newUser.email && users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase()) && (
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">
                                            ⚠️ This identity already exists in your roster
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Security Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input 
                                            required
                                            type="password"
                                            placeholder="Initial Password"
                                            className="mmt-input pl-16 py-5"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Access Role</label>
                                    <div className="relative">
                                        <Shield className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <select 
                                            required
                                            className="mmt-input pl-16 py-5 appearance-none"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        >
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className={`btn-mmt-primary w-full py-6 flex items-center justify-center gap-4 text-xl tracking-tighter ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{submitting ? 'Provisioning...' : 'Create Profile'}</span>
                                        <CheckCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
