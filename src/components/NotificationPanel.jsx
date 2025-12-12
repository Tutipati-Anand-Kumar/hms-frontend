import React from 'react';
import { Check, Clock, X, BellOff } from 'lucide-react';

const NotificationPanel = ({
    notifications,
    onMarkAllRead,
    onMarkRead,
    onDelete,
    onClose,
    loading
}) => {
    return (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-lg shadow-xl border z-50 overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>Notifications</h3>
                <div className="flex gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                    <button onClick={onClose} style={{ color: 'var(--secondary-color)' }} className="hover:opacity-80">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                    <div className="p-4 text-center" style={{ color: 'var(--secondary-color)' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center" style={{ color: 'var(--secondary-color)' }}>
                        <BellOff size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <ul className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        {notifications.map((notification) => (
                            <li
                                key={notification._id}
                                className={`p-4 transition-colors cursor-pointer hover:opacity-90 group relative`}
                                style={{
                                    backgroundColor: !notification.isRead ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                                onClick={() => onMarkRead(notification._id)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = !notification.isRead ? 'rgba(37, 99, 235, 0.15)' : 'var(--border-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notification.isRead ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}
                            >
                                <div className="flex gap-3 pr-6"> {/* Added padding right for delete button */}
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`} style={{ color: 'var(--text-color)' }}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--secondary-color)' }}>
                                            <Clock size={12} />
                                            <span>
                                                {notification.createdAt
                                                    ? new Date(notification.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Button (X mark) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent marking as read when deleting
                                            if (onDelete) onDelete(notification._id);
                                        }}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete notification"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
