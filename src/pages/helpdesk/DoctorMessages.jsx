import React, { useState, useEffect, useRef } from "react";
import { API, getActiveUser, BASE_URL } from "../../api/authservices/authservice";
import io from "socket.io-client";
import { FaUserMd, FaSearch, FaArrowLeft, FaTrash, FaReply, FaCheck, FaTimes, FaEllipsisV, FaCheckDouble, FaPen, FaCopy, FaCheckCircle, FaEdit, FaPaperPlane } from "react-icons/fa";
import { useSearchParams, useOutletContext } from "react-router-dom";
import ConfirmationModal from "../../components/CofirmationModel";
import { getInitials, getColor } from "../../utils/avatarUtils";

const ENDPOINT = BASE_URL;

export default function DoctorMessages() {
    const { setNavbarConfig } = useOutletContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat");
    const user = getActiveUser();

    // State
    const [conversations, setConversations] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Chat Features
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
        action: null
    });

    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const longPressTimer = useRef(null);
    const inputRef = useRef(null);

    // Initial Load & Socket
    useEffect(() => {
        fetchConversations();
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

        socketRef.current = io(ENDPOINT);
        socketRef.current.emit("join_user_room", user.id);

        socketRef.current.on("receive_message", (message) => {
            // If chat is open with this user, append
            if (window.selectedDoctorRef && (message.sender === window.selectedDoctorRef._id || message.sender._id === window.selectedDoctorRef._id)) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            } else {
                fetchConversations();
            }
        });

        socketRef.current.on("message_updated", (updatedMsg) => {
            setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
        });

        socketRef.current.on("message_deleted", ({ messageId }) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // Workaround for closure staleness in socket callback for selectedDoctor
    useEffect(() => {
        window.selectedDoctorRef = selectedDoctor;
    }, [selectedDoctor]);

    // Handle URL param 'chat'
    useEffect(() => {
        if (activeChatId && conversations.length > 0) {
            const conv = conversations.find(c => c.user._id === activeChatId);
            if (conv && (!selectedDoctor || selectedDoctor._id !== conv.user._id)) {
                handleSelectDoctor(conv.user);
            }
        }
    }, [activeChatId, conversations]);

    // Update Navbar based on Selection Mode
    useEffect(() => {
        if (selectedDoctor && isSelectionMode) {
            setNavbarConfig({
                type: "selection",
                count: selectedMessages.size,
                actions: {
                    onClear: () => {
                        setIsSelectionMode(false);
                        setSelectedMessages(new Set());
                    },
                    onSelectAll: handleSelectAll,
                    onDelete: initiateDelete,
                    onCopy: handleCopy,
                    onEdit: handleEditInitiate,
                    canEdit: selectedMessages.size === 1
                }
            });
        } else {
            setNavbarConfig({ type: "default" });
        }
    }, [isSelectionMode, selectedMessages, selectedDoctor, setNavbarConfig]);

    const fetchConversations = async () => {
        try {
            const res = await API.get("/messages/conversations");
            setConversations(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch conversations failed", err);
            setLoading(false);
        }
    };

    const handleSelectDoctor = async (doc) => {
        setSelectedDoctor(doc);
        setIsSelectionMode(false);
        setSelectedMessages(new Set());
        setReplyingTo(null);
        setNewMessage("");
        try {
            const res = await API.get(`/messages/conversation/${doc._id}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error("Fetch messages failed", err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedDoctor) return;

        if (editingMessage) {
            try {
                const res = await API.put(`/messages/${editingMessage._id}`, { content: newMessage });
                setMessages(prev => prev.map(msg => msg._id === editingMessage._id ? res.data : msg));
                setNewMessage("");
                setEditingMessage(null);
            } catch (err) { console.error("Edit failed", err); }
            return;
        }

        try {
            const payload = {
                receiverId: selectedDoctor._id,
                content: newMessage,
                replyTo: replyingTo ? replyingTo._id : null
            };
            const res = await API.post("/messages", payload);
            setMessages([...messages, res.data]);
            setNewMessage("");
            setReplyingTo(null);
            scrollToBottom();
            fetchConversations();
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    const handleMessageLongPress = (msgId) => {
        setIsSelectionMode(true);
        toggleSelection(msgId);
    };

    const toggleSelection = (msgId) => {
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(msgId)) newSet.delete(msgId);
            else newSet.add(msgId);

            if (newSet.size === 0) setIsSelectionMode(false);
            return newSet;
        });
    };

    const handleMessageClick = (msgId) => {
        if (isSelectionMode) toggleSelection(msgId);
    };

    const handleCopy = () => {
        const txt = messages.filter(m => selectedMessages.has(m._id)).map(m => m.content).join("\n");
        if (txt) {
            navigator.clipboard.writeText(txt);
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
        }
    };

    const handleEditInitiate = () => {
        if (selectedMessages.size !== 1) return;
        const msg = messages.find(m => m._id === Array.from(selectedMessages)[0]);
        if (!msg) return;
        const canEdit = String(msg.sender?._id || msg.sender) === String(user.id) && (new Date() - new Date(msg.createdAt) < 24 * 60 * 60 * 1000);
        if (canEdit) {
            setEditingMessage(msg);
            setNewMessage(msg.content);
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
        } else {
            alert("Cannot edit this message.");
        }
    };

    const handleSelectAll = () => {
        if (selectedMessages.size === messages.length) {
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } else {
            setSelectedMessages(new Set(messages.map(m => m._id)));
            setIsSelectionMode(true);
        }
    };

    const initiateDelete = () => {
        if (selectedMessages.size === 0) return;
        const allOwned = Array.from(selectedMessages).every(id => {
            const m = messages.find(msg => msg._id === id);
            return m && String(m.sender?._id || m.sender) === String(user.id);
        });

        if (allOwned) {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Messages?',
                message: "Delete for everyone or just you?",
                confirmText: "Everyone",
                onConfirm: handleDeleteForEveryone,
                secondaryConfirmText: "Me",
                onSecondaryConfirm: handleDeleteForMe,
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Messages?',
                message: "Delete for yourself?",
                confirmText: "Delete",
                onConfirm: handleDeleteForMe,
                cancelText: "Cancel",
                type: "danger"
            });
        }
    };

    const handleSingleDelete = (msgId) => {
        const msg = messages.find(m => m._id === msgId);
        if (!msg) return;
        if (String(msg.sender?._id || msg.sender) === String(user.id)) {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Message?',
                message: "Delete for everyone or just you?",
                confirmText: "Everyone",
                onConfirm: () => handleDeleteForEveryone([msgId]),
                secondaryConfirmText: "Me",
                onSecondaryConfirm: () => handleDeleteForMe([msgId]),
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            handleDeleteForMe([msgId]);
        }
    };

    const handleDeleteForMe = async (idsOverride = null) => {
        const ids = Array.isArray(idsOverride) ? idsOverride : Array.from(selectedMessages);
        try {
            await Promise.all(ids.map(id => API.delete(`/messages/${id}`, { data: { deleteForEveryone: false } })));
            setMessages(prev => prev.filter(m => !ids.includes(m._id)));
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } catch (e) { console.error("Del failed", e); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleDeleteForEveryone = async (idsOverride = null) => {
        const ids = Array.isArray(idsOverride) ? idsOverride : Array.from(selectedMessages);
        try {
            await Promise.all(ids.map(id => API.delete(`/messages/${id}`, { data: { deleteForEveryone: true } })));
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } catch (e) { console.error("Del failed", e); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const filteredConversations = conversations.filter(c =>
        c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col md:flex-row relative bg-[var(--bg-color)] text-[var(--text-color)]">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                onSecondaryConfirm={confirmModal.onSecondaryConfirm}
                secondaryConfirmText={confirmModal.secondaryConfirmText}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                type={confirmModal.type}
            />

            {/* Sidebar - Doctors List */}
            <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-white dark:bg-gray-800 ${selectedDoctor ? "hidden md:flex" : "flex"}`} style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Messages</h2>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center px-3 py-2">
                        <FaSearch className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            className="bg-transparent border-none focus:outline-none text-sm w-full dark:text-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading chats...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No conversations found</div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <div
                                key={conv._id}
                                onClick={() => handleSelectDoctor(conv.user)}
                                className={`p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b dark:border-gray-800 ${selectedDoctor?._id === conv.user?._id ? "bg-blue-50 dark:bg-gray-700/50" : ""}`}
                            >
                                <div className={`w-12 h-12 rounded-full overflow-hidden border ${selectedDoctor?._id === conv.user?._id ? 'border-blue-500' : 'border-transparent'}`}>
                                    {conv.user?.avatar && conv.user?.avatar !== "/avatar.png" ? (
                                        <img src={conv.user.avatar} alt={conv.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${getColor(conv.user?.name)}`}>
                                            {getInitials(conv.user?.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{conv.user?.name}</h3>
                                        {/* Last message time could go here */}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        Click to view chat
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col h-full relative ${selectedDoctor ? "flex" : "hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-900"}`}>
                {!selectedDoctor ? (
                    <div className="text-center p-8">
                        <img src="/assets/chat-placeholder.png" alt="Select Chat" className="w-64 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Select a conversation</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">Choose a doctor from the list to start messaging or view history.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        {!isSelectionMode && (
                            <div className="p-3 flex items-center gap-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm z-10">
                                <button onClick={() => setSelectedDoctor(null)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <FaArrowLeft />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                    {selectedDoctor.avatar && selectedDoctor.avatar !== "/avatar.png" ? (
                                        <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xs ${getColor(selectedDoctor.name)}`}>
                                            {getInitials(selectedDoctor.name)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedDoctor.name}</h3>
                                    <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-[var(--bg-color)]" style={{ backgroundImage: "url('/assets/chat-bg.png')", backgroundSize: 'contain' }}>
                            {messages.length === 0 ? (
                                <div className="text-center mt-10 text-gray-400">No messages yet. Say hello!</div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = String(msg.sender?._id || msg.sender) === String(user.id);
                                    const isSelected = selectedMessages.has(msg._id);

                                    return (
                                        <div
                                            key={index}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"} group relative mb-1 touch-manipulation transition-all duration-200`}
                                            onClick={() => handleMessageClick(msg._id)}
                                            onTouchStart={() => { longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500); }}
                                            onTouchEnd={() => clearTimeout(longPressTimer.current)}
                                            onMouseDown={() => { if (!isSelectionMode) longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500); }}
                                            onMouseUp={() => clearTimeout(longPressTimer.current)}
                                        >
                                            <div className={`max-w-[85%] md:max-w-[65%] relative rounded-lg transition-all duration-200 ${isSelected ? 'bg-blue-500/10 dark:bg-blue-400/20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]' : ''}`}>

                                                {/* Message Bubble */}
                                                <div
                                                    className={`px-3 py-1.5 rounded-lg shadow-sm border text-sm relative 
                                            ${isMe ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none border-transparent" : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none border-transparent"}
                                            ${isSelected ? 'opacity-90 mix-blend-multiply dark:mix-blend-screen' : ''}`}
                                                    style={{ wordWrap: 'break-word' }}
                                                >
                                                    {/* Reply Quote */}
                                                    {msg.replyTo && !msg.isDeleted && (
                                                        <div className={`mb-1 p-1 rounded-sm text-xs border-l-4 bg-black/5 dark:bg-white/10 ${isMe ? 'border-[#06cf9c]' : 'border-blue-500'}`}>
                                                            <p className="font-bold text-[10px] opacity-80 mb-0.5">{msg.replyTo.senderName}</p>
                                                            <p className="truncate opacity-70">{msg.replyTo.content}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col">
                                                        <p className={`whitespace-pre-wrap leading-relaxed ${msg.isDeleted ? 'italic opacity-60 flex items-center gap-1' : ''}`}>
                                                            {msg.isDeleted && <FaCheckCircle className="inline w-3 h-3" />}
                                                            {msg.content}
                                                            <span className="inline-block w-12 h-0"></span>
                                                        </p>
                                                        {/* <p className="text-sm opacity-70">Select a doctor to start chatting</p> */}
                                                        <div className="flex justify-end items-center gap-1 -mt-1 ml-2 self-end opacity-60" style={{ fontSize: '10px' }}>
                                                            {msg.isEdited && <span>Edited •</span>}
                                                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            {isMe && <FaCheck className="text-blue-500 ml-0.5" size={10} />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hover Menu */}
                                                {!isSelectionMode && !msg.isDeleted && (
                                                    <div className={`absolute -top-3 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-700 shadow-md rounded-full px-2 py-1 z-20`}>
                                                        <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300" title="Reply">
                                                            <FaReply size={12} />
                                                        </button>
                                                        {isMe && (new Date() - new Date(msg.createdAt) < 24 * 60 * 60 * 1000) && (
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-blue-500" title="Edit">
                                                                <FaPen size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-red-500" title="Delete">
                                                            <FaTrash size={12} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(true); toggleSelection(msg._id); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-green-500" title="Select">
                                                            <FaCheckCircle size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply/Edit Previews */}
                        {replyingTo && (
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#202c33] border-l-4 border-l-blue-500 mx-2 mt-2 rounded-r-lg" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-blue-500 font-bold mb-0.5">Replying to {replyingTo.sender === user.id ? 'Yourself' : selectedDoctor.name}</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {editingMessage && (
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center bg-blue-50 dark:bg-[#202c33] border-l-4 border-l-green-500 mx-2 mt-2 rounded-r-lg" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-green-500 font-bold flex items-center gap-1 mb-0.5"><FaPen size={10} /> Editing Message</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{editingMessage.content}</p>
                                </div>
                                <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-gray-100 dark:bg-[#202c33] flex items-end gap-2 z-20">
                            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl flex items-center px-4 py-2 shadow-sm border border-transparent focus-within:border-green-500 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 max-h-32 overflow-y-auto"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-[#00a884] hover:bg-[#008f6f] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingMessage ? <FaCheck size={16} /> : <FaPaperPlane size={16} className="ml-0.5" />}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
