import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    Plane,
    Receipt,
    CreditCard,
    Ticket,
    Search,
    CheckCircle,
    IndianRupee,
    ArrowRight,
    Clock,
    BarChart2,
    Users,
    Plus,
    User,
    Hash,
    Building,
    ClipboardCheck,
    Calendar,
    MapPin,
    ShieldCheck,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState(null);

    const [bookingData, setBookingData] = useState({
        cost: ''
    });



    const [ticketFile, setTicketFile] = useState(null);
    const [returnTicketFile, setReturnTicketFile] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to load system inventory');
        } finally {
            setLoading(false);
        }
    };

    // Removed fetchUsers (migrated to UserManagement.jsx)

    useEffect(() => {
        if (!user?.accessToken) {
            navigate('/login');
            return;
        }
        fetchRequests();
    }, [user?.accessToken, navigate]);

    useEffect(() => {
        if (!selectedReq) {
            setBookingData({ cost: '' });
            setTicketFile(null);
            setReturnTicketFile(null);
            return;
        }

        setBookingData({
            cost: selectedReq.cost ? String(selectedReq.cost) : '',
        });
    }, [selectedReq]);

    const handleBookTicket = async (e) => {
        e.preventDefault();
        if (!selectedReq) return;

        const costNumber = parseFloat(bookingData.cost);
        if (isNaN(costNumber) || costNumber < 0) {
            toast.error('Enter a valid numeric cost');
            return;
        }

        const loadToast = toast.loading('Finalizing corporate booking...');
        setIsBooking(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                toast.error('Session expired. Please log in.', { id: loadToast });
                navigate('/login');
                return;
            }
            const storedUser = JSON.parse(userStr);
            const token = storedUser.accessToken;

            const formData = new FormData();
            formData.append('cost', costNumber);

            if (ticketFile) formData.append('file', ticketFile);
            if (returnTicketFile) formData.append('returnFile', returnTicketFile);

            console.log('Dispatching fulfillment with token length:', token?.length);

            await api.post(`/requests/${selectedReq.id}/fulfillment`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success('Itinerary successfully booked!', { id: loadToast });
            setSelectedReq(null);
            setBookingData({ cost: '' });
            setTicketFile(null);
            setReturnTicketFile(null);
            fetchRequests();
        } catch (error) {
            console.error('CRITICAL: Fulfillment failed:', error);
            const status = error.response?.status;
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;

            if (status === 401) {
                toast.error(`[DEBUG-AUTH] 401 DETECTED: ${errorMsg}`, { id: loadToast });
                // navigate('/login'); 
                return;
            }
            toast.error(`[DEBUG-FAIL] ${errorMsg}`, { id: loadToast });
        } finally {
            setIsBooking(false);
        }
    };

    // Removed handleRoleChange and saveUserRole (migrated to UserManagement.jsx)

    const approvedRequests = useMemo(() => requests.filter(r => r.status === 'APPROVED'), [requests]);
    const bookedRequests = useMemo(() => requests.filter(r => r.status === 'BOOKED'), [requests]);
    const allBookedRequests = useMemo(() => requests.filter(r => r.status === 'BOOKED'), [requests]);

    const insights = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let monthlyCost = 0;
        let yearlyCost = 0;
        let monthlyTrips = 0;
        let yearlyTrips = 0;

        const userStats = {};

        bookedRequests.forEach(req => {
            const date = new Date(req.departureDate);
            if (Number.isNaN(date.getTime())) return;
            const cost = Number(req.cost) || 0;

            if (date.getFullYear() === currentYear) {
                yearlyCost += cost;
                yearlyTrips += 1;
                if (date.getMonth() === currentMonth) {
                    monthlyCost += cost;
                    monthlyTrips += 1;
                }
            }

            const userId = req.employee?.id;
            if (!userId) return;
            if (!userStats[userId]) {
                userStats[userId] = {
                    id: userId,
                    name: req.employee?.name || 'Unknown',
                    trips: 0,
                    cost: 0,
                    lastTravel: date,
                };
            }
            const entry = userStats[userId];
            entry.trips += 1;
            entry.cost += cost;
            if (date > entry.lastTravel) {
                entry.lastTravel = date;
            }
        });

        const userStatsList = Object.values(userStats).sort((a, b) => (b.trips || 0) - (a.trips || 0));
        const topTraveler = userStatsList[0] || null;

        return {
            monthlyCost,
            yearlyCost,
            monthlyTrips,
            yearlyTrips,
            topTraveler,
            userStats: userStatsList,
        };
    }, [bookedRequests]);

    return (
        <div className="pb-20">
            {/* Header Section */}
            <div className="hero-bg px-8 py-24 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl mb-12 border border-white/10">
                <div className="relative z-10 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl w-fit mb-8 border border-white/30"
                    >
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-7xl font-black tracking-tighter mb-6 leading-[0.9] text-white drop-shadow-2xl">
                        Inventory & <br /><span className="text-white/60">Booking Control.</span>
                    </h1>
                    <p className="text-xl text-indigo-50 font-medium opacity-90 max-w-2xl leading-relaxed border-l-4 border-indigo-400 pl-8">
                        Executive oversight for global ticket fulfillment. Securely finalize <span className="text-white font-bold">TravelRequest</span> itineraries in real-time.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12 container mx-auto px-4">
                {/* Left List - Final Approvals */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-white overflow-hidden">
                        <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="mmt-gradient text-white rounded-[1.2rem] h-12 w-12 flex justify-center items-center shadow-xl shadow-indigo-500/20">
                                    <span className="font-black text-lg">{approvedRequests.length}</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Queue</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pending Fulfillment</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-24 flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-[#6366f1] rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Syncing Global Node...</p>
                                </div>
                            ) : approvedRequests.length === 0 ? (
                                <div className="text-center py-32 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <CheckCircle className="h-12 w-12 text-emerald-300" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">All Clear</h3>
                                    <p className="text-slate-500 font-medium">No approved trips are waiting for booking.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {approvedRequests.map(req => (
                                        <motion.div
                                            key={req.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedReq(req)}
                                            className={`p-8 rounded-[2.5rem] border-4 cursor-pointer group transition-all duration-500
                                                ${selectedReq?.id === req.id
                                                    ? 'border-[#6366f1] bg-indigo-50/50 shadow-2xl shadow-indigo-500/10'
                                                    : 'border-slate-50 hover:border-indigo-100 bg-white'}`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-lg leading-none mb-1">{req.employee?.name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: #{req.employee?.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white/80 p-5 rounded-2xl flex items-center justify-between mb-6 shadow-sm border border-slate-50">
                                                <span className="font-black text-slate-800 text-sm max-w-[100px] truncate" title={req.fromLocation}>{req.fromLocation}</span>
                                                <div className="flex flex-col items-center border-b-[1.5px] border-dashed border-indigo-200 w-20 relative">
                                                    <Plane className={`h-4 w-4 text-indigo-400 absolute -top-2 ${req.tripType === 'round-trip' ? '' : 'translate-x-3'}`} />
                                                    {req.tripType === 'round-trip' && (
                                                        <Plane className="h-4 w-4 text-emerald-400 absolute -bottom-2 rotate-180 translate-x-3" />
                                                    )}
                                                </div>
                                                <span className="font-black text-[#6366f1] text-sm text-right max-w-[100px] truncate" title={req.toLocation}>{req.toLocation}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                        {new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    {req.tripType === 'round-trip' && req.returnDate && (
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                                            {new Date(req.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                        {req.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                                                    </span>
                                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-[2rem] uppercase border border-emerald-100/50 animate-pulse">Wait-List</span>
                                                </div>
                                            </div>

                                            {selectedReq?.id === req.id && (
                                                <div className="mt-6 p-6 bg-white/70 rounded-2xl border border-indigo-100">
                                                    <h4 className="text-sm font-black text-indigo-700 uppercase tracking-widest mb-3">Details</h4>
                                                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                                                        <div className="flex justify-between">
                                                            <span className="font-black">Purpose</span>
                                                            <span className="text-right">{req.purpose || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="font-black">Cost</span>
                                                            <span className="text-right">{req.cost ? `₹${req.cost}` : 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Dispatch Report */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/5 border border-white">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-2.5 h-10 bg-emerald-400 rounded-full"></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Ticket Dispatch Report</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Employees who received tickets</p>
                            </div>
                            <span className="ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                {bookedRequests.length} Sent
                            </span>
                        </div>
                        {bookedRequests.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <p className="text-slate-400 font-bold text-sm italic">No tickets dispatched yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">
                                            <th className="pb-4 pr-6">Employee</th>
                                            <th className="pb-4 pr-6">Route</th>
                                            <th className="pb-4 pr-6">Mode</th>
                                            <th className="pb-4 pr-6">Departure</th>
                                            <th className="pb-4 pr-6">Ticket</th>
                                            <th className="pb-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {bookedRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50/60 transition-all group">
                                                <td className="py-5 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {req.employee?.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm leading-none">{req.employee?.name}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{req.employee?.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 pr-6">
                                                    <p className="text-sm font-black text-slate-700">{req.fromLocation} <span className="text-indigo-400">→</span> {req.toLocation}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{req.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}</p>
                                                </td>
                                                <td className="py-5 pr-6">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">{req.travelMode}</span>
                                                </td>
                                                <td className="py-5 pr-6">
                                                    <p className="text-xs font-black text-slate-700">{new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    {req.tripType === 'round-trip' && req.returnDate && (
                                                        <p className="text-[10px] font-black text-emerald-500 mt-0.5">{new Date(req.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    )}
                                                </td>
                                                <td className="py-5 pr-6">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                                        req.ticketPath
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        {req.ticketPath ? '✓ Uploaded' : 'Generated'}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-right">
                                                    <p className="text-lg font-black text-slate-900">₹{req.cost?.toLocaleString('en-IN')}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-100">
                                        <tr>
                                            <td colSpan="5" className="pt-4 font-black text-slate-500 uppercase text-xs tracking-widest">Total Dispatched</td>
                                            <td className="pt-4 text-right text-xl font-black text-slate-900">
                                                ₹{bookedRequests.reduce((s, r) => s + (r.cost || 0), 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Insights / Fulfillment / User Management */}
                <div className="lg:col-span-1 sticky top-28 space-y-10">
                    {/* Insights */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.15)] border border-white">
                        <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tighter">
                            <div className="w-2.5 h-10 bg-[#6366f1] rounded-full"></div>
                            Insights
                        </h2>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">This Month</p>
                                        <p className="text-3xl font-black text-slate-900 mt-2">₹{(insights?.monthlyCost || 0).toFixed(2)}</p>
                                        <p className="text-xs font-black text-slate-500 mt-1">{insights?.monthlyTrips || 0} trip{(insights?.monthlyTrips || 0) === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="rounded-full bg-indigo-100 p-3">
                                        <BarChart2 className="h-6 w-6 text-indigo-600" />
                                    </div>
                                </div>



                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">This Year (All Time)</p>
                                    <p className="text-xl font-black text-slate-900 mt-2">₹{allBookedRequests.reduce((sum, r) => sum + (Number(r.cost) || 0), 0).toFixed(2)}</p>
                                    <p className="text-xs font-black text-slate-500 mt-1">{allBookedRequests.length} trip{allBookedRequests.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>

                            {insights.topTraveler ? (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Top Traveler</p>
                                    <p className="text-lg font-black text-slate-900">{insights.topTraveler?.name || 'Unknown'}</p>
                                    <p className="text-xs font-black text-slate-500 mt-1">
                                        {insights.topTraveler?.trips || 0} trip{(insights.topTraveler?.trips || 0) === 1 ? '' : 's'} • Last: {insights.topTraveler?.lastTravel ? new Date(insights.topTraveler.lastTravel).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-sm font-black text-slate-500">No bookings yet to build insights.</p>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Fulfillment */}
                    <div className="bg-white rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.15)] border-4 border-white overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tighter">
                            <div className="w-2.5 h-10 bg-[#6366f1] rounded-full"></div>
                            Fulfillment
                        </h2>

                        <AnimatePresence mode='wait'>
                            {selectedReq ? (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleBookTicket}
                                    className="space-y-8"
                                >
                                    <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 group-hover:bg-indigo-50 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Target Account</p>
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="font-black text-slate-900 text-2xl tracking-tighter">{selectedReq.employee?.name}</p>
                                            <div className="flex gap-2">
                                                <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                                    {selectedReq.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                                                </span>
                                                <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{selectedReq.travelMode}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Departure Leg */}
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Departure Leg</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[12px] font-black text-slate-800 mb-3">
                                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                                    {selectedReq.fromLocation} <ArrowRight className="w-3 h-3 text-indigo-400" /> {selectedReq.toLocation}
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                        {new Date(selectedReq.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    {selectedReq.preferredTime && (
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {selectedReq.preferredTime}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Return Leg (Round Trip) */}
                                            {selectedReq.tripType === 'round-trip' && (
                                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-600"></div>
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Return Leg</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[12px] font-black text-slate-800 mb-3">
                                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                                        {selectedReq.toLocation} <ArrowRight className="w-3 h-3 text-emerald-400" /> {selectedReq.fromLocation}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                                            {selectedReq.returnDate ? new Date(selectedReq.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date Pending'}
                                                        </div>
                                                        {selectedReq.preferredReturnTime && (
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {selectedReq.preferredReturnTime}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Invoiced Amount</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6366f1]" />
                                                <input
                                                    required
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="mmt-input pl-16 py-6 text-2xl font-black text-slate-900"
                                                    value={bookingData.cost}
                                                    onChange={(e) => setBookingData({ ...bookingData, cost: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">
                                                {selectedReq.tripType === 'round-trip' ? 'Departure Ticket' : 'Ticket Upload'}
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
                                                className="w-full rounded-xl border border-slate-200 p-3"
                                            />
                                            {selectedReq?.ticketPath && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <a
                                                        href={`/api/requests/${selectedReq.id}/ticket`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        Current Departure Ticket
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {selectedReq.tripType === 'round-trip' && (
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 font-black text-emerald-600">Return Ticket</label>
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/*"
                                                    onChange={(e) => setReturnTicketFile(e.target.files?.[0] || null)}
                                                    className="w-full rounded-xl border border-emerald-100 p-3 bg-emerald-50/10"
                                                />
                                                {selectedReq?.returnTicketPath && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <a
                                                            href={`/api/requests/${selectedReq.id}/return-ticket`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-700"
                                                        >
                                                            Current Return Ticket
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isBooking}
                                            className={`btn-mmt-primary w-full py-6 flex items-center justify-center gap-4 text-xl tracking-tighter ${isBooking ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {isBooking ? (
                                                <span className="flex items-center gap-3">
                                                    <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                    sending...
                                                </span>
                                            ) : (
                                                <>
                                                    <span>Send</span>
                                                    <Ticket className="h-6 w-6" />
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedReq(null)}
                                            className="w-full mt-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] hover:text-[#6366f1] transition-colors"
                                        >
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-24"
                                >
                                    <div className="bg-indigo-50 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                        <Building className="h-14 w-14 text-indigo-300 transform -rotate-12" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">Ready for Action</h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-6">
                                        Select a queued request from the system hub to begin official fulfillment and data entry.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Management Section Removed - Migrated to Header/UserManagement.jsx */}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
