import { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    FileText, 
    UserCircle2, 
    ArrowRight, 
    Plane, 
    MapPin, 
    Globe, 
    Coffee, 
    ShieldCheck, 
    MessageSquare,
    Zap,
    ChevronRight,
    Search,
    Clock,
    History,
    TrendingUp,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);



    // Graph Analytics State
    const [isGraphPopupOpen, setIsGraphPopupOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewType, setViewType] = useState('MONTHLY'); // 'MONTHLY' | 'YEARLY'

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to sync management node');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.accessToken) {
            navigate('/login');
            return;
        }
        fetchRequests();
    }, [user?.accessToken, navigate]);

    const handleDecision = async (status) => {
        if (!selectedReq) return;

        if (status === 'REJECTED' && !comment.trim()) {
            toast.error('Rejection reason is mandatory. Please use the Reviewer Output field.');
            return;
        }

        const loadingToast = toast.loading(`${status === 'APPROVED' ? 'Approving' : 'Rejecting'} request...`);
        setIsSubmitting(true);
        try {
            await api.put(`/requests/${selectedReq.id}/manager`, {
                status: status,
                managerComments: comment
            });
            toast.success(`Request ${status.toLowerCase()} successfully!`, { id: loadingToast });
            setSelectedReq(null);
            setComment('');
            fetchRequests();
        } catch (error) {
            console.error('Update failed', error);
            const statusCode = error.response?.status;
            if (statusCode === 401) {
                toast.error('Unauthorized. Please log in again.', { id: loadingToast });
                navigate('/login');
                return;
            }
            const serverData = error.response?.data;
            const message = typeof serverData === 'string'
                ? serverData
                : serverData?.message || serverData?.error || JSON.stringify(serverData) || error.message || 'Failed to update request';
            toast.error(message, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'SUBMITTED');
    const approvedRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'BOOKED');
    const rejectedRequests = requests.filter(r => r.status === 'REJECTED');
    
    // Global Summary Counts
    const approvedCount = approvedRequests.length;
    const rejectedCount = rejectedRequests.length;
    const submittedCount = pendingRequests.length;

    // Filtered Analytics Logic
    const getFilteredStats = (m, y, type) => {
        const filtered = requests.filter(r => {
            const date = new Date(r.departureDate);
            if (Number.isNaN(date.getTime())) return false;
            
            if (type === 'YEARLY') return date.getFullYear() === y;
            return date.getFullYear() === y && date.getMonth() === m;
        });

        const app = filtered.filter(r => r.status === 'APPROVED' || r.status === 'BOOKED').length;
        const rej = filtered.filter(r => r.status === 'REJECTED').length;
        const pen = filtered.filter(r => r.status === 'SUBMITTED').length;

        return [
            { name: 'Approved', value: app, color: '#10b981' },
            { name: 'Rejected', value: rej, color: '#ef4444' },
            { name: 'Pending', value: pen, color: '#f59e0b' }
        ].filter(d => d.value > 0);
    };

    const currentAnalytics = getFilteredStats(selectedMonth, selectedYear, viewType);

    // Month Names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const changeMonth = (dir) => {
        let newMonth = selectedMonth + dir;
        let newYear = selectedYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };



    return (
        <div className="pb-20 space-y-12">
            {/* Hero Section */}
            <div className="hero-bg px-8 py-24 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Zap className="w-96 h-96 -rotate-12 fill-white" />
                </div>
                <div className="relative z-10 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="bg-white/20 backdrop-blur-xl p-2.5 rounded-2xl border border-white/30">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Management Authorization Hub</span>
                    </motion.div>
                    
                    <h1 className="text-7xl font-black tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">
                        Awaiting your <br /><span className="text-white/60">verification.</span>
                    </h1>
                    <p className="text-xl text-indigo-50 font-medium opacity-90 max-w-2xl leading-relaxed border-l-4 border-indigo-400 pl-8">
                        You have <span className="text-white font-black px-3 py-1 bg-white/10 rounded-xl">{pendingRequests.length} critical itineraries</span> in the review queue. Maintain strategic oversight for all global travel.
                    </p>
                </div>

                {/* Analytics Snapshot - Pie Chart */}
                <motion.div 
                    initial={{ y: '-50%', opacity: 0 }}
                    animate={{ y: '-50%', opacity: 1 }}
                    whileHover={{ scale: 1.05, y: '-50%' }}
                    whileTap={{ scale: 0.95, y: '-50%' }}
                    onClick={() => setIsGraphPopupOpen(true)}
                    className="absolute top-[42%] right-12 hidden xl:block w-80 h-80 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 p-6 shadow-2xl cursor-pointer group hover:bg-white/20"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <TrendingUp className="w-3 h-3 text-white/40" />
                        <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.3em] text-center">Status Distribution</p>
                    </div>
                    {currentAnalytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={currentAnalytics}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {currentAnalytics.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: '800', fontSize: '12px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value) => <span className="text-white text-[10px] font-black uppercase tracking-widest">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/40 italic text-xs">
                            No data for analysis yet.
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white/90 text-indigo-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Expand Insights</span>
                    </div>
                </motion.div>
            </div>

            {/* ── Analytics Visualizer Portal ─────────────────────────── */}
            {isGraphPopupOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[9999999] grid place-items-center bg-indigo-950/80 backdrop-blur-3xl p-4 sm:p-10"
                    onClick={() => setIsGraphPopupOpen(false)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
                        className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                        style={{ maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className="px-12 py-10 bg-indigo-600 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <TrendingUp className="w-48 h-48 " />
                            </div>
                            <div className="relative z-10 text-center sm:text-left">
                                <h3 className="text-white font-black text-4xl tracking-tighter mb-2">Operational Analytics</h3>
                                <div className="flex items-center justify-center sm:justify-start gap-4">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
                                        <Calendar className="w-3 h-3 text-white/70" />
                                        <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                            {viewType === 'MONTHLY' ? `${monthNames[selectedMonth]} ${selectedYear}` : `Annual ${selectedYear}`}
                                        </span>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-white/10 p-2 rounded-2xl flex gap-2 border border-white/20">
                                    <button 
                                        onClick={() => setViewType('MONTHLY')}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        onClick={() => setViewType('YEARLY')}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'YEARLY' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Yearly
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setIsGraphPopupOpen(false)}
                                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-all font-black text-2xl shadow-lg border border-white/30"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Navigation Bar */}
                        <div className="px-12 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => changeMonth(-1)}
                                    disabled={viewType === 'YEARLY'}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm transition-all ${viewType === 'YEARLY' ? 'opacity-30' : 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95'}`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="text-center min-w-[200px]">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {viewType === 'MONTHLY' ? monthNames[selectedMonth] : 'Calendar Year'}
                                    </p>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">{selectedYear}</p>
                                </div>
                                <button 
                                    onClick={() => changeMonth(1)}
                                    disabled={viewType === 'YEARLY'}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm transition-all ${viewType === 'YEARLY' ? 'opacity-30' : 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95'}`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-500 shadow-sm"
                                >
                                    {Array.from({ length: 2060 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-50/30">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full min-h-[400px]">
                                {/* Visualizer Chart */}
                                <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-white flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Decision Distribution</h4>
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center scale-125 origin-center">
                                        {currentAnalytics.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={currentAnalytics}
                                                        innerRadius={80}
                                                        outerRadius={110}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                        strokeWidth={0}
                                                    >
                                                        {currentAnalytics.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '24px', border: 'none', background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '14px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-300">
                                                <History className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="font-bold text-sm">No recorded data for this window.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Raw Intel Panel */}
                                <div className="space-y-6">
                                    {currentAnalytics.length > 0 ? (
                                        currentAnalytics.map((item, idx) => (
                                            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                                                        <TrendingUp className="w-6 h-6" style={{ color: item.color }} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.name} Trajectories</p>
                                                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{item.value}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[#6366f1] bg-indigo-50 px-3 py-1 rounded-lg">
                                                        {Math.round((item.value / currentAnalytics.reduce((s, c) => s + c.value, 0)) * 100)}% Matrix
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white/50 backdrop-blur-sm p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center h-full">
                                            <Coffee className="w-12 h-12 text-slate-200 mb-6" />
                                            <h5 className="font-black text-slate-400 uppercase tracking-widest text-xs">System Idle</h5>
                                            <p className="text-slate-400 text-[10px] font-medium max-w-[200px] mt-2 italic">Zero deployment signatures detected for the current selection criteria.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 container mx-auto px-4">
                {/* Pending Queue */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between px-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Review Stream</h2>
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-12 bg-[#6366f1] rounded-full"></div>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Active Priority Queue</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/reports')}
                            className="bg-[#6366f1] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 group"
                        >
                            Financial Analytics <History className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="mmt-card h-40 animate-pulse"></div>
                            ))}
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mmt-card text-center py-32 border-dashed border-slate-200"
                        >
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Coffee className="w-12 h-12 text-emerald-300" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Mission Accomplished</h3>
                            <p className="text-slate-500 font-medium italic">Strategic queue is empty. All personnel are accounted for.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence mode='popLayout'>
                                {pendingRequests.map((req, idx) => (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onClick={() => { setSelectedReq(req); setComment(''); }}
                                        className={`mmt-card group cursor-pointer transition-all duration-500 p-8 flex items-center justify-between border-4
                                            ${selectedReq?.id === req.id 
                                                ? 'border-[#6366f1] bg-indigo-50/50 shadow-2xl shadow-indigo-500/10' 
                                                : 'border-white hover:border-slate-100 hover:shadow-xl'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center font-black text-2xl text-[#6366f1] shadow-sm transform group-hover:rotate-6 transition-transform">
                                                {req.employee?.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 leading-none mb-2 tracking-tighter">{req.employee?.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">Ref: {req.id}</span>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{req.travelMode}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex flex-col items-center px-10">
                                            <div className="flex items-center gap-5 px-8 py-4 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                <span className="font-black text-slate-800 tracking-tight text-center max-w-[120px] truncate">{req.fromLocation}</span>
                                                <div className="flex flex-col items-center border-b-2 border-dashed border-indigo-200 px-4 w-32 relative">
                                                    <Plane className={`w-5 h-5 text-indigo-400 absolute -top-3 bg-white px-1 ${req.tripType === 'round-trip' ? '' : 'translate-x-4'}`} />
                                                    {req.tripType === 'round-trip' && (
                                                        <Plane className="w-5 h-5 text-emerald-400 absolute -bottom-3 bg-white px-1 rotate-180 translate-x-4" />
                                                    )}
                                                </div>
                                                <span className="font-black text-indigo-600 tracking-tight text-center max-w-[120px] truncate">{req.toLocation}</span>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 bg-slate-50 px-3 py-1 rounded-full">
                                                {req.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="text-right flex flex-col items-end">
                                                <div className="flex items-center justify-end gap-2 text-xs font-black text-slate-900 mb-1">
                                                    <Calendar className="w-4 h-4 text-[#6366f1]" />
                                                    {new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                                {req.tripType === 'round-trip' && req.returnDate && (
                                                    <div className="flex items-center justify-end gap-2 text-xs font-black text-emerald-600 mb-1">
                                                        <Calendar className="w-4 h-4 text-emerald-500" />
                                                        {new Date(req.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{req.travelType}</p>
                                            </div>
                                            <div className="p-3.5 rounded-2xl bg-slate-50 group-hover:bg-[#6366f1] group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Decision Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.15)] border-4 border-white sticky top-28 overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>


                        <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tighter">
                            <div className="w-2.5 h-10 bg-orange-500 rounded-full"></div>
                            Decision
                        </h2>

                        <AnimatePresence mode='wait'>
                            {selectedReq ? (
                                <motion.div 
                                    key="content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-white">
                                        <div className="flex items-center gap-5 border-b border-slate-200 pb-6 mb-6">
                                            <div className="w-14 h-14 rounded-2xl mmt-gradient flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                                                {selectedReq.employee?.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-2xl tracking-tighter leading-none mb-1">{selectedReq.employee?.name}</p>
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Signature Passport</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 mb-6">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itinerary Details</p>
                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        {selectedReq.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Origin</p>
                                                            <p className="font-black text-slate-900 leading-tight">{selectedReq.fromLocation}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 border-l-2 border-dashed border-slate-100 ml-1 py-1 pl-4">
                                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                                                            <p className="font-black text-slate-900 leading-tight">{selectedReq.toLocation}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                            {new Date(selectedReq.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    {selectedReq.tripType === 'round-trip' && selectedReq.returnDate && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Return</p>
                                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                                                {new Date(selectedReq.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure Time</p>
                                                        <p className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {selectedReq.preferredTime || 'Not specified'}
                                                        </p>
                                                    </div>
                                                    {selectedReq.tripType === 'round-trip' && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Return Time</p>
                                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {selectedReq.preferredReturnTime || 'Not specified'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Mode</p>
                                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1 uppercase">
                                                            <Plane className="w-3.5 h-3.5 text-indigo-500" />
                                                            {selectedReq.travelMode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Reviewer Output</label>
                                            <textarea 
                                                className="mmt-input h-32 resize-none pt-6 text-sm font-bold leading-relaxed scrollbar-hide" 
                                                placeholder="Append managerial notes to this itinerary..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={() => handleDecision('APPROVED')}
                                                disabled={isSubmitting}
                                                className={`btn-mmt-primary w-full py-6 flex items-center justify-center gap-4 text-xl tracking-tighter ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                <CheckCircle2 className="w-6 h-6" />
                                                {isSubmitting ? 'Approving...' : 'Approve'}
                                            </button>
                                            <button 
                                                onClick={() => handleDecision('REJECTED')}
                                                disabled={isSubmitting}
                                                className={`w-full py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-[0.3em] ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'} transition-all border-2 border-transparent hover:border-rose-100 flex items-center justify-center gap-3`}
                                            >
                                                <XCircle className="w-5 h-5" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-24"
                                >
                                    <div className="bg-indigo-50 w-32 h-32 rounded-[2.8rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                        <FileText className="h-14 w-14 text-indigo-200" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">Strategic Command</h4>
                                    <p className="text-slate-500 text-sm font-bold leading-relaxed px-10">
                                        Intercept a pending authorization from the stream to verify eligibility and approve deployment.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
