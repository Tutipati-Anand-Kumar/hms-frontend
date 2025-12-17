import React, { useState, useEffect, useRef } from "react";
import { API, getActiveUser, BASE_URL } from "../../../api/authservices/authservice";
import io from "socket.io-client";
import { FaPaperPlane, FaTrash, FaReply, FaCheck, FaTimes, FaPen, FaCopy, FaCheckCircle, FaAngleDown } from "react-icons/fa";
import ConfirmationModal from "../../../components/CofirmationModel";
import { useOutletContext } from "react-router-dom";

const ENDPOINT = BASE_URL;

export default function FrontDeskPage() {
  const { setNavbarConfig } = useOutletContext(); // Get context from DoctorPortal layout
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hospital, setHospital] = useState(null);
  const [helpDeskUser, setHelpDeskUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat Features State
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null); // Track message being edited
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false); // Detect touch device

  // Confirmation Modal State (Replaced modalConfig)
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

  useEffect(() => {
    fetchHospitalAndHelpDesk();

    // Socket Connection
    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("join_user_room", user.id);

    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

    socketRef.current.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
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

  // Update Navbar based on Selection Mode
  useEffect(() => {
    if (isSelectionMode) {
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
  }, [isSelectionMode, selectedMessages]);

  const fetchHospitalAndHelpDesk = async () => {
    try {
      const docRes = await API.get("/doctors/profile/me");
      const doctor = docRes.data;

      if (doctor.hospitals && doctor.hospitals.length > 0) {
        let hospId = doctor.hospitals[0].hospital;
        if (typeof hospId === 'object' && hospId !== null) hospId = hospId._id || hospId.id;
        if (typeof hospId === 'string') hospId = hospId.trim();

        if (!hospId) return;

        const hospRes = await API.get(`/hospitals/${hospId}`);
        setHospital(hospRes.data);

        // Find Help Desk
        try {
          const hdRes = await API.get(`/helpdesk/hospital/${hospId}`);
          setHelpDeskUser(hdRes.data);
          fetchMessages(hdRes.data._id);
        } catch (err) {
          // Fallback
          const helpDeskEmployee = hospRes.data.employees?.find(e => e.role === 'helpdesk');
          if (helpDeskEmployee) {
            const hdUserId = helpDeskEmployee.user;
            const hdRes = await API.get(`/helpdesk/${hdUserId}`);
            setHelpDeskUser(hdRes.data);
            fetchMessages(hdUserId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const res = await API.get(`/messages/conversation/${otherUserId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !helpDeskUser || !hospital) return;

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

    // Handle New Message
    try {
      const payload = {
        receiverId: helpDeskUser._id || helpDeskUser,
        content: newMessage,
        hospitalId: hospital._id || hospital.id,
        replyTo: replyingTo ? replyingTo._id : null
      };

      const res = await API.post("/messages", payload);
      setMessages([...messages, res.data]);
      setNewMessage("");
      setReplyingTo(null);
      scrollToBottom();
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
    <div className="h-full flex flex-col relative" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Modal */}
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

      {/* Header (Only show Default Header if NOT in selection mode) */}
      {!isSelectionMode && (
        <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-blue-400">Front Desk Chat</h1>
            {hospital && (
              <p className="text-xs text-gray-500">
                {hospital.name}
              </p>
            )}
          </div>
          <div className="text-right">
            {helpDeskUser && <p className="text-xs text-blue-500 font-medium">{helpDeskUser.name}</p>}
            <p className="text-green-500 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar" style={{ backgroundImage: "url('/assets/chat-bg.png')", backgroundSize: 'contain' }}>
        {loading ? (
          <div className="text-center mt-10 text-gray-400">Loading...</div>
        ) : !helpDeskUser ? (
          <div className="text-center text-red-400 mt-10">Help Desk not found for this hospital.</div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-10 text-gray-400">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = String(msg.sender?._id || msg.sender) === String(user.id);
            const isSelected = selectedMessages.has(msg._id);

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"} group relative mb-1 touch-manipulation transition-all duration-200`}
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
                {/* Selection Overlay Highlight */}
                <div className={`max-w-[85%] md:max-w-[70%] relative rounded-lg transition-all duration-200 ${isSelected ? 'bg-blue-500/10 dark:bg-blue-400/20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]' : ''}`}>

                  {/* Message Bubble */}
                  <div
                    className={`px-3 py-1.5 rounded-lg shadow-sm border text-sm relative 
                    ${isMe ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none border-transparent" : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none border-transparent"}
                    ${isSelected ? 'opacity-90 mix-blend-multiply dark:mix-blend-screen' : ''}
                    `}
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

                        {/* Spacer for time to float bottom right */}
                        <span className="inline-block w-12 h-0"></span>
                      </p>

                      {/* Time & Edited Indicator */}
                      <div className="flex justify-end items-center gap-1 -mt-1 ml-2 self-end opacity-60" style={{ fontSize: '10px' }}>
                        {msg.isEdited && <span>Edited •</span>}
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <FaCheck className="text-blue-500 ml-0.5" size={10} />}
                      </div>
                    </div>
                  </div>

                  {/* Hover Actions (Desktop) */}
                  {!isSelectionMode && !isTouch && !msg.isDeleted && (
                    <div className={`absolute -top-3 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-700 shadow-md rounded-full px-2 py-1 z-20`}>
                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300" title="Reply">
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

                  {/* Mobile Long Press Indicator/Hint (Optional) */}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#202c33] border-l-4 border-l-blue-500 mx-2 mt-2 rounded-r-lg" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-blue-500 font-bold mb-0.5">Replying to {replyingTo.sender === user.id ? 'Yourself' : helpDeskUser.name}</p>
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
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 max-h-32 overflow-y-auto"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={!helpDeskUser || !hospital}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!helpDeskUser || !hospital || !newMessage.trim()}
          className="bg-[#00a884] hover:bg-[#008f6f] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingMessage ? <FaCheck size={16} /> : <FaPaperPlane size={16} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
