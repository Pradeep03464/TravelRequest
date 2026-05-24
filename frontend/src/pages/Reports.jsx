import { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    IndianRupee, 
    Users, 
    PlaneTakeoff, 
    TrendingUp, 
    Calendar as CalIcon, 
    FileText, 
    Download, 
    Filter, 
    ChevronRight, 
    MapPin,
    ArrowRight,
    Zap,
    History
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('month');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterQuarter, setFilterQuarter] = useState('Q1');
    const [fromMonth, setFromMonth] = useState('');
    const [toMonth, setToMonth] = useState('');
    const [expandedChart, setExpandedChart] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                const res = await api.get('/requests');
                setRequests(res.data);
            } catch (error) {
                console.error('Failed to fetch requests', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const bookedRequests = requests.filter(r => r.status === 'BOOKED');

    const filteredRequests = bookedRequests.filter(req => {
        const reqMonth = req.departureDate.substring(0, 7);
        const reqYearStr = req.departureDate.substring(0, 4);
        const monthNum = parseInt(req.departureDate.substring(5, 7), 10);

        if (filterType === 'month') {
            if (!filterMonth) return true;
            return reqMonth === filterMonth;
        } else if (filterType === 'quarter') {
            if (!filterYear || !filterQuarter) return true;
            if (reqYearStr !== filterYear) return false;
            if (filterQuarter === 'Q1') return monthNum >= 1 && monthNum <= 3;
            if (filterQuarter === 'Q2') return monthNum >= 4 && monthNum <= 6;
            if (filterQuarter === 'Q3') return monthNum >= 7 && monthNum <= 9;
            if (filterQuarter === 'Q4') return monthNum >= 10 && monthNum <= 12;
            return true;
        } else if (filterType === 'range') {
            if (!fromMonth || !toMonth) return true;
            return reqMonth >= fromMonth && reqMonth <= toMonth;
        } else {
            if (!filterYear) return true;
            return reqYearStr === filterYear;
        }
    });

    const handleExport = () => {
        if (filteredRequests.length === 0) return;
        
        const periodLabel = filterType === 'month'
            ? (filterMonth ? new Date(filterMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'All Months')
            : (filterType === 'range'
                ? `${new Date(fromMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} to ${new Date(toMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                : (filterType === 'quarter' ? `${filterQuarter} ${filterYear}` : `Full Year ${filterYear}`));

        // Title row (merged info)
        const titleRow = [`TRAVEL REQUEST - FINANCIAL LEDGER REPORT (${periodLabel})`, '', '', '', '', '', '', '', ''];

        // Headers
        const headers = [
            'Employee ID',
            'Employee Name',
            'From (City)',
            'To (City)',
            'Departure Date',
            'Return Date',
            'Travel Mode',
            'Trip Type',
            'Amount (INR)'
        ];

        // Data rows
        const rows = filteredRequests.map((req, idx) => [
            req.employee?.id ?? 'N/A',
            req.employee?.name ?? 'N/A',
            req.fromLocation ?? 'N/A',
            req.toLocation ?? 'N/A',
            req.departureDate ? new Date(req.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            req.returnDate ? new Date(req.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            req.travelMode ?? 'N/A',
            req.tripType === 'round-trip' ? 'Round Trip' : 'One Way',
            req.cost ?? 0
        ]);

        // Total row
        const totalRow = ['', '', '', '', '', '', '', 'TOTAL', totalCost];

        // Assemble worksheet data
        const wsData = [titleRow, headers, ...rows, [], totalRow];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [
            { wch: 14 },  // Employee ID
            { wch: 22 },  // Employee Name
            { wch: 30 },  // From
            { wch: 30 },  // To
            { wch: 18 },  // Departure Date
            { wch: 18 },  // Return Date
            { wch: 14 },  // Travel Mode
            { wch: 13 },  // Trip Type
            { wch: 18 },  // Amount
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Financial Ledger');

        const filename = `Financial_Ledger_${filterType === 'month' ? (filterMonth || 'all') : (filterType === 'range' ? `${fromMonth}_to_${toMonth}` : filterYear)}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const totalCost = filteredRequests.reduce((sum, req) => sum + (req.cost || 0), 0);
    const totalEmployeesTraveled = new Set(filteredRequests.map(r => r.employee?.id)).size;
    const totalTrips = filteredRequests.length;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

    const expenditureByMode = {};
    filteredRequests.forEach(req => {
        const mode = req.travelMode || 'Unknown';
        expenditureByMode[mode] = (expenditureByMode[mode] || 0) + (req.cost || 0);
    });
    const pieDataExpenditure = Object.keys(expenditureByMode).map(key => ({ name: key, value: expenditureByMode[key] })).filter(x => x.value > 0);

    const tripsByTraveler = {};
    filteredRequests.forEach(req => {
        const name = req.employee?.name || 'Unknown User';
        tripsByTraveler[name] = (tripsByTraveler[name] || 0) + 1;
    });
    const sortedTravelers = Object.entries(tripsByTraveler).sort((a,b) => b[1] - a[1]);
    const topTravelers = sortedTravelers.slice(0, 4);
    const others = sortedTravelers.slice(4).reduce((sum, curr) => sum + curr[1], 0);
    const pieDataTravelers = topTravelers.map(([name, value]) => ({ name, value }));
    if (others > 0) pieDataTravelers.push({ name: 'Others', value: others });

    const operationsByType = {};
    filteredRequests.forEach(req => {
        const type = req.tripType === 'round-trip' ? 'Round Trip' : 'One Way';
        operationsByType[type] = (operationsByType[type] || 0) + 1;
    });
    const pieDataOperations = Object.keys(operationsByType).map(key => ({ name: key, value: operationsByType[key] })).filter(x => x.value > 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payload[0].name}</p>
                    <p className="text-indigo-600 font-black text-lg tracking-tight block">{payload[0].value.toLocaleString('en-IN')}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="pb-20 space-y-12">
            {/* Header / Hero */}
            <div className="hero-bg px-8 py-24 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <TrendingUp className="w-96 h-96 -rotate-12 fill-white" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="bg-white/20 backdrop-blur-xl p-2.5 rounded-2xl">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Intelligence & Analytics</span>
                        </motion.div>
                        <h1 className="text-7xl font-black tracking-tighter mb-6 leading-[0.9] text-white drop-shadow-2xl">
                            Financial <br /><span className="text-white/60">Overview.</span>
                        </h1>
                        <p className="text-xl text-indigo-50 font-medium opacity-90 leading-relaxed border-l-4 border-indigo-400 pl-8">
                            Strategic expenditure tracking and company-wide logistics trends. Maintain complete oversight of your corporate mobility footprint.
                        </p>
                    </div>

                    <div className="bg-white/15 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 min-w-[350px] shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <CalIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Reporting Node</p>
                                <p className="text-white font-bold text-sm tracking-tight">Active Period Selection</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mb-6">
                            <button onClick={() => setFilterType('month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'month' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                Month
                            </button>
                            <button onClick={() => setFilterType('quarter')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'quarter' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                Quarter
                            </button>
                            <button onClick={() => setFilterType('range')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'range' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                Range
                            </button>
                            <button onClick={() => setFilterType('year')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'year' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                Year
                            </button>
                        </div>
                        {filterType === 'month' ? (
                            <input type="month" className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-2xl cursor-pointer w-full focus:bg-white/20 transition-all" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                        ) : filterType === 'quarter' ? (
                            <div className="space-y-4">
                                <select className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-xl cursor-pointer w-full focus:bg-white/20 transition-all appearance-none" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                                </select>
                                <select className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-xl cursor-pointer w-full focus:bg-white/20 transition-all appearance-none" value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)}>
                                    <option value="Q1" className="text-slate-900">Q1 (Jan - Mar)</option>
                                    <option value="Q2" className="text-slate-900">Q2 (Apr - Jun)</option>
                                    <option value="Q3" className="text-slate-900">Q3 (Jul - Sep)</option>
                                    <option value="Q4" className="text-slate-900">Q4 (Oct - Dec)</option>
                                </select>
                            </div>
                        ) : filterType === 'range' ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 ml-2">From</p>
                                    <input type="month" className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-lg cursor-pointer w-full focus:bg-white/20 transition-all" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 ml-2">To</p>
                                    <input type="month" className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-lg cursor-pointer w-full focus:bg-white/20 transition-all" value={toMonth} onChange={(e) => setToMonth(e.target.value)} />
                                </div>
                            </div>
                        ) : (
                            <select className="bg-white/10 text-white border border-white/20 px-6 py-4 rounded-2xl outline-none font-black text-2xl cursor-pointer w-full focus:bg-white/20 transition-all appearance-none" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                            </select>
                        )}

                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Syncing Analytics...</p>
                </div>
            ) : (
                <div className="container mx-auto px-4">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {/* Card 1: Expenditure Pie Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => pieDataExpenditure.length > 0 && setExpandedChart('expenditure')} className="mmt-card p-8 group hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-full bg-white shadow-xl shadow-indigo-900/5 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        <IndianRupee className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Expenditure</p>
                                        <p className="font-bold text-xs text-slate-500">by Travel Mode</p>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">₹ {totalCost.toLocaleString('en-IN', { notation: "compact", maximumFractionDigits: 1 })}</h2>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                {pieDataExpenditure.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={pieDataExpenditure} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {pieDataExpenditure.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No Data</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Card 2: Unique Travelers Pie Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onClick={() => pieDataTravelers.length > 0 && setExpandedChart('travelers')} className="mmt-card p-8 group hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-full bg-white shadow-xl shadow-orange-900/5 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                                        <Users className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unique Travelers</p>
                                        <p className="font-bold text-xs text-slate-500">Top 5 by Volume</p>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{totalEmployeesTraveled} <span className="text-sm text-slate-400">Pax</span></h2>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                {pieDataTravelers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={pieDataTravelers} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {pieDataTravelers.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No Data</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Card 3: Total Operations Pie Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={() => pieDataOperations.length > 0 && setExpandedChart('operations')} className="mmt-card p-8 group hover:-translate-y-2 transition-all duration-500 relative flex flex-col h-full bg-white shadow-xl shadow-emerald-900/5 cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <PlaneTakeoff className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Operations</p>
                                        <p className="font-bold text-xs text-slate-500">by Trip Iteration</p>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{totalTrips} <span className="text-sm text-slate-400">Trips</span></h2>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                                {pieDataOperations.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={pieDataOperations} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {pieDataOperations.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '10px' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No Data</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Records Section */}
                    <div className="mmt-card p-0 shadow-2xl shadow-indigo-500/10 bg-white overflow-hidden group border-4 border-white">
                        <div className="px-12 py-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                    <div className="w-2.5 h-10 bg-indigo-600 rounded-full"></div>
                                    Financial Ledger
                                </h3>
                                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Enterprise Fulfillment breakdown</p>
                            </div>
                            <button 
                                onClick={handleExport}
                                className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl hover:shadow-indigo-500/30 active:scale-95"
                            >
                                <Download className="w-5 h-5" /> Export Intelligence
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <th className="px-12 py-8">Traveler Node</th>
                                        <th className="px-8 py-8 text-center">Itinerary Stream</th>
                                        <th className="px-8 py-8 text-center text-indigo-600">Mode / Type</th>
                                        <th className="px-12 py-8 text-right">Settlement Amt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-12 py-40 text-center">
                                                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white">
                                                    <FileText className="w-12 h-12 text-indigo-200" />
                                                </div>
                                                <h4 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Zero Records Found</h4>
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verify reporting period analytics.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((req, idx) => (
                                            <motion.tr 
                                                key={req.id}
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                className="hover:bg-indigo-50/40 transition-all duration-300 group/row"
                                            >
                                                <td className="px-12 py-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm group-hover/row:scale-110 group-hover/row:rotate-3 transition-all">
                                                            {req.employee?.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-lg tracking-tighter group-hover/row:text-indigo-600 transition-colors leading-none mb-1.5">{req.employee?.name}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID: {req.employee?.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                                            <span className="font-black text-slate-800 tracking-tight">{req.fromLocation}</span>
                                                            <div className="flex flex-col items-center">
                                                                <ChevronRight className="w-3.5 h-3.5 text-indigo-300" />
                                                                <div className="h-px w-6 bg-indigo-100 -mt-2"></div>
                                                            </div>
                                                            <span className="font-black text-indigo-600 tracking-tight">{req.toLocation}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                            <CalIcon className="w-3.5 h-3.5" /> 
                                                            {new Date(req.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{req.travelMode}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{req.tripType}</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                                            ₹ {req.cost?.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                        </p>
                                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Status: Liquidated</p>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white">
                                    <tr className="font-black">
                                        <td colSpan="3" className="px-12 py-8 text-lg tracking-widest uppercase">Total Corporate Expenditure</td>
                                        <td className="px-12 py-8 text-right text-3xl tracking-tighter">
                                            ₹ {totalCost.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {expandedChart && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4" onClick={() => setExpandedChart(null)}>
                    <div className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl p-12 transition-all animate-in zoom-in duration-300 flex flex-col md:flex-row gap-12 items-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setExpandedChart(null)}
                            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 font-black text-xl z-50"
                        >✕</button>
                        
                        <div className="flex-1 w-full">
                            <div className="mb-10 text-center">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
                                    {expandedChart === 'expenditure' && 'Gross Expenditure'}
                                    {expandedChart === 'travelers' && 'Unique Travelers'}
                                    {expandedChart === 'operations' && 'Total Operations'}
                                </h2>
                                <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm">Detailed Visual Analysis</p>
                            </div>
                            
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={
                                                expandedChart === 'expenditure' ? pieDataExpenditure : 
                                                expandedChart === 'travelers' ? pieDataTravelers : 
                                                pieDataOperations
                                            } 
                                            innerRadius={110} 
                                            outerRadius={160} 
                                            paddingAngle={4} 
                                            dataKey="value" 
                                            stroke="none"
                                        >
                                            {(expandedChart === 'expenditure' ? pieDataExpenditure : expandedChart === 'travelers' ? pieDataTravelers : pieDataOperations).map((entry, index) => {
                                                let colorIdx = index;
                                                if (expandedChart === 'travelers') colorIdx = index + 1;
                                                if (expandedChart === 'operations') colorIdx = index + 2;
                                                return <Cell key={`cell-${index}`} fill={COLORS[colorIdx % COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '20px' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="w-full md:w-[400px] flex flex-col h-[520px]">
                            <div className="bg-slate-50/80 rounded-[2.5rem] p-8 h-full flex flex-col border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center bg-white py-3 rounded-xl shadow-sm">Data Breakdowns</h3>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {(expandedChart === 'expenditure' ? pieDataExpenditure : expandedChart === 'travelers' ? pieDataTravelers : pieDataOperations).map((item, idx) => {
                                        let colorIdx = idx;
                                        if (expandedChart === 'travelers') colorIdx = idx + 1;
                                        if (expandedChart === 'operations') colorIdx = idx + 2;
                                        const itemColor = COLORS[colorIdx % COLORS.length];

                                        return (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100/50 hover:shadow-md hover:-translate-y-1 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: itemColor }}></div>
                                                    <p className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{item.name}</p>
                                                </div>
                                                <p className="font-black text-indigo-600 tracking-tighter text-lg whitespace-nowrap">
                                                    {expandedChart === 'expenditure' ? `₹ ${item.value.toLocaleString('en-IN')}` : item.value.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Reports;
