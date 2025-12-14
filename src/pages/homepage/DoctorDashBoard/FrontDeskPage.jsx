import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, Search, Phone, Mail, Clock, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { API, getActiveUser, BASE_URL } from "../../../api/authservices/authservice";
import ConfirmationModal from "../../../components/ConfirmationModal";
import io from "socket.io-client";
import { FaPaperPlane, FaSearch, FaArrowLeft, FaTrash, FaReply, FaCheck, FaTimes, FaEllipsisV, FaCheckDouble } from "react-icons/fa";

const ENDPOINT = BASE_URL;



export default function FrontDeskPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hospital, setHospital] = useState(null);
  const [helpDeskUser, setHelpDeskUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat Features State
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null });

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const longPressTimer = useRef(null);
  const user = getActiveUser();

  useEffect(() => {
    fetchHospitalAndHelpDesk();

    // Socket Connection
    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("join_user_room", user.id);

    socketRef.current.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

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

  const initiateDelete = () => {
    if (selectedMessages.size === 0) return;
    setModalConfig({
      isOpen: true,
      type: 'delete_selected',
      data: null,
      title: 'Delete Messages?',
      message: `Are you sure you want to delete ${selectedMessages.size} message(s)?`
    });
  };

  const handleSingleDelete = (msgId) => {
    setModalConfig({
      isOpen: true,
      type: 'delete_single',
      data: { _id: msgId },
      title: 'Delete Message?',
      message: 'Are you sure you want to delete this message?'
    });
  };

  const handleConfirmDelete = async () => {
    const isBulk = modalConfig.type === 'delete_selected';
    const itemsToDelete = isBulk ? Array.from(selectedMessages) : [modalConfig.data._id];

    try {
      await Promise.all(
        itemsToDelete.map(id =>
          API.delete(`/messages/${id}`, {
            data: { deleteForEveryone: false } // Default soft delete
          })
        )
      );

      // Optimistic update
      setMessages(prev => prev.filter(m => !itemsToDelete.includes(m._id)));

      if (isBulk) {
        setSelectedMessages(new Set());
        setIsSelectionMode(false);
      }
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
    <div className="h-full flex flex-col relative" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={modalConfig.title}
        message={modalConfig.message}
        type="danger"
        confirmText="Delete"
      />

      {/* Header */}
      {isSelectionMode ? (
        <div className="p-4 flex justify-between items-cente dark:bg-gray-800" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => { setIsSelectionMode(false); setSelectedMessages(new Set()); }} className=" dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
              <FaTimes size={18} />
            </button>
            <span className="font-bold text-lg dark:text-white">{selectedMessages.size} Selected</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSelectAll} className="p-2 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title="Select All">
              <FaCheckDouble />
            </button>
            <button onClick={initiateDelete} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Delete">
              <FaTrash />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 flex justify-between items-center" style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h1 className="text-xl font-bold text-blue-400">Front Desk Chat</h1>
            {hospital && (
              <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>
                {hospital.name}
              </p>
            )}
          </div>
          <div className="text-right">
            {helpDeskUser && <p className="text-xs text-blue-300">Chatting with: {helpDeskUser.name}</p>}
            <p className="text-green-400 text-sm font-semibold flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" style={{ backgroundColor: 'var(--bg-color)' }}>
        {loading ? (
          <div className="text-center mt-10" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
        ) : !helpDeskUser ? (
          <div className="text-center text-red-400 mt-10">Help Desk not found for this hospital.</div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-10" style={{ color: 'var(--secondary-color)' }}>No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = (msg.sender?._id || msg.sender) === user.id;
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
                      <div className={`mb-2 p-2 rounded text-xs border-l-4 ${isMe ? 'bg-blue-700 border-blue-300 text-blue-100' : 'bg-gray-100 dark:bg-gray-700 border-blue-500 text-gray-600 dark:text-gray-300'}`}>
                        <p className="font-bold mb-1">{msg.replyTo.senderName}</p>
                        <p className="truncate">{msg.replyTo.content}</p>
                      </div>
                    )}

                    <p>{msg.content}</p>

                    <div className="flex justify-between items-center mt-1 gap-2">
                      <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Action Menu */}
                  {!isSelectionMode && (
                    <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }} className="flex items-center justify-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors" title="Reply">
                        <FaReply size={12} />
                      </button>

                      <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(msg._id); }} className="flex items-center justify-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-red-500 shadow-sm transition-colors" title="Delete For Me">
                        <FaTrash size={12} />
                      </button>

                      <button onClick={(e) => { e.stopPropagation(); setIsSelectionMode(true); toggleSelection(msg._id); }} className="flex items-center justify-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-300 shadow-sm transition-colors" title="Select">
                        <FaCheck size={12} />
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

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 border-t dark:bg-gray-800 flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex-1">
            <p className="text-xs text-blue-500 font-bold">Replying to {replyingTo.sender === user.id ? 'Yourself' : helpDeskUser.name}</p>
            <p className="text-sm truncate text-gray-600 dark:text-gray-300">{replyingTo.content}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-full">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 rounded-b-lg flex gap-2" style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' }}>
        <input
          type="text"
          className="flex-1 rounded-full px-4 py-2 border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={!helpDeskUser || !hospital}
        />
        <button
          onClick={handleSendMessage}
          disabled={!helpDeskUser || !hospital}
          className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 disabled:opacity-50"
        >
          <FaPaperPlane className="text-sm ml-0.5" />
        </button>
      </div>
    </div>
  );
}
