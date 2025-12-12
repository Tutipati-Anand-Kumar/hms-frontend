import React, { useState, useEffect, useRef } from "react";
import { API, getActiveUser } from "../../api/authservices/authservice";
import io from "socket.io-client";
import { FaUserMd, FaSearch, FaArrowLeft, FaTrash, FaReply, FaCheck, FaTimes, FaEllipsisV, FaCheckDouble } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

const ENDPOINT = "http://localhost:3000";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-2 bg-black/10 backdrop-blur-xs transition-all">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[90%] max-w-md animate-bounce-in border border-gray-200 dark:border-gray-700`}
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100" style={{ color: 'var(--text-color)' }}>{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6" style={{ color: 'var(--text-color)' }}>{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-gray-400 transition-colors"
                        style={{ color: 'var(--text-color)' }}>Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
};

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
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

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

        socketRef.current.on("receive_message", (message) => {
            // Check against current URL param instead of stale state
            const currentChatId = new URLSearchParams(window.location.search).get("chat");

            if (currentChatId && (message.sender._id === currentChatId || message.sender === currentChatId)) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
            fetchConversations();
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

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null });

    const handleDeleteSelected = async () => {
        if (selectedMessages.size === 0) return;
        setModalConfig({
            isOpen: true,
            type: 'delete_selected',
            data: null,
            title: 'Delete Messages?',
            message: `Are you sure you want to delete ${selectedMessages.size} message(s)?`
        });
    };

    const handleSingleDelete = async (msgId) => {
        // Direct delete NO CONFIRMATION for single message action as requested
        try {
            await API.delete(`/messages/${msgId}`, {
                data: { deleteForEveryone: false }
            });
            setMessages(prev => prev.filter(m => m._id !== msgId));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await Promise.all(
                Array.from(selectedMessages).map(id =>
                    API.delete(`/messages/${id}`, {
                        data: { deleteForEveryone: false }
                    })
                )
            );

            // Optimistic update
            setMessages(prev => prev.filter(m => !selectedMessages.has(m._id)));
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setModalConfig({ isOpen: false, type: null, data: null });
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="h-full flex flex-col md:flex-row relative" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={modalConfig.title}
                message={modalConfig.message}
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
                                    <button onClick={handleSelectAll} className="p-2 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title="Select All">
                                        <FaCheckDouble />
                                    </button>
                                    <button onClick={handleDeleteSelected} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Delete">
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
                                                {msg.replyTo && (
                                                    <div className={`mb-2 p-2 rounded text-xs border-l-4 ${isMe ? 'bg-blue-700 border-blue-300 text-blue-100' : ' dark:bg-gray-700 border-blue-500 text-gray-600 dark:text-gray-300'}`}>
                                                        <p className="font-bold mb-1">{msg.replyTo.senderName}</p>
                                                        <p className="truncate">{msg.replyTo.content}</p>
                                                    </div>
                                                )}

                                                <p>{msg.content}</p>

                                                <div className="flex justify-between items-end mt-1 gap-4">
                                                    <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>

                                                </div>
                                            </div>

                                            {/* Action Menu (Only show on hover if not selection mode) */}
                                            {!isSelectionMode && (
                                                <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                                    <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors" title="Reply">
                                                        <FaReply size={12} />
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-red-500 shadow-sm transition-colors" title="Delete">
                                                        <FaTrash size={12} />
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(true); toggleSelection(msg._id); }} className="p-1 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors" title="Select">
                                                        <FaCheck size={12} />
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
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
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
