import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../../api/support/supportService';
import { getSupportRequests } from '../../api/admin/adminServices';
import { getActiveUser } from '../../api/authservices/authservice';
import { MessageSquare, Plus, Search, Filter, Headphones } from 'lucide-react';

const SupportDashboard = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('unresolved'); // 'unresolved' | 'resolved' | 'feedback'

    const user = getActiveUser();
    const isAdmin = ['admin', 'super-admin'].includes(user?.role);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = isAdmin ? await getSupportRequests() : await getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Admin View Logic ---
    if (isAdmin) {
        return (
            <div className="h-full bg-[var(--bg-color)] md:p-8 w-full overflow-x-hidden">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-color)] mb-1 max-[600px]:text-lg">User Support & Feedback</h1>
                            <p className="text-[var(--secondary-color)] text-sm max-[600px]:text-sm">Manage all support requests</p>
                        </div>
                    </div>

                    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden w-full max-w-full">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-color)]">
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)]">User</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)] hidden md:table-cell">Role</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)]">Subject</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)] hidden lg:table-cell">Type</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)] hidden sm:table-cell">Status</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)] hidden lg:table-cell">Date</th>
                                        <th className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--secondary-color)]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-[var(--text-color)]">Loading...</td></tr>
                                    ) : tickets.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-[var(--secondary-color)]">No support requests found</td></tr>
                                    ) : (
                                        tickets.map((req) => (
                                            <tr key={req._id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-color)] transition-colors">
                                                <td className="py-4 px-3 md:px-6 text-sm max-w-[140px]">
                                                    <p className="font-medium text-[var(--text-color)] truncate">{req.name}</p>
                                                    <p className="text-xs text-[var(--secondary-color)] truncate">{req.email}</p>
                                                </td>
                                                <td className="py-4 px-3 md:px-6 text-sm capitalize font-medium text-[var(--text-color)] hidden md:table-cell">
                                                    {req.role}
                                                </td>
                                                <td className="py-4 px-3 md:px-6 text-sm font-medium text-[var(--text-color)] max-w-[120px] truncate">{req.subject}</td>
                                                <td className="py-4 px-3 md:px-6 text-sm hidden lg:table-cell">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                                      ${req.type === 'bug' ? 'bg-red-500/10 text-red-500' :
                                                            req.type === 'complaint' ? 'bg-orange-500/10 text-orange-500' :
                                                                'bg-blue-500/10 text-blue-500'}`}>
                                                        {req.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 md:px-6 text-sm hidden sm:table-cell">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                                      ${req.status === 'open' ? 'bg-orange-500/10 text-orange-500' :
                                                            req.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                                                                'bg-green-500/10 text-green-500'}`}>
                                                        {req.status?.toUpperCase().replace('-', ' ') || 'OPEN'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 md:px-6 text-sm text-[var(--secondary-color)] hidden lg:table-cell">
                                                    <div>{new Date(req.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs opacity-75">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="py-4 px-3 md:px-6 text-sm">
                                                    <button
                                                        onClick={() => navigate(`ticket/${req._id}`)}
                                                        className="text-blue-500 hover:text-blue-600 font-medium text-xs px-3 py-1.5 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- User View Logic (Existing) ---
    const unresolvedTickets = tickets.filter(t => t.status !== 'resolved' && t.type !== 'feedback');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' && t.type !== 'feedback');
    const feedbackTickets = tickets.filter(t => t.type === 'feedback');

    const currentList = activeTab === 'unresolved' ? unresolvedTickets
        : activeTab === 'resolved' ? resolvedTickets
            : feedbackTickets;

    return (
        <div className="h-full bg-[var(--bg-color)] md:p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-color)] mb-1 max-sm:text-[15px]">Support Tickets</h1>
                        <p className="text-[var(--secondary-color)] text-sm">Manage and track your support requests</p>
                    </div>
                    <button
                        onClick={() => navigate('create')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 max-sm:text-[12px] max-sm:px-2"
                    >
                        <Plus size={20} />
                        Create Ticket
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('unresolved')}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'unresolved'
                            ? 'bg-[var(--card-bg)] text-blue-500 shadow-sm border border-[var(--border-color)]'
                            : 'text-[var(--secondary-color)] hover:bg-[var(--card-bg)]'
                            }`}
                    >
                        Unresolved
                    </button>
                    <button
                        onClick={() => setActiveTab('resolved')}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'resolved'
                            ? 'bg-[var(--card-bg)] text-green-500 shadow-sm border border-[var(--border-color)]'
                            : 'text-[var(--secondary-color)] hover:bg-[var(--card-bg)]'
                            }`}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'feedback'
                            ? 'bg-[var(--card-bg)] text-purple-500 shadow-sm border border-[var(--border-color)]'
                            : 'text-[var(--secondary-color)] hover:bg-[var(--card-bg)]'
                            }`}
                    >
                        Feedback
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-12 text-center">
                        <div className="w-20 h-20 bg-[var(--bg-color)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Headphones className="w-10 h-10 text-[var(--secondary-color)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-2">No tickets found</h3>
                        <p className="text-[var(--secondary-color)] mb-6">
                            Looks like you have not raised any tickets yet in this category.
                        </p>
                        {activeTab === 'unresolved' && (
                            <button
                                onClick={() => navigate('create')}
                                className="text-blue-500 font-medium hover:underline"
                            >
                                Raise a ticket
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentList.map((ticket) => (
                            <div
                                key={ticket._id}
                                onClick={() => navigate('ticket/' + ticket._id)}
                                className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-color)] hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-[var(--text-color)] group-hover:text-blue-500 transition-colors line-clamp-1">
                                        {ticket.subject}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-orange-500/10 text-orange-500' :
                                        ticket.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-green-500/10 text-green-500'
                                        }`}>
                                        {ticket.status.toUpperCase().replace('-', ' ')}
                                    </span>
                                </div>

                                <p className="text-[var(--secondary-color)] text-sm mb-4 line-clamp-2">
                                    {ticket.message}
                                </p>

                                <div className="flex items-center text-xs text-[var(--secondary-color)] gap-4 border-t border-[var(--border-color)] pt-3">
                                    <span className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${ticket.type === 'bug' ? 'bg-red-500' : 'bg-blue-500'
                                            }`}></div>
                                        {ticket.type}
                                    </span>
                                    <span>#{ticket._id.slice(-6).toUpperCase()}</span>
                                    <span className="ml-auto">
                                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportDashboard;
