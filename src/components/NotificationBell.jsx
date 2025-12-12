import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const NotificationBell = () => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                bellRef.current &&
                !bellRef.current.contains(event.target) &&
                panelRef.current &&
                !panelRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                    color: 'var(--text-color)',
                    backgroundColor: isOpen ? 'var(--border-color)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOpen ? 'var(--border-color)' : 'transparent'}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full min-w-[18px] h-[18px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div ref={panelRef}>
                    <NotificationPanel
                        notifications={notifications}
                        onMarkAllRead={markAllAsRead}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClose={() => setIsOpen(false)}
                        loading={loading}
                    />
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
