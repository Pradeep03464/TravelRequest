import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
    Plane,
    Calendar,
    MapPin,
    Clock,
    ChevronRight,
    Plus,
    LayoutGrid,
    List,
    Filter,
    Search,
    Download,
    Ticket,
    PlaneTakeoff,
    Globe,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateTicketPDF } from '../utils/generateTicketPDF';
import CityAutocomplete from '../components/CityAutocomplete';
const EmployeeDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Get today's date in LOCAL timezone as yyyy-mm-dd (avoids UTC-offset showing yesterday)
    const getTodayLocal = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const todayLocal = getTodayLocal();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const location = useLocation();
    const activeFilter = new URLSearchParams(location.search).get('filter'); // PENDING | APPROVED | REJECTED | null

    // Apply filter from navbar report card
    const filteredRequests = (() => {
        if (!activeFilter) return requests;
        if (activeFilter === 'PENDING')  return requests.filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING');
        if (activeFilter === 'APPROVED') return requests.filter(r => r.status === 'APPROVED' || r.status === 'BOOKED');
        if (activeFilter === 'REJECTED') return requests.filter(r => r.status === 'REJECTED');
        return requests;
    })();
    const [formData, setFormData] = useState({
        fromLocation: '',
        toLocation: '',
        departureDate: '',
        returnDate: '',
        travelMode: 'Flight',
        travelType: 'Domestic',
        tripType: 'one-way',
        preferredTime: '',
        preferredReturnTime: '',
        purpose: ''
    });

    const fetchRequests = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            // Updated endpoint: GET /api/requests/employee/{employeeId}
            const res = await api.get(`/requests/employee/${user.id}`);
            setRequests(res.data);
        } catch (error) {
            console.error('Fetch failed', error);
            toast.error('Failed to sync history');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) return;

        const loadToast = toast.loading('Submitting itinerary...');
        try {
            // Only send a returnDate when provided; avoid sending empty string which breaks LocalDate parsing
            const payload = {
                ...formData,
                returnDate: formData.returnDate ? formData.returnDate : null,
            };

            // Updated endpoint: POST /api/requests/{employeeId}
            await api.post(`/requests/${user.id}`, payload);
            toast.success('Trip request logged successfully!', { id: loadToast });
            setFormData({
                fromLocation: '', toLocation: '',
                departureDate: '', returnDate: '',
                travelMode: 'Flight', travelType: 'Domestic', preferredTime: '', preferredReturnTime: '', purpose: ''
            });
            fetchRequests();
        } catch (error) {
            console.error('Submission failed', error);
            const status = error.response?.status;
            if (status === 401) {
                toast.error('Unauthorized. Please log in again.', { id: loadToast });
                navigate('/login');
                return;
            }
            const message = error.response?.data || error.message || 'Submission failed';
            toast.error(message, { id: loadToast });
        }
    };

    const handleDownloadTicket = async (request, type = 'departure') => {
        const isReturn = type === 'return';
        const label = isReturn ? 'Return' : 'E-Ticket';
        const toastId = toast.loading(`Downloading ${label}...`);

        try {
            const hasFile = isReturn ? request.returnTicketPath : request.ticketPath;
            const endpoint = isReturn ? `/requests/${request.id}/return-ticket` : `/requests/${request.id}/ticket`;

            if (hasFile) {
                const response = await api.get(endpoint, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
                const disposition = response.headers['content-disposition'];
                let filename = isReturn ? `return-ticket-${request.id}.pdf` : `ticket-${request.id}.pdf`;
                if (disposition) {
                    const match = disposition.match(/filename="?([^";]+)"?/);
                    if (match && match[1]) {
                        filename = match[1];
                    }
                }
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${label} downloaded successfully`, { id: toastId });
                return;
            }

            // Fallback to generated PDF if no file uploaded
            if (!isReturn) {
                generateTicketPDF(request);
                toast.success('Ticket generated successfully', { id: toastId });
            } else {
                toast.error('Return ticket not uploaded yet', { id: toastId });
            }
        } catch (error) {
            console.error('PDF Error:', error);
            toast.error(`Failed to download ${label.toLowerCase()}`, { id: toastId });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            case 'BOOKED': return 'status-booked';
            case 'SUBMITTED': return 'status-pending'; // Map SUBMITTED to pending style
            default: return '';
        }
    };

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <div className="hero-bg px-4 sm:px-8 py-12 sm:py-16 lg:py-24 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl mb-12 border border-white/10">
                <div className="relative z-10 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="bg-white/20 backdrop-blur-xl p-2.5 rounded-2xl border border-white/30">
                            <Plane className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Travel Requests</span>
                    </motion.div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.9] drop-shadow-2xl">
                        Seamless Travel Requests for Your Next Professional Journey. <br /><span className="text-white/60"></span>
                    </h1>
                    <p className="text-xl text-indigo-50 font-medium opacity-90 max-w-2xl leading-relaxed mb-12 border-l-4 border-indigo-400 pl-8">
                        TravelRequest delivers a seamless platform where business travel meets premium comfort. <span className="text-white font-bold"></span>
                    </p>
                </div>
            </div>

            {/* Quick Actions / New Request Widget */}
            <div className="container mx-auto px-4 sm:px-6 -mt-8 sm:-mt-16 relative z-30">
                <div className="glass-card p-6 sm:p-10 shadow-2xl rounded-[3rem] overflow-hidden">
                    <div className="bg-white/90 rounded-[2.8rem] p-6 sm:p-10">
                        <div className="flex items-center justify-between mb-6 sm:mb-10 px-4">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-1">Book New Trip</h2>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Travel Smart</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Trip Type Toggle */}
                            <div className="flex gap-4 mb-4 px-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, tripType: 'one-way', returnDate: '' }));
                                    }}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${formData.tripType === 'one-way'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    One Way
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tripType: 'round-trip' }))}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${formData.tripType === 'round-trip'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    Round Trip
                                </button>
                            </div>
                            <div className={`grid grid-cols-1 md:grid-cols-2 ${formData.tripType === 'round-trip' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 bg-white border border-slate-100 rounded-[2rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow`}>
                                <div className="booking-widget-cell">
                                    <div className="flex items-center gap-3 mb-2">
                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</label>
                                    </div>
                                    <CityAutocomplete
                                        onPlaceSelected={(place) => {
                                            if (place && place.formatted_address) {
                                                setFormData({ ...formData, fromLocation: place.formatted_address });
                                            } else if (place && place.name) {
                                                setFormData({ ...formData, fromLocation: place.name });
                                            }
                                        }}
                                        required
                                        placeholder="Origin City"
                                        className="w-full bg-transparent font-black text-slate-900 placeholder:text-slate-300 outline-none text-xl relative z-50"
                                        value={formData.fromLocation}
                                        onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                                    />
                                </div>
                                <div className="booking-widget-cell">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Globe className="w-4 h-4 text-indigo-500" />
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</label>
                                    </div>
                                    <CityAutocomplete
                                        onPlaceSelected={(place) => {
                                            if (place && place.formatted_address) {
                                                setFormData({ ...formData, toLocation: place.formatted_address });
                                            } else if (place && place.name) {
                                                setFormData({ ...formData, toLocation: place.name });
                                            }
                                        }}
                                        required
                                        placeholder="Destination"
                                        className="w-full bg-transparent font-black text-slate-900 placeholder:text-slate-300 outline-none text-xl relative z-50"
                                        value={formData.toLocation}
                                        onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                                    />
                                </div>
                                <div className="booking-widget-cell">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Departure</label>
                                    </div>
                                    <input
                                        required
                                        type="date"
                                        min={todayLocal}
                                        className="w-full bg-transparent font-black text-slate-900 outline-none text-lg cursor-pointer"
                                        value={formData.departureDate}
                                        onChange={(e) => {
                                            const newDep = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                departureDate: newDep,
                                                // Reset return if it's now before new departure
                                                returnDate: prev.returnDate && prev.returnDate < newDep ? '' : prev.returnDate
                                            }));
                                        }}
                                    />
                                </div>
                                {formData.tripType === 'round-trip' && (
                                    <div className="booking-widget-cell">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-4 h-4 text-indigo-500" />
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Return</label>
                                        </div>
                                        <input
                                            required={formData.tripType === 'round-trip'}
                                            type="date"
                                            min={formData.departureDate || todayLocal}
                                            className="w-full bg-transparent font-black text-slate-900 outline-none text-lg cursor-pointer"
                                            value={formData.returnDate}
                                            onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 px-4">
                                <div className="flex items-center gap-3">
                                    <select
                                        className="bg-slate-100 px-4 sm:px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                                        value={formData.travelMode}
                                        onChange={(e) => setFormData({ ...formData, travelMode: e.target.value })}
                                    >
                                        <option>Flight</option>
                                        <option>Train</option>
                                        <option>Bus</option>
                                    </select>
                                    <select
                                        className="bg-slate-100 px-4 sm:px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                                        value={formData.travelType}
                                        onChange={(e) => setFormData({ ...formData, travelType: e.target.value })}
                                    >
                                        <option>Domestic</option>
                                        <option>International</option>
                                    </select>
                                </div>
                                <div className="flex-1 px-4 flex gap-4">
                                    <div className="relative group min-w-[120px] sm:min-w-[140px]">
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 px-4 py-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600"
                                            value={formData.preferredTime}
                                            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                                            title="Preferred Departure Time (Optional)"
                                        />
                                        <div className="absolute -top-2 left-4 px-1 bg-white text-[9px] font-black uppercase text-indigo-500 rounded hidden group-hover:block transition-all shadow-sm border border-indigo-100">Dep. Time</div>
                                    </div>
                                    {formData.tripType === 'round-trip' && (
                                        <div className="relative group min-w-[120px] sm:min-w-[140px]">
                                            <input
                                                type="time"
                                                className="w-full bg-slate-50 px-4 py-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600"
                                                value={formData.preferredReturnTime}
                                                onChange={(e) => setFormData({ ...formData, preferredReturnTime: e.target.value })}
                                                title="Preferred Return Time (Optional)"
                                            />
                                            <div className="absolute -top-2 left-4 px-1 bg-white text-[9px] font-black uppercase text-indigo-500 rounded hidden group-hover:block transition-all shadow-sm border border-indigo-100">Ret. Time</div>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Purpose of travel..."
                                        className="w-full bg-slate-50 px-4 sm:px-6 py-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn-mmt-primary w-full lg:w-auto min-w-[200px]"
                                >
                                    <span>Submit Request</span>
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 sm:px-6 mt-12 sm:mt-16 relative z-20">
                <div className="flex items-center justify-between mb-6 sm:mb-10">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-2">My Travel Registry</h2>
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-8 sm:w-12 bg-indigo-500 rounded-full"></div>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Global Activity Stream</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Filter Banner */}
                {activeFilter && (
                    <div className={`flex items-center justify-between mb-6 px-5 py-3 rounded-2xl border font-black text-sm
                        ${{ PENDING: 'bg-amber-50 border-amber-200 text-amber-700', APPROVED: 'bg-emerald-50 border-emerald-200 text-emerald-700', REJECTED: 'bg-rose-50 border-rose-200 text-rose-700' }[activeFilter] || 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}
                    >
                        <span className="uppercase tracking-widest text-[11px]">
                            Showing: {activeFilter === 'PENDING' ? 'Pending trips' : activeFilter === 'APPROVED' ? 'Approved trips' : 'Rejected trips'}
                            &nbsp;&mdash;&nbsp;{filteredRequests.length} result{filteredRequests.length !== 1 ? 's' : ''}
                        </span>
                        <a href="/employee" className="text-[10px] font-black uppercase tracking-widest underline underline-offset-2 hover:opacity-70 transition-opacity">
                            Clear filter
                        </a>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="mmt-card h-80 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-32 mmt-card border-dashed border-slate-200"
                    >
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PlaneTakeoff className="w-12 h-12 text-indigo-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{activeFilter ? 'No matching trips' : 'No itineraries found'}</h3>
                        <p className="text-slate-500 font-medium">{activeFilter ? `No ${activeFilter.toLowerCase()} trips found.` : 'Your upcoming business journeys will be archived here.'}</p>
                    </motion.div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                        <AnimatePresence mode='popLayout'>
                            {filteredRequests.map((req, idx) => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`mmt-card group overflow-hidden ${viewMode === 'list' ? 'flex items-center justify-between p-6' : 'p-0 flex flex-col'}`}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            <div className="h-32 w-full overflow-hidden relative">
                                                <img
                                                    src={idx % 2 === 0 ? 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80'}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    alt="Destination"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-4 left-4">
                                                    <span className={`status-badge ${getStatusStyle(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-8">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                                                            {req.toLocation}
                                                        </h3>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Ref: #{req.id ? req.id.toString().slice(-4) : '####'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode</p>
                                                        <p className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{req.travelMode}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-8 border border-white">
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From</p>
                                                        <p className="text-sm font-black text-slate-900">{req.fromLocation}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center px-4">
                                                        <ArrowRight className="w-3 h-3 text-indigo-300" />
                                                        <div className="h-0.5 w-8 bg-slate-200 my-1"></div>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                                                        <p className="text-sm font-black text-slate-900">{req.travelType}</p>
                                                    </div>
                                                </div>

                                                {/* Rejection Reason */}
                                                {req.status === 'REJECTED' && req.managerComments && (
                                                    <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">Rejection Reason</p>
                                                        <p className="text-xs font-bold text-rose-700">{req.managerComments}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-xs font-black text-slate-600">
                                                            {new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {req.status === 'BOOKED' && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadTicket(req, 'departure'); }}
                                                                className="flex items-center gap-2 text-[#6366f1] hover:text-indigo-700 transition-colors"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">{req.tripType === 'round-trip' ? 'Departure Ticket' : 'Get E-Ticket'}</span>
                                                            </button>
                                                            {req.tripType === 'round-trip' && req.returnTicketPath && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDownloadTicket(req, 'return'); }}
                                                                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Return Ticket</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <Plane className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900 leading-none mb-1">{req.fromLocation} → {req.toLocation}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.travelMode} • {req.travelType}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-12">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                                                    <p className="text-sm font-black text-slate-900">{new Date(req.departureDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`status-badge ${getStatusStyle(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                    {req.status === 'REJECTED' && req.managerComments && (
                                                        <p className="text-[9px] font-bold text-rose-500 mt-1 max-w-[140px] text-right">↩ {req.managerComments}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    {req.status === 'BOOKED' && (
                                                        <div className="flex items-center gap-2 ml-4">
                                                            <button
                                                                title="Download Departure Ticket"
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadTicket(req, 'departure'); }}
                                                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            {req.tripType === 'round-trip' && req.returnTicketPath && (
                                                                <button
                                                                    title="Download Return Ticket"
                                                                    onClick={(e) => { e.stopPropagation(); handleDownloadTicket(req, 'return'); }}
                                                                    className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
