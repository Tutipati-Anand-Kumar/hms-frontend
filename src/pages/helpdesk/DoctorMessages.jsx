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
    const [searchQuery, setSearchQuery] = useState(""); // Restored
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [activeReactionId, setActiveReactionId] = useState(null); // New state for click-to-react

    const [loading, setLoading] = useState(true);

    // Chat Features
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [swipeX, setSwipeX] = useState(0);
    const [swipingId, setSwipingId] = useState(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

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

    // Re-fetch on Tab Focus (Fixes "not showing instantly" after tab switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Determine what to refetch
                if (selectedDoctor) {
                    // Refetch current chat
                    API.get(`/messages/conversation/${selectedDoctor._id}`)
                        .then(res => setMessages(res.data))
                        .catch(err => console.error("Refetch chat failed", err));
                } else {
                    // Refetch list
                    fetchConversations();
                }

                // Ensure socket is connected
                if (socketRef.current && !socketRef.current.connected) {
                    socketRef.current.connect();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [selectedDoctor]);

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
        setActiveReactionId(null); // Close reaction picker on chat change
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

        const content = newMessage;
        if (editingMessage) {
            // Optimistic Edit
            const originalMessages = [...messages];
            const originalMsg = editingMessage;
            setMessages(prev => prev.map(msg => msg._id === editingMessage._id ? { ...msg, content, isEdited: true } : msg));
            setNewMessage("");
            setEditingMessage(null);

            try {
                const res = await API.put(`/messages/${originalMsg._id}`, { content });
                // Sync with server response
                setMessages(prev => prev.map(msg => msg._id === originalMsg._id ? res.data : msg));
            } catch (err) {
                console.error("Edit failed", err);
                setMessages(originalMessages);
            }
            return;
        }

        // Optimistic New Message
        const tempId = Date.now().toString();
        const tempMsg = {
            _id: tempId,
            content,
            sender: user.id,
            receiver: selectedDoctor._id,
            createdAt: new Date().toISOString(),
            isPending: true,
            replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, senderName: replyingTo.senderName } : null
        };

        setMessages(prev => [...prev, tempMsg]);
        setNewMessage("");
        setReplyingTo(null);
        scrollToBottom();

        try {
            const payload = {
                receiverId: selectedDoctor._id,
                content,
                replyTo: tempMsg.replyTo ? tempMsg.replyTo._id : null
            };
            const res = await API.post("/messages", payload);
            // Replace temp message with real one
            setMessages(prev => prev.map(m => m._id === tempId ? res.data : m));
            fetchConversations();
        } catch (err) {
            console.error("Send failed", err);
            // Remove temp message on failure
            setMessages(prev => prev.filter(m => m._id !== tempId));
        }
    };

    const handleReaction = async (msgId, emoji) => {
        // Optimistic Reaction
        const originalMessages = [...messages];
        setMessages(prev => prev.map(m => {
            if (m._id === msgId) {
                const existingReactions = m.reactions || [];
                // Check if user already reacted with this emoji
                const hasReacted = existingReactions.some(r => r.emoji === emoji && (r.user?._id === user.id || r.user === user.id));

                let newReactions;
                if (hasReacted) {
                    newReactions = existingReactions.filter(r => !(r.emoji === emoji && (r.user?._id === user.id || r.user === user.id)));
                } else {
                    newReactions = [...existingReactions, { emoji, user: { _id: user.id } }];
                }
                return { ...m, reactions: newReactions };
            }
            return m;
        }));
        setActiveReactionId(null); // Immediate close for better feel

        try {
            const res = await API.post(`/messages/${msgId}/react`, { emoji });
            // Sync with server response for full correctness
            setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
        } catch (err) {
            console.error("Reaction failed", err);
            setMessages(originalMessages);
        }
    };

    const handleMessageLongPress = (msgId) => {
        setIsSelectionMode(true);
        toggleSelection(msgId);
        setActiveReactionId(null); // Close reaction picker on long press
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
        if (isSelectionMode) {
            toggleSelection(msgId);
        } else {
            // Toggle reaction picker on click
            setActiveReactionId(prev => prev === msgId ? null : msgId);
        }
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
            setActiveReactionId(null); // Close reaction picker on edit
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
        setActiveReactionId(null); // Close reaction picker on delete
    };

    const handleSingleDelete = (msgId) => {
        const msg = messages.find(m => m._id === msgId);
        if (!msg) return;

        // Special case for Tombstones ("This message was deleted")
        if (msg.isDeleted) {
            // Delete immediately for me, no modal needed
            handleDeleteForMe([msgId]);
            return;
        }

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
        setActiveReactionId(null); // Close reaction picker on delete
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

            // OPTIMISTIC UPDATE: specific fix for "not deleting immediately"
            setMessages(prev => prev.map(m => {
                if (ids.includes(m._id)) {
                    return { ...m, isDeleted: true, content: "This message was deleted", reactions: [] };
                }
                return m;
            }));

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
            <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-[var(--sidebar-bg)] ${selectedDoctor ? "hidden md:flex" : "flex"}`} style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="text-xl font-bold mb-4 text-[var(--text-color)]">Messages</h2>
                    <div className="rounded-lg flex items-center px-3 py-2 bg-[var(--card-bg)]">
                        <FaSearch className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            className="bg-transparent border-none focus:outline-none text-sm w-full text-[var(--text-color)]"
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
                                className={`p-4 flex items-center gap-3 hover:bg-[var(--card-bg)] cursor-pointer transition-colors border-b ${selectedDoctor?._id === conv.user?._id ? "bg-[var(--card-bg)] opacity-80" : ""}`}
                                style={{ borderColor: 'var(--border-color)' }}
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
                                        <h3 className="font-semibold text-[var(--text-color)] truncate">{conv.user?.name}</h3>
                                        {/* Last message time could go here */}
                                    </div>
                                    <p className="text-sm opacity-60 truncate text-[var(--text-color)]">
                                        Click to view chat
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col h-full relative ${selectedDoctor ? "flex" : "hidden md:flex items-center justify-center bg-[var(--bg-color)]"}`}>
                {!selectedDoctor ? (
                    <div className="text-center p-8">
                        <img src="/assets/chat-placeholder.png" alt="Select Chat" className="w-64 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-[var(--text-color)]">Select a conversation</h3>
                        <p className="max-w-sm mx-auto mt-2 opacity-60 text-[var(--text-color)]">Choose a doctor from the list to start messaging or view history.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        {!isSelectionMode && (
                            <div className="p-3 flex items-center gap-3 bg-[var(--navbar-bg)] border-b shadow-sm z-10" style={{ borderColor: 'var(--border-color)' }}>
                                <button onClick={() => setSelectedDoctor(null)} className="md:hidden p-2 hover:bg-[var(--card-bg)] rounded-full text-[var(--text-color)]">
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
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate text-[var(--text-color)]">{selectedDoctor.name}</h3>
                                    <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar bg-[var(--bg-color)]" style={{ backgroundImage: "url('/assets/chat-bg.png')", backgroundSize: 'contain' }}>
                            {messages.length === 0 ? (
                                <div className="text-center mt-10 text-gray-400">No messages yet. Say hello!</div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = String(msg.sender?._id || msg.sender) === String(user.id);
                                    const isSelected = selectedMessages.has(msg._id);

                                    return (
                                        <div
                                            key={index}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"} group relative mb-1 mt-3 touch-manipulation transition-all duration-200`}
                                            onClick={() => handleMessageClick(msg._id)}
                                            onTouchStart={(e) => {
                                                if (isSelectionMode) return;
                                                longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500);
                                                touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                                                setSwipingId(msg._id);
                                            }}
                                            onTouchMove={(e) => {
                                                if (isSelectionMode || !swipingId) return;
                                                const deltaX = e.touches[0].clientX - touchStartPos.current.x;
                                                const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

                                                // Ensure horizontal swipe dominance for high-performance feel
                                                if (deltaX > 0 && deltaX > deltaY * 1.5) {
                                                    clearTimeout(longPressTimer.current);
                                                    setSwipeX(Math.min(deltaX, 80)); // Limit swipe distance
                                                }
                                            }}
                                            onTouchEnd={() => {
                                                clearTimeout(longPressTimer.current);
                                                if (swipeX > 50 && !msg.isDeleted) {
                                                    setReplyingTo(msg);
                                                    inputRef.current?.focus();
                                                }
                                                setSwipeX(0);
                                                setSwipingId(null);
                                            }}
                                            onMouseDown={() => { if (!isSelectionMode) longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500); }}
                                            onMouseUp={() => clearTimeout(longPressTimer.current)}
                                        >
                                            {/* Swipe Backdrop Icon */}
                                            {swipingId === msg._id && swipeX > 15 && (
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 opacity-70 animate-in fade-in zoom-in duration-200">
                                                    <FaReply size={Math.min(12 + swipeX / 4, 18)} className={swipeX > 50 ? 'scale-110' : ''} />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[85%] md:max-w-[65%] relative rounded-lg transition-all duration-200 ${isSelected ? 'bg-blue-500/10 dark:bg-blue-400/20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]' : ''}`}
                                                style={{ transform: swipingId === msg._id ? `translateX(${swipeX}px)` : 'none' }}
                                            >
                                                {/* Message Bubble */}
                                                <div
                                                    className={`px-3 py-1.5 rounded-lg shadow-sm border text-sm relative transition-all duration-200
                                            ${isMe ? "bg-[var(--sender-bg)] text-[var(--sender-text)] rounded-tr-none" : "bg-[var(--card-bg)] text-[var(--text-color)] rounded-tl-none"}
                                            ${isSelected ? 'bg-[var(--selection-bg)] !text-[var(--selection-text)] shadow-lg scale-[1.01]' : 'border-transparent'}`}
                                                    style={{
                                                        wordWrap: 'break-word',
                                                        borderColor: isSelected ? 'var(--selection-border)' : 'transparent'
                                                    }}
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

                                                {/* Hover Menu (Actions Only - No Reactions) */}
                                                {!isSelectionMode && !msg.isDeleted && !msg.isPending && (
                                                    <div className={`absolute -top-3 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} hidden group-hover:flex items-center gap-1 bg-[var(--menu-bg)] shadow-md rounded-full px-2 py-1 z-20`}>
                                                        <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); inputRef.current?.focus(); setTimeout(() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100); }} className={`p-1.5 hover:bg-[var(--menu-item-hover)] rounded-full text-[var(--text-color)] opacity-70`} title="Reply">
                                                            <FaReply size={12} />
                                                        </button>
                                                        {isMe && (new Date() - new Date(msg.createdAt) < 24 * 60 * 60 * 1000) && (
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1.5 hover:bg-[var(--menu-item-hover)] rounded-full text-blue-500" title="Edit">
                                                                <FaPen size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="p-1.5 hover:bg-red-200/30 rounded-full text-red-500" title="Delete">
                                                            <FaTrash size={12} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(true); toggleSelection(msg._id); }} className="p-1.5 hover:bg-[var(--menu-item-hover)] rounded-full text-green-500" title="Select">
                                                            <FaCheckCircle size={12} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Click-triggered Reaction Picker */}
                                                {activeReactionId === msg._id && !isSelectionMode && !msg.isDeleted && !msg.isPending && (
                                                    <div className={`absolute -top-10 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-[var(--menu-bg)] shadow-lg rounded-full px-3 py-1.5 z-30 animate-in fade-in zoom-in duration-200`}>
                                                        {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={(e) => { e.stopPropagation(); handleReaction(msg._id, emoji); }}
                                                                className="hover:scale-125 transition-transform p-1 text-xl"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Tombstone Hover Delete (For "This message was deleted") */}
                                                {!isSelectionMode && msg.isDeleted && (
                                                    <div className={`absolute -top-3 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} hidden group-hover:block bg-[var(--menu-bg)] shadow-md rounded-full px-2 py-1 z-20`}>
                                                        <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="p-1.5 hover:bg-red-200/30 rounded-full text-red-500" title="Delete from view">
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Reactions Display (On Bubble) - No Border */}
                                                {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                                                    <div className={`absolute -top-2 ${isMe ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} flex items-center rounded-full px-1 shadow-sm z-10 scale-125`}>
                                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0, 3).map((e, i) => (
                                                            <span key={i} className="text-xs">{e}</span>
                                                        ))}
                                                        {msg.reactions.length > 1 && <span className="text-[8px] text-[var(--text-color)] opacity-60 ml-0.5">{msg.reactions.length}</span>}
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
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center dark:bg-[#202c33] border-l-4 border-l-blue-500 mx-2 mt-2 rounded-r-lg" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-blue-500 font-bold mb-0.5">Replying to {replyingTo.sender === user.id ? 'Yourself' : selectedDoctor.name}</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-500 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {editingMessage && (
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center dark:bg-[#202c33] border-l-4 border-l-green-500 mx-2 mt-2 rounded-r-lg" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-green-500 font-bold flex items-center gap-1 mb-0.5"><FaPen size={10} /> Editing Message</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{editingMessage.content}</p>
                                </div>
                                <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="p-2 hover:bg-gray-500 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 flex items-end gap-2 z-20 bg-[var(--bg-color)]">
                            <div className="flex-1 rounded-2xl flex items-center px-4 py-2 shadow-sm border border-transparent focus-within:border-green-500 transition-all bg-[var(--card-bg)]">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-500 max-h-32 overflow-y-auto outline-none text-[var(--text-color)]"
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
