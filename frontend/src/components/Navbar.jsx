import { useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Plane, FileBarChart, Zap, User, Menu, X, Bell, CheckCircle, XCircle, Ticket, BarChart2, Download, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const roleColors = {
    ROLE_ADMIN: { bg: 'from-violet-500 to-purple-600', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    ROLE_MANAGER: { bg: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    ROLE_EMPLOYEE: { bg: 'from-amber-400 to-orange-500', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ── Manager Stats Panel (manager only) ────────────────────────────────────────
const ManagerStats = () => {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState(false);        // full-screen popup visible
    const [activeTab, setActiveTab] = useState(null); // 'PENDING' | 'APPROVED' | 'REJECTED'
    const ref = useRef(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/requests');
            setRequests(res.data || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchRequests();
    }, [open]);

    // Close dropdown on outside click (skip when popup is open)
    useEffect(() => {
        const handler = (e) => {
            if (!popup && ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [popup]);

    const pending = requests.filter(r => r.status === 'PENDING' || r.status === 'SUBMITTED');
    const approved = requests.filter(r => r.status === 'APPROVED' || r.status === 'BOOKED');
    const rejected = requests.filter(r => r.status === 'REJECTED');

    const listForTab = (tab) => {
        if (tab === 'PENDING') return pending;
        if (tab === 'APPROVED') return approved;
        if (tab === 'REJECTED') return rejected;
        return [];
    };

    const downloadExcel = () => {
        const statusColor = (status) => {
            if (status === 'APPROVED' || status === 'BOOKED') return '#d1fae5';
            if (status === 'REJECTED') return '#fee2e2';
            return '#fef9c3';
        };

        const rows = requests.map(r => `
            <tr style="background-color:${statusColor(r.status)}">
                <td style="border:1px solid #ccc;padding:6px">${r.id || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.employee?.name || r.employee?.username || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.fromLocation || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.toLocation || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.travelMode || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.departureDate || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.returnDate || ''}</td>
                <td style="border:1px solid #ccc;padding:6px;font-weight:bold">${r.status || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.managerComments || ''}</td>
                <td style="border:1px solid #ccc;padding:6px">${r.purpose || ''}</td>
            </tr>`).join('');

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head><meta charset="UTF-8"></head>
            <body>
            <table border="1" style="border-collapse:collapse;font-family:Arial;font-size:12px">
                <thead>
                    <tr style="background-color:#1e1b4b;color:white;font-weight:bold">
                        <th style="border:1px solid #ccc;padding:8px">ID</th>
                        <th style="border:1px solid #ccc;padding:8px">Employee</th>
                        <th style="border:1px solid #ccc;padding:8px">From</th>
                        <th style="border:1px solid #ccc;padding:8px">To</th>
                        <th style="border:1px solid #ccc;padding:8px">Mode</th>
                        <th style="border:1px solid #ccc;padding:8px">Departure</th>
                        <th style="border:1px solid #ccc;padding:8px">Return</th>
                        <th style="border:1px solid #ccc;padding:8px">Status</th>
                        <th style="border:1px solid #ccc;padding:8px">Manager Comments</th>
                        <th style="border:1px solid #ccc;padding:8px">Purpose</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `travel-requests-${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const stats = [
        { key: 'PENDING', label: 'Pending', count: pending.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', Icon: Clock, headerBg: 'bg-amber-500' },
        { key: 'APPROVED', label: 'Approved', count: approved.length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', Icon: CheckCircle, headerBg: 'bg-emerald-500' },
        { key: 'REJECTED', label: 'Rejected', count: rejected.length, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', Icon: XCircle, headerBg: 'bg-rose-500' },
    ];

    const openPopup = (key) => {
        setActiveTab(key);
        setPopup(true);
        setOpen(false);
    };
    const closePopup = () => { setPopup(false); setActiveTab(null); };

    const popupList = listForTab(activeTab);
    const currentStat = stats.find(s => s.key === activeTab);

    return (
        <>
            <div ref={ref} className="relative z-50">
                <button
                    onClick={() => setOpen(o => !o)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all duration-300
                    ${open
                            ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/20'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 hover:shadow-md'}`}
                >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Team Stats</span>
                </button>

                {/* Dropdown */}
                <div className={`absolute right-0 top-[calc(100%+0.75rem)] w-[360px] transition-all duration-300 origin-top-right
                ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'}`}
                >
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)] border border-slate-100/60 overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">Team Overview</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {loading ? 'Loading...' : `${requests.length} total requests \u2022 Click a card to view`}
                                </p>
                            </div>
                            <button
                                onClick={downloadExcel}
                                disabled={requests.length === 0 || loading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export Excel
                            </button>
                        </div>

                        {/* Clickable Stat Cards */}
                        <div className="p-4 grid grid-cols-3 gap-3">
                            {stats.map(({ key, label, count, color, bg, border, dot, Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => openPopup(key)}
                                    className={`${bg} ${border} border rounded-2xl p-4 flex flex-col items-center gap-2 w-full transition-all duration-200 hover:scale-[1.05] hover:shadow-lg active:scale-95 cursor-pointer`}
                                >
                                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <p className={`text-3xl font-black ${color} leading-none`}>
                                        {loading ? '\u2013' : count}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Legend / Hint */}
                        <div className="px-5 pb-4">
                            <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-around text-[9px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-amber-200"></span>Pending</span>
                                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-emerald-200"></span>Approved</span>
                                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-rose-200"></span>Rejected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Screen Popup */}
            {popup && createPortal(
                <div
                    className="fixed inset-0 z-[10000000] grid place-items-center bg-black/80 backdrop-blur-md p-4"
                    onClick={closePopup}
                >
                    <div
                        className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300"
                        style={{ maxHeight: '85vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className={`px-10 py-8 flex items-center justify-between ${currentStat?.headerBg || 'bg-indigo-500'}`}>
                            <div>
                                <p className="text-white font-black text-2xl tracking-tighter">
                                    {activeTab === 'PENDING' ? 'Pending Deployment Queue' :
                                        activeTab === 'APPROVED' ? 'Authorized Deployment Registry' : 'Revoked Authorization Log'}
                                </p>
                                <p className="text-white/70 text-xs font-black uppercase tracking-[0.3em] mt-1">
                                    {popupList.length} employee{popupList.length !== 1 ? 's' : ''} intercepted
                                </p>
                            </div>
                            <button
                                onClick={closePopup}
                                className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/20 hover:bg-white/40 transition-all text-white font-black text-2xl"
                                aria-label="Terminate View"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="px-10 pt-8 flex gap-4">
                            {[
                                { key: 'PENDING', label: 'Pending', count: pending.length, active: 'bg-amber-500 text-white shadow-xl shadow-amber-500/20', inactive: 'bg-amber-50 text-amber-600 border border-amber-100/50' },
                                { key: 'APPROVED', label: 'Approved', count: approved.length, active: 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20', inactive: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' },
                                { key: 'REJECTED', label: 'Rejected', count: rejected.length, active: 'bg-rose-500 text-white shadow-xl shadow-rose-500/20', inactive: 'bg-rose-50 text-rose-600 border border-rose-100/50' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all
                                    ${activeTab === tab.key ? tab.active : tab.inactive + ' hover:bg-white opacity-70 hover:opacity-100'}`}
                                >
                                    {tab.label}
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Popup Body */}
                        <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                            {popupList.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <BarChart2 className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="font-black text-sm uppercase tracking-widest">No matching authorization records</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {popupList.map(req => (
                                        <div key={req.id} className="flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group">
                                            {/* Left: avatar + info */}
                                            <div className="flex items-center gap-8">
                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shrink-0 shadow-lg
                                                ${activeTab === 'PENDING' ? 'bg-amber-100 text-amber-600 shadow-amber-200/20' :
                                                        activeTab === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 shadow-emerald-200/20' :
                                                            'bg-rose-100 text-rose-600 shadow-rose-200/20'}`}>
                                                    {req.employee?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-xl leading-none mb-2 tracking-tighter group-hover:text-indigo-600 transition-colors">{req.employee?.name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                                                            {req.fromLocation} → {req.toLocation}
                                                        </p>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                                            {req.travelMode} &bull; {req.travelType}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Right: date + status badge */}
                                            <div className="text-right shrink-0 ml-8">
                                                <p className="text-base font-black text-slate-700 mb-1">
                                                    {new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                {req.returnDate && (
                                                    <p className="text-xs font-black text-emerald-500 mb-2">
                                                        RETRIEVAL: {new Date(req.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                )}
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border
                                                    ${activeTab === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            activeTab === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {req.status === 'SUBMITTED' ? 'Awaiting Review' : req.status}
                                                    </span>
                                                    {activeTab === 'REJECTED' && req.managerComments && (
                                                        <p className="text-[10px] font-black text-rose-400 max-w-[240px] italic">
                                                            &#8617; {req.managerComments}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ── Employee Trip Report Panel (employee only) ─────────────────────────────────
// Clicking a stat card navigates to /employee?filter=KEY and filters the
// "My Travel Registry" section on the dashboard page itself (no inline list).
const EmployeeTripReport = ({ userId }) => {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchRequests = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await api.get(`/requests/employee/${userId}`);
            setRequests(res.data || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchRequests();
    }, [open]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const pendingList = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'PENDING');
    const approvedList = requests.filter(r => r.status === 'APPROVED' || r.status === 'BOOKED');
    const rejectedList = requests.filter(r => r.status === 'REJECTED');
    const currentFilter = new URLSearchParams(location.search).get('filter');
    const total = requests.length;

    const stats = [
        { key: 'ALL', label: 'Total Applied', count: total, color: 'text-indigo-600', activeBg: 'bg-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', Icon: BarChart2 },
        { key: 'PENDING', label: 'Pending', count: pendingList.length, color: 'text-amber-600', activeBg: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', Icon: Clock },
        { key: 'APPROVED', label: 'Approved', count: approvedList.length, color: 'text-emerald-600', activeBg: 'bg-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', Icon: CheckCircle },
        { key: 'REJECTED', label: 'Rejected', count: rejectedList.length, color: 'text-rose-600', activeBg: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', Icon: XCircle },
    ];

    const handleCardClick = (key) => {
        const target = key === 'ALL' ? '/employee' : `/employee?filter=${key}`;
        navigate(target);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative z-50">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all duration-300
                    ${open
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 hover:shadow-md'}`}
            >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">My Report</span>
            </button>

            <div className={`absolute right-0 top-[calc(100%+0.75rem)] w-[360px] transition-all duration-300 origin-top-right
                ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'}`}
            >
                <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)] border border-slate-100/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">My Trip Report</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {loading ? 'Loading...' : `${total} trip${total !== 1 ? 's' : ''} \u2022 Tap a card to filter`}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <BarChart2 className="w-4 h-4 text-indigo-600" />
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-3">
                        {stats.map(({ key, label, count, color, bg, activeBg, border, dot, Icon }) => {
                            const isActive = currentFilter === key || (!currentFilter && key === 'ALL' && location.pathname === '/employee');
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleCardClick(key)}
                                    className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 w-full transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-95
                                        ${isActive ? `${activeBg} border-transparent shadow-lg` : `${bg} ${border} hover:shadow-sm`}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : bg}`}>
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : color}`} />
                                    </div>
                                    <p className={`text-3xl font-black leading-none ${isActive ? 'text-white' : color}`}>
                                        {loading ? '\u2013' : count}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/60' : dot}`}></div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest text-center leading-tight ${isActive ? 'text-white/90' : color}`}>{label}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-5 pb-4">
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Tap a card to filter My Travel Registry &darr;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Admin Stats Panel (admin only) ───────────────────────────────────────────
const AdminStats = () => {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState(false);
    const [activeTab, setActiveTab] = useState(null); // 'SENT' (Booked) | 'QUEUE' (Approved)
    const ref = useRef(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/requests');
            setRequests(res.data || []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchRequests();
    }, [open]);

    useEffect(() => {
        const handler = (e) => {
            if (!popup && ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [popup]);

    const sent = requests.filter(r => r.status === 'BOOKED');
    const queue = requests.filter(r => r.status === 'APPROVED');

    const openPopup = (key) => {
        setActiveTab(key);
        setPopup(true);
        setOpen(false);
    };
    const closePopup = () => { setPopup(false); setActiveTab(null); };

    const getList = (tab) => {
        const list = tab === 'SENT' ? sent : queue;
        // Date-wise sort (chronological)
        return [...list].sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
    };

    const stats = [
        { key: 'SENT', label: 'Tickets Sent', count: sent.length, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', Icon: CheckCircle, headerBg: 'bg-indigo-600' },
        { key: 'QUEUE', label: 'Pending for Ticket', count: queue.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', Icon: Clock, headerBg: 'bg-amber-500' },
    ];

    const popupList = getList(activeTab);
    const currentStat = stats.find(s => s.key === activeTab);

    return (
        <>
            <div ref={ref} className="relative z-50">
                <button
                    onClick={() => setOpen(o => !o)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all duration-300
                    ${open
                            ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-lg shadow-purple-500/20'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-600 hover:shadow-md'}`}
                >
                    <FileBarChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Report</span>
                </button>

                <div className={`absolute right-0 top-[calc(100%+0.75rem)] w-[360px] transition-all duration-300 origin-top-right
                ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'}`}
                >
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)] border border-slate-100/60 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">Admin Report</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {loading ? 'Loading...' : `${requests.length} itineraries intercepted`}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-3">
                            {stats.map(({ key, label, count, color, bg, border, dot, Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => openPopup(key)}
                                    className={`${bg} ${border} border rounded-2xl p-4 flex flex-col items-center gap-2 w-full transition-all duration-200 hover:scale-[1.05] hover:shadow-lg active:scale-95 cursor-pointer`}
                                >
                                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <p className={`text-3xl font-black ${color} leading-none`}>
                                        {loading ? '\u2013' : count}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${dot}`}></div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {popup && createPortal(
                <div
                    className="fixed inset-0 z-[10000000] grid place-items-center bg-black/80 backdrop-blur-md p-4"
                    onClick={closePopup}
                >
                    <div
                        className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300"
                        style={{ maxHeight: '85vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`px-10 py-8 flex items-center justify-between ${currentStat?.headerBg || 'bg-indigo-600'}`}>
                            <div>
                                <p className="text-white font-black text-2xl tracking-tighter">
                                    {activeTab === 'SENT' ? 'Success Registry' : 'Fulfillment Backlog'}
                                </p>
                                <p className="text-white/70 text-xs font-black uppercase tracking-[0.3em] mt-1">
                                    {popupList.length} Intercepted Nodes
                                </p>
                            </div>
                            <button onClick={closePopup} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/20 hover:bg-white/40 transition-all text-white font-black text-2xl">✕</button>
                        </div>

                        <div className="px-10 pt-8 flex gap-4">
                            {stats.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveTab(s.key)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all
                                    ${activeTab === s.key ? `${s.headerBg} text-white shadow-xl` : `${s.bg} ${s.color} border border-slate-100 opacity-70 hover:opacity-100`}`}
                                >
                                    {s.label}
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${activeTab === s.key ? 'bg-white/20 text-white' : 'bg-white text-slate-400'}`}>
                                        {s.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="overflow-y-auto mt-6" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                            {popupList.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <BarChart2 className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="font-black text-sm uppercase tracking-widest">No data available</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {popupList.map(req => (
                                        <div key={req.id} className="flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group">
                                            <div className="flex items-center gap-8">
                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shrink-0 shadow-lg ${activeTab === 'SENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {req.employee?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-xl leading-none mb-2 tracking-tighter">{req.employee?.name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{req.fromLocation} → {req.toLocation}</p>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{req.travelMode}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-8">
                                                <p className="text-base font-black text-slate-700 mb-1">{new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <span className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border ${activeTab === 'SENT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ── Notification Bell (employee only) ──────────────────────────────────────────
const NotificationBell = ({ userId }) => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('notif_read') || '[]'); } catch { return []; }
    });
    const [toastedIds, setToastedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('notif_toasted') || '[]'); } catch { return []; }
    });
    const ref = useRef(null);

    const markOneRead = (id) => {
        setReadIds(prev => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            localStorage.setItem('notif_read', JSON.stringify(updated));
            return updated;
        });
    };

    const buildNotifications = (requests) => {
        const notifs = [];
        requests.forEach(req => {
            if (req.status === 'APPROVED') {
                notifs.push({
                    id: `approved-${req.id}`,
                    type: 'approved',
                    icon: CheckCircle,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    title: 'Trip Approved by Manager',
                    body: `${req.fromLocation} \u2192 ${req.toLocation}`,
                });
            } else if (req.status === 'REJECTED') {
                notifs.push({
                    id: `rejected-${req.id}`,
                    type: 'rejected',
                    icon: XCircle,
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    border: 'border-rose-100',
                    title: 'Trip Rejected by Manager',
                    body: `${req.fromLocation} \u2192 ${req.toLocation}`,
                    reason: req.managerComments || null,
                });
            } else if (req.status === 'BOOKED') {
                notifs.push({
                    id: `booked-${req.id}`,
                    type: 'booked',
                    icon: Ticket,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-100',
                    title: 'Ticket Uploaded by Admin',
                    body: `${req.fromLocation} \u2192 ${req.toLocation}`,
                });
            }
        });
        return notifs;
    };

    useEffect(() => {
        if (!userId) return;
        const fetch = async () => {
            try {
                const res = await api.get(`/requests/employee/${userId}`);
                const notifs = buildNotifications(res.data);
                setNotifications(notifs);

                const currentToasted = JSON.parse(localStorage.getItem('notif_toasted') || '[]');
                const currentRead = JSON.parse(localStorage.getItem('notif_read') || '[]');
                const newToasted = [...currentToasted];
                let hasNew = false;

                notifs.forEach(n => {
                    if (!currentToasted.includes(n.id) && !currentRead.includes(n.id)) {
                        toast.custom((t) => (
                            <div 
                               onClick={() => { toast.dismiss(t.id); markOneRead(n.id); }}
                               className={`${t.visible ? 'animate-in slide-in-from-top-2' : 'animate-out slide-out-to-top-2'} cursor-pointer max-w-sm w-full bg-white shadow-2xl rounded-[1.5rem] pointer-events-auto flex items-start gap-4 p-5 border border-slate-100 hover:scale-[1.02] active:scale-95 transition-all outline outline-4 outline-indigo-50/50`}
                            >
                                <div className={`shrink-0 w-12 h-12 rounded-[1.2rem] ${n.bg} ${n.border} border-2 flex items-center justify-center`}>
                                    <n.icon className={`w-6 h-6 ${n.color}`} />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <p className="text-sm font-black text-slate-800 leading-tight mb-1">{n.title}</p>
                                    <p className="text-[11px] font-bold text-slate-500">{n.body}</p>
                                    {n.reason && (
                                         <p className="text-[10px] font-bold text-rose-500 mt-2 bg-rose-50/50 px-3 py-2 rounded-xl border border-rose-100/50 italic">
                                             \u201c{n.reason}\u201d
                                         </p>
                                    )}
                                </div>
                            </div>
                        ), { id: n.id, duration: 6000 });
                        
                        newToasted.push(n.id);
                        hasNew = true;
                    }
                });

                if (hasNew) {
                    setToastedIds(newToasted);
                    localStorage.setItem('notif_toasted', JSON.stringify(newToasted));
                }
            } catch { /* silent */ }
        };
        fetch();
        const interval = setInterval(fetch, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    // Click outside handler is intentionally removed as the portal backdrop handles it.

    const unread = notifications.filter(n => !readIds.includes(n.id));

    const markAllRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(allIds);
        localStorage.setItem('notif_read', JSON.stringify(allIds));
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setOpen(true)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-300
                    ${open ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-500/20' : 'border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md'}`}
            >
                <Bell className={`w-5 h-5 ${open ? 'text-indigo-600' : 'text-slate-500'} transition-colors`} />
                {unread.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-bounce">
                        {unread.length > 9 ? '9+' : unread.length}
                    </span>
                )}
            </button>

            {open && createPortal(
                <div
                    className="fixed inset-0 z-[10000000] grid place-items-center bg-black/80 backdrop-blur-md p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300"
                        style={{ maxHeight: '85vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-10 py-8 flex items-center justify-between bg-indigo-600">
                            <div>
                                <p className="text-white font-black text-2xl tracking-tighter">
                                    Travel Notifications
                                </p>
                                <p className="text-white/70 text-xs font-black uppercase tracking-[0.3em] mt-1">
                                    {unread.length} Pending Alert{unread.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {unread.length > 0 && (
                                    <button onClick={markAllRead} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/10 hover:bg-white/20 transition-all text-white font-black text-2xl"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto mt-2 pb-6" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                            {unread.length === 0 ? (
                                <div className="py-32 flex flex-col items-center gap-6 text-slate-400">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <Bell className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <p className="font-black text-sm uppercase tracking-widest">No unread notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100/60">
                                    {unread.map(notif => {
                                        const Icon = notif.icon;
                                        return (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => markOneRead(notif.id)}
                                                className="flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shrink-0 shadow-lg ${notif.bg} ${notif.color}`}>
                                                        <Icon className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <p className="font-black text-slate-900 text-xl leading-none tracking-tighter group-hover:text-indigo-600 transition-colors">
                                                                {notif.title}
                                                            </p>
                                                            <span className="shrink-0 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-sm shadow-indigo-500/50"></span>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                                            {notif.body}
                                                        </p>
                                                        {notif.reason && (
                                                            <p className="text-xs font-bold text-rose-500 mt-3 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 italic inline-block shadow-sm">
                                                                \u201c{notif.reason}\u201d
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:bg-indigo-100 hover:border-indigo-200 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer">
                                                        Mark Read
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// ── Profile Dropdown ────────────────────────────────────────────────────────────
const ProfileDropdown = ({ user, onLogout }) => {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    const colors = roleColors[user.role] || roleColors.ROLE_EMPLOYEE;
    const roleName = user.role?.replace('ROLE_', '') || 'USER';

    const handleMouseEnter = () => {
        clearTimeout(timeoutRef.current);
        setOpen(true);
    };
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    };

    return (
        <div
            className="relative z-50 ml-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={`flex items-center justify-center w-12 h-12 rounded-full border-[3px] transition-all duration-500
                    ${open
                        ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105'
                        : 'border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:scale-105 bg-white'
                    }`}
            >
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center shrink-0 shadow-inner`}>
                    <span className="text-white font-black text-sm tracking-wider">{getInitials(user.name)}</span>
                </div>
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </button>

            <div className={`absolute right-0 top-[calc(100%+0.75rem)] w-[340px] transition-all duration-400 origin-top-right
                ${open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}
            >
                <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.6)] border border-slate-100/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-slate-50 to-transparent"></div>
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute top-10 -left-10 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative px-8 pt-10 pb-6 flex flex-col items-center text-center">
                        <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-5 shadow-2xl shadow-indigo-900/20 ring-4 ring-white relative group overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="text-white font-black text-3xl group-hover:scale-110 transition-transform duration-500">{getInitials(user.name)}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{user.name}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1.5 mb-4">{user.email || 'Valid Authentication Token'}</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${colors.badge} border-current/20 bg-opacity-10`}>
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{roleName}</span>
                        </div>
                    </div>

                    <div className="px-6 pb-6 relative z-10">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>
                        <button
                            onClick={onLogout}
                            className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 p-[1px] hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-rose-500/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]"></div>
                            <div className="relative flex items-center justify-center gap-3 w-full bg-slate-900 px-4 py-4 rounded-[15px] group-hover:bg-slate-900/90 transition-all duration-300">
                                <LogOut className="h-5 w-5 text-rose-400 group-hover:text-rose-300 transition-colors transform group-hover:-translate-x-1" />
                                <span className="text-sm font-black text-white uppercase tracking-widest">End Session</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Navbar ─────────────────────────────────────────────────────────────────
const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-white/40 shadow-sm h-20">
            <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-4 group">
                    <div className="mmt-gradient p-3 rounded-2xl group-hover:rotate-[15deg] transition-all duration-500 shadow-xl shadow-indigo-500/30">
                        <Plane className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
                            Travel<span className="text-[#6366f1]">Request</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">

                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-2 md:gap-6">
                    {user ? (
                        <>
                            <div className="hidden md:flex items-center gap-2 md:gap-6">
                                {user.role === 'ROLE_ADMIN' && (
                                    <Link
                                        to="/admin/users"
                                        className={`nav-link ${isActive('/admin/users') ? 'nav-link-active' : ''}`}
                                    >
                                        <User className="h-5 w-5" />
                                        <span>Team Roster</span>
                                    </Link>
                                )}

                                {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                                    <div className="hidden lg:flex items-center gap-2">
                                        <Link
                                            to="/reports"
                                            className={`nav-link ${isActive('/reports') ? 'nav-link-active' : ''}`}
                                        >
                                            <FileBarChart className="h-5 w-5" />
                                            <span>Insights</span>
                                        </Link>
                                    </div>
                                )}

                                <div className="h-10 w-px bg-slate-100 hidden sm:block" />
                            </div>

                            <button
                                className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
                            </button>

                            {user.role === 'ROLE_MANAGER' && <ManagerStats />}

                            {user.role === 'ROLE_ADMIN' && <AdminStats />}

                            {user.role === 'ROLE_EMPLOYEE' && <EmployeeTripReport userId={user.id} />}

                            {user.role === 'ROLE_EMPLOYEE' && <NotificationBell userId={user.id} />}

                            <ProfileDropdown user={user} onLogout={handleLogout} />
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="px-6 py-3 text-slate-600 hover:text-[#6366f1] font-black transition-all text-sm uppercase tracking-widest">
                                Sign In
                            </Link>
                            <Link to="/register" className="mmt-gradient px-8 py-3.5 text-white font-black rounded-2xl text-sm shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {user && (
                <div className={`md:hidden fixed top-20 left-0 right-0 bg-white border-b border-slate-100 shadow-lg z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                    <div className="px-4 py-6 space-y-4">
                        {user.role === 'ROLE_ADMIN' && (
                            <Link
                                to="/admin/users"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-[#6366f1] font-black tracking-wider transition-all hover:bg-indigo-50/50 ${isActive('/admin/users') ? 'text-[#6366f1] bg-indigo-50 shadow-inner' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User className="h-5 w-5" />
                                <span>Team Roster</span>
                            </Link>
                        )}
                        {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                            <Link
                                to="/reports"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-[#6366f1] font-black tracking-wider transition-all hover:bg-indigo-50/50 ${isActive('/reports') ? 'text-[#6366f1] bg-indigo-50 shadow-inner' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FileBarChart className="h-5 w-5" />
                                <span>Insights</span>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
