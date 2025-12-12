import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, replyToTicket, updateTicketStatus } from '../../api/support/supportService';
import { getActiveUser } from '../../api/authservices/authservice';
import { ArrowLeft, Send, Paperclip, FileText, CheckCircle, Clock, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyPreviews, setReplyPreviews] = useState([]);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    const user = getActiveUser();
    const isAdmin = ['admin', 'super-admin'].includes(user?.role);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    useEffect(() => {
        // Scroll to bottom when replies update
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ticket?.replies]);

    const fetchTicket = async () => {
        try {
            const data = await getTicketById(id);
            setTicket(data);
        } catch (error) {
            toast.error("Failed to load ticket");
            navigate('..');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + replyFiles.length > 3) {
            toast.error("Max 3 images allowed");
            return;
        }

        setReplyFiles([...replyFiles, ...selectedFiles]);
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setReplyPreviews([...replyPreviews, ...newPreviews]);
    };

    const removeFile = (index) => {
        const newFiles = [...replyFiles];
        const newPreviews = [...replyPreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setReplyFiles(newFiles);
        setReplyPreviews(newPreviews);
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() && replyFiles.length === 0) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append('message', replyMessage);
            replyFiles.forEach(file => formData.append('attachments', file));

            const res = await replyToTicket(id, formData);
            if (res.success) {
                setTicket(res.data);
                setReplyMessage("");
                setReplyFiles([]);
                setReplyPreviews([]);
                toast.success("Reply sent");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const changeStatus = async (newStatus) => {
        try {
            const res = await updateTicketStatus(id, newStatus);
            if (res.success) {
                setTicket({ ...ticket, status: newStatus });
                toast.success(`Ticket marked as ${newStatus}`);
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!ticket) return null;

    const StatusBadge = ({ status }) => {
        const styles = {
            open: "bg-orange-100 text-orange-600",
            "in-progress": "bg-blue-100 text-blue-600",
            resolved: "bg-green-100 text-green-600"
        };
        const icons = {
            open: AlertCircle,
            "in-progress": Clock,
            resolved: CheckCircle
        };
        const Icon = icons[status] || AlertCircle;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${styles[status]}`}>
                <Icon size={14} />
                {status.toUpperCase().replace('-', ' ')}
            </span>
        );
    };

    return (
        <div className="h-full bg-[var(--bg-color)] md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-[var(--secondary-color)] hover:text-[var(--text-color)] transition-colors w-fit"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </button>

                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <div className="flex gap-2">
                                    {ticket.status !== 'resolved' && (
                                        <button
                                            onClick={() => changeStatus('resolved')}
                                            className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                    {ticket.status === 'resolved' && (
                                        <button
                                            onClick={() => changeStatus('in-progress')}
                                            className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                                        >
                                            Re-open
                                        </button>
                                    )}
                                </div>
                            )}
                            <StatusBadge status={ticket.status} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">{ticket.subject}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--secondary-color)] pb-4 border-b border-[var(--border-color)]">
                        <span className="flex items-center gap-1.5">
                            <span className="font-medium text-[var(--text-color)]">ID:</span> #{ticket._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-color)]"></span>
                        <span className="flex items-center gap-1.5">
                            <span className="font-medium text-[var(--text-color)]">Type:</span> {ticket.type}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-color)]"></span>
                        <span className="flex items-center gap-1.5">
                            <span className="font-medium text-[var(--text-color)]">Date:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                                {ticket.userId?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-color)]">{ticket.userId?.name} <span className="text-xs text-[var(--secondary-color)] font-normal">({ticket.userId?.role})</span></p>
                            </div>
                        </div>
                        <p className="text-[var(--text-color)] leading-relaxed whitespace-pre-wrap pl-11">{ticket.message}</p>

                        {/* Attachments */}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="mt-4 pl-11 flex gap-3 flex-wrap">
                                {ticket.attachments.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-[var(--border-color)] hover:opacity-80 transition-opacity">
                                        <img src={img} alt="attachment" className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Replies Thread */}
                <div className="space-y-6">
                    {ticket.replies.map((reply, idx) => (
                        <div
                            key={idx}
                            ref={idx === ticket.replies.length - 1 ? scrollRef : null}
                            className={`flex gap-4 ${reply.senderId?._id === user?.id ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${reply.role === 'admin' || reply.role === 'super-admin'
                                    ? 'bg-purple-500/10 text-purple-500'
                                    : 'bg-blue-500/10 text-blue-500'
                                }`}
                            >
                                {reply.name?.charAt(0) || 'A'}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl p-5 border ${reply.senderId?._id === user?.id
                                ? 'bg-blue-500/5 border-blue-500/20 rounded-tr-none'
                                : reply.role === 'admin' || reply.role === 'super-admin'
                                    ? 'bg-purple-500/5 border-purple-500/20 rounded-tl-none'
                                    : 'bg-[var(--card-bg)] border-[var(--border-color)] rounded-tl-none'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold ${reply.role === 'admin' || reply.role === 'super-admin' ? 'text-purple-500' : 'text-[var(--text-color)]'
                                        }`}>
                                        {reply.name}
                                        {['admin', 'super-admin'].includes(reply.role) && <span className="ml-1 px-1.5 py-0.5 bg-purple-500/10 rounded text-[10px]">STAFF</span>}
                                    </span>
                                    <span className="text-xs text-[var(--secondary-color)]">
                                        {new Date(reply.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <p className="text-sm text-[var(--text-color)] whitespace-pre-wrap">{reply.message}</p>

                                {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        {reply.attachments.map((img, i) => (
                                            <a key={i} href={img} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-color)] hover:opacity-80 transition-opacity">
                                                <img src={img} alt="reply-attachment" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Input */}
                {ticket.status !== 'resolved' ? (
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 shadow-sm sticky bottom-4">

                        {/* Selected Files Preview */}
                        {replyPreviews.length > 0 && (
                            <div className="flex gap-2 mb-3 px-2">
                                {replyPreviews.map((src, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-color)] group">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-0 right-0 p-0.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleReply} className="flex gap-2 items-end">
                            <label className="p-3 text-[var(--secondary-color)] hover:text-[var(--text-color)] cursor-pointer rounded-xl hover:bg-[var(--bg-color)] transition-colors">
                                <Paperclip size={20} />
                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>

                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 bg-[var(--bg-color)] border-0 rounded-xl p-3 text-[var(--text-color)] focus:ring-2 focus:ring-blue-500/20 focus:bg-[var(--card-bg)] transition-all resize-none max-h-32 min-h-[48px]"
                                rows={1}
                                style={{
                                    minHeight: '48px',
                                    height: 'auto'
                                }}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />

                            <button
                                type="submit"
                                disabled={sending || (!replyMessage.trim() && replyFiles.length === 0)}
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-[var(--card-bg)] rounded-xl p-4 text-center border border-[var(--border-color)]">
                        <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2 max-[600px]:h-6 max-[600px]:w-6" />
                        <h3 className="text-[var(--text-color)] font-medium mb-1 max-[600px]:text-sm">Ticket Resolved</h3>
                        <p className="text-[var(--secondary-color)] text-sm mb-3">
                            This ticket has been marked as resolved.
                            {!isAdmin && " If you have a further issue, please create a new ticket."}
                        </p>
                        {isAdmin && (
                            <button onClick={() => changeStatus('in-progress')} className="text-blue-500 font-medium text-sm hover:underline">
                                Reply to re-open
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetail;
