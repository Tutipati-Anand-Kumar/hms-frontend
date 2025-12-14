import React, { useState, useEffect, useRef } from "react";
import { API, getActiveUser, BASE_URL } from "../../api/authservices/authservice";
import io from "socket.io-client";
import { FaUserMd, FaSearch, FaArrowLeft, FaTrash, FaReply, FaCheck, FaTimes, FaEllipsisV, FaCheckDouble, FaPen, FaCopy, FaCheckCircle, FaEdit, FaPaperPlane } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import ConfirmationModal from "../../components/CofirmationModel";


const ENDPOINT = BASE_URL;

export default function DoctorMessages() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat");

    const [conversations, setConversations] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [hospital, setHospital] = useState(null);

    // Chat Features State
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isTouch, setIsTouch] = useState(false); // Detect touch device

    // Confirmation Modal State
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
    const user = getActiveUser();

    const [searchTerm, setSearchTerm] = useState("");

    // Filter conversations based on search
    const filteredConversations = conversations.filter(conv =>
        conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Initial Load
    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchConversations(), fetchHospitalDetails()]);
        };
        init();

        // Socket Connection
        socketRef.current = io(ENDPOINT);
        socketRef.current.emit("join_user_room", user.id);

        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

        socketRef.current.on("receive_message", (message) => {
            // Check against current URL param instead of stale state
            const currentChatId = new URLSearchParams(window.location.search).get("chat");

            if (currentChatId && (message.sender._id === currentChatId || message.sender === currentChatId)) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
            fetchConversations();
        });

        socketRef.current.on("message_updated", (updatedMsg) => {
            // Check against current URL param or state. Simply updating state is safest.
            setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
        });

        socketRef.current.on("message_deleted", ({ messageId }) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // Sync Selected Doctor with URL
    useEffect(() => {
        if (activeChatId) {
            // Find doctor in conversations or fetch details if not found
            const conv = conversations.find(c => c.user._id === activeChatId);
            if (conv) {
                setSelectedDoctor(conv.user);
                fetchMessages(conv.user._id);
            } else if (conversations.length > 0) {
                // May strictly need to fetch user profile if not in conversations list yet
                // For now, allow fallback if conversation list loaded
                fetchSpecificUser(activeChatId);
            }
        } else {
            setSelectedDoctor(null);
            setMessages([]);
        }
    }, [activeChatId, conversations.length]); // Depend on conversations loading

    const fetchSpecificUser = async (id) => {
        try {
            // Assuming we can fetch generic user profile or derive from message endpoint
            // Simplified: If not in conv list, we might not have name immediately
            // But getMessages will work.
            const res = await API.get(`/messages/conversation/${id}`);
            setMessages(res.data);
            // We need doctor name, assuming the API returns fully populated messages
            if (res.data.length > 0) {
                const other = res.data[0].sender._id === user.id ? res.data[0].receiver : res.data[0].sender;
                setSelectedDoctor(other);
            }
        } catch (err) {
            console.error("Error loading chat", err);
        }
    }

    const fetchHospitalDetails = async () => {
        try {
            const res = await API.get("/helpdesk/profile/me");
            const helpDesk = res.data;
            if (helpDesk.hospital) {
                const hospId = helpDesk.hospital._id || helpDesk.hospital;
                const finalId = typeof hospId === 'string' ? hospId.trim() : hospId;
                if (finalId) {
                    const hospRes = await API.get(`/hospitals/${finalId}`);
                    setHospital(hospRes.data);
                }
            }
        } catch (err) {
            console.error("Error fetching hospital:", err);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await API.get("/messages/conversations");
            setConversations(res.data);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await API.get(`/messages/conversation/${userId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    const handleSelectDoctor = (docUser) => {
        setSearchParams({ chat: docUser._id });
        setSelectedMessages(new Set());
        setIsSelectionMode(false);
        setReplyingTo(null);
        setSearchTerm(""); // Optional: clear search on select
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedDoctor || !hospital) return;

        // Handle Edit
        if (editingMessage) {
            try {
                const res = await API.put(`/messages/${editingMessage._id}`, { content: newMessage });
                setMessages(prev => prev.map(msg => msg._id === editingMessage._id ? res.data : msg));
                setNewMessage("");
                setEditingMessage(null);
            } catch (err) {
                console.error("Error editing message:", err);
            }
            return;
        }

        try {
            const payload = {
                receiverId: selectedDoctor._id,
                content: newMessage,
                hospitalId: hospital._id || hospital,
                replyTo: replyingTo ? replyingTo._id : null
            };

            const res = await API.post("/messages", payload);
            setMessages([...messages, res.data]);
            setNewMessage("");
            setReplyingTo(null);
            scrollToBottom();
            fetchConversations();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    // --- SELECTION & DELETION LOGIC ---

    const handleMessageLongPress = (msgId) => {
        setIsSelectionMode(true);
        toggleSelection(msgId);
    };

    const toggleSelection = (msgId) => {
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(msgId)) {
                newSet.delete(msgId);
                if (newSet.size === 0) setIsSelectionMode(false);
            } else {
                newSet.add(msgId);
            }
            return newSet;
        });
    };

    const handleMessageClick = (msgId) => {
        if (isSelectionMode) {
            toggleSelection(msgId);
        }
    };

    const handleSelectAll = () => {
        if (selectedMessages.size === messages.length) {
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } else {
            const allIds = new Set(messages.map(m => m._id));
            setSelectedMessages(allIds);
            setIsSelectionMode(true);
        }
    };

    const handleCopy = () => {
        const selectedContent = messages
            .filter(m => selectedMessages.has(m._id))
            .map(m => m.content)
            .join("\n");

        if (selectedContent) {
            navigator.clipboard.writeText(selectedContent);
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
        }
    };

    const handleEditInitiate = () => {
        if (selectedMessages.size !== 1) return;
        const msgId = Array.from(selectedMessages)[0];
        const msg = messages.find(m => m._id === msgId);
        if (!msg) return;

        // Check if editable (User is sender && < 24h)
        const canEdit = String(msg.sender?._id || msg.sender) === String(user.id) && (new Date() - new Date(msg.createdAt) < 24 * 60 * 60 * 1000);

        if (canEdit) {
            setEditingMessage(msg);
            setNewMessage(msg.content);
            setIsSelectionMode(false);
            setSelectedMessages(new Set());
        } else {
            alert("You can only edit your own messages sent within 24 hours.");
        }
    };

    /* DELETE LOGIC */

    const initiateDelete = () => {
        if (selectedMessages.size === 0) return;

        // Check if ALL selected messages are owned by user
        const selectedIds = Array.from(selectedMessages);
        const allOwned = selectedIds.every(id => {
            const m = messages.find(msg => msg._id === id);
            return m && String(m.sender?._id || m.sender) === String(user.id);
        });

        if (allOwned) {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Messages?',
                message: `Do you want to delete these message(s) for everyone or just for yourself?`,
                confirmText: "Delete for Everyone",
                onConfirm: handleDeleteForEveryone,
                secondaryConfirmText: "Delete for Me",
                onSecondaryConfirm: handleDeleteForMe,
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Delete Messages?',
                message: `Delete ${selectedMessages.size} message(s) for yourself?`,
                confirmText: "Delete for Me",
                onConfirm: handleDeleteForMe, // Using generic handler
                cancelText: "Cancel",
                type: "danger"
            });
        }
    };

    const handleSingleDelete = async (msgId) => {
        const msg = messages.find(m => m._id === msgId);
        if (!msg) return;

        if (String(msg.sender?._id || msg.sender) === String(user.id)) {
            // Show modal for owner
            setConfirmModal({
                isOpen: true,
                title: 'Delete Message?',
                message: "Do you want to delete this message?",
                confirmText: "Delete for Everyone",
                onConfirm: () => handleDeleteForEveryone([msgId]),
                secondaryConfirmText: "Delete for Me",
                onSecondaryConfirm: () => handleDeleteForMe([msgId]),
                cancelText: "Cancel",
                type: "danger"
            });
        } else {
            handleDeleteForMe([msgId]);
        }
    };

    const handleDeleteForMe = async (idsOverride = null) => {
        const itemsToDelete = Array.isArray(idsOverride) ? idsOverride : Array.from(selectedMessages);
        try {
            await Promise.all(itemsToDelete.map(id => API.delete(`/messages/${id}`, { data: { deleteForEveryone: false } })));
            setMessages(prev => prev.filter(m => !itemsToDelete.includes(m._id)));
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } catch (err) { console.error("Delete failed", err); }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleDeleteForEveryone = async (idsOverride = null) => {
        const itemsToDelete = Array.isArray(idsOverride) ? idsOverride : Array.from(selectedMessages);
        try {
            await Promise.all(itemsToDelete.map(id => API.delete(`/messages/${id}`, { data: { deleteForEveryone: true } })));
            // Socket will handle update (tombstone), but we can optimistically clear selection
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } catch (err) { console.error("Create failed", err); }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="h-full flex flex-col md:flex-row relative" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
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
            <div className={`w-full md:w-1/3 border-r flex flex-col ${selectedDoctor ? "hidden md:flex" : "flex"}`} style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                    <h2 className="text-xl font-bold text-blue-500 mb-2">Doctors</h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3" style={{ color: 'var(--secondary-color)' }} />
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border rounded-lg pl-10 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-color)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)'
                            }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="text-center p-4" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center p-4" style={{ color: 'var(--secondary-color)' }}>
                            {conversations.length === 0 ? "No conversations yet." : "No doctors found."}
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <div
                                key={conv.user._id}
                                onClick={() => handleSelectDoctor(conv.user)}
                                className={`p-4 border-b cursor-pointer dark:hover:bg-gray-800 transition-colors ${selectedDoctor?._id === conv.user._id ? "dark:bg-gray-800" : ""}`}
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center relative">
                                        {conv.user.avatar || conv.user.profilePic ? (
                                            <img
                                                src={conv.user.avatar || conv.user.profilePic}
                                                alt={conv.user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <FaUserMd className="text-white" />
                                        )}
                                        {/* Online Indicator Mockup */}
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold truncate" style={{ color: 'var(--text-color)' }}>{conv.user.name}</h3>
                                            <span className="text-[10px]" style={{ color: 'var(--secondary-color)' }}>
                                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs truncate opacity-70" style={{ color: 'var(--secondary-color)' }}>
                                            {conv.lastMessage.sender === user.id ? 'You: ' : ''}{conv.lastMessage.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:flex-1 h-full flex flex-col ${selectedDoctor ? "flex" : "hidden md:flex"}`} style={{ backgroundColor: 'var(--bg-color)' }}>
                {selectedDoctor ? (
                    <>
                        {/* Chat Header */}
                        {isSelectionMode ? (
                            <div className="p-4 border-b flex justify-between items-center dark:bg-gray-800" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setIsSelectionMode(false); setSelectedMessages(new Set()); }} className="dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
                                        <FaTimes size={18} />
                                    </button>
                                    <span className="font-bold text-lg dark:text-white">{selectedMessages.size} Selected</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={handleEditInitiate} className="p-2 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title="Edit">
                                        <FaPen />
                                    </button>
                                    <button onClick={handleCopy} className="p-2 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title="Copy">
                                        <FaCopy />
                                    </button>
                                    <button onClick={handleSelectAll} className="p-2 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title="Select All">
                                        <FaCheckDouble />
                                    </button>
                                    <button onClick={initiateDelete} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSearchParams({})} className="md:hidden text-gray-500 hover:text-blue-500">
                                        <FaArrowLeft size={20} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        {selectedDoctor.avatar || selectedDoctor.profilePic ? (
                                            <img
                                                src={selectedDoctor.avatar || selectedDoctor.profilePic}
                                                alt={selectedDoctor.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <FaUserMd className="text-gray-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>{selectedDoctor.name}</h2>
                                        <p className="text-xs text-green-500 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                        </p>
                                    </div>
                                </div>
                                {hospital && (
                                    <div className="text-right text-xs" style={{ color: 'var(--secondary-color)' }}>
                                        <p>{hospital.name}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender._id === user.id || msg.sender === user.id;
                                const isSelected = selectedMessages.has(msg._id);

                                return (
                                    <div
                                        key={index}
                                        className={`flex ${isMe ? "justify-end" : "justify-start"} ${isSelectionMode ? 'mb-4' : ''} group`}
                                        onClick={() => handleMessageClick(msg._id)}
                                        onTouchStart={() => {
                                            longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500);
                                        }}
                                        onTouchEnd={() => clearTimeout(longPressTimer.current)}
                                        onMouseDown={() => {
                                            if (!isSelectionMode) longPressTimer.current = setTimeout(() => handleMessageLongPress(msg._id), 500);
                                        }}
                                        onMouseUp={() => clearTimeout(longPressTimer.current)}
                                    >
                                        {isSelectionMode && (
                                            <div className={`mr-2 flex items-center ${isMe ? 'order-last ml-2 mr-0' : ''}`}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                                    {isSelected && <FaCheck className="text-white text-xs" />}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`max-w-[70%] relative ${isSelected ? 'opacity-80' : ''}`}>
                                            {/* Message Bubble */}
                                            <div
                                                className={`p-3 rounded-lg shadow-sm border ${isMe ? "bg-blue-600 text-white rounded-br-none border-blue-600" : "bg-white dark:bg-gray-800 rounded-bl-none border-gray-200 dark:border-gray-700"}`}
                                                style={!isMe ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' } : {}}
                                            >
                                                {/* Reply Quote */}
                                                {msg.replyTo && !msg.isDeleted && (
                                                    <div className={`mb-2 p-2 rounded text-xs border-l-4 ${isMe ? 'bg-blue-700 border-blue-300 text-blue-100' : ' dark:bg-gray-700 border-blue-500 text-gray-600 dark:text-gray-300'}`}>
                                                        <p className="font-bold mb-1">{msg.replyTo.senderName}</p>
                                                        <p className="truncate">{msg.replyTo.content}</p>
                                                    </div>
                                                )}

                                                <p className={`${msg.isDeleted ? 'italic opacity-60 flex items-center gap-1' : ''}`}>
                                                    {msg.isDeleted && <FaCheckCircle className="inline w-3 h-3" />}
                                                    {msg.content}
                                                </p>

                                                <div className="flex justify-between items-center mt-1 gap-2">
                                                    <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {msg.isEdited && <span className="ml-1 italic opacity-75"> • Edited</span>}
                                                    </span>

                                                </div>
                                            </div>

                                            {/* Action Menu (Only show on hover if not selection mode) */}
                                            {!isSelectionMode && !isTouch && !msg.isDeleted && (
                                                <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center`}>
                                                    <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors w-5 h-5" title="Reply">
                                                        <FaReply size={9} />
                                                    </button>

                                                    {isMe && (new Date() - new Date(msg.createdAt) < 24 * 60 * 60 * 1000) && (
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-blue-500 shadow-sm transition-colors w-5 h-5" title="Edit">
                                                            <FaPen size={9} />
                                                        </button>
                                                    )}

                                                    <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-red-500 shadow-sm transition-colors w-5 h-5" title="Delete">
                                                        <FaTrash size={9} />
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(true); toggleSelection(msg._id); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors w-5 h-5" title="Select">
                                                        <FaCheck size={9} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1">
                                    <p className="text-xs text-blue-500 font-bold">Replying to {replyingTo.sender._id === user.id ? 'Yourself' : selectedDoctor.name}</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-2 rounded-full hover:bg-gray-400 dark:hover:bg-gray-700">
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        {editingMessage && (
                            <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center bg-blue-50 dark:bg-gray-900" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex-1">
                                    <p className="text-xs text-blue-500 font-bold flex items-center gap-1"><FaPen size={10} /> Editing Message</p>
                                    <p className="text-sm truncate text-gray-600 dark:text-gray-300">{editingMessage.content}</p>
                                </div>
                                <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="p-2 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full">
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 border-t flex gap-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <input
                                type="text"
                                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                            >
                                {editingMessage ? <FaCheck /> : <FaPaperPlane className="text-sm ml-0.5" />}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--secondary-color)' }}>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            {/* Large Icon or default */}
                            <FaUserMd className="text-4xl text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Welcome to HelpDesk Chat</h2>
                        <p className="text-sm opacity-70">Select a doctor to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
