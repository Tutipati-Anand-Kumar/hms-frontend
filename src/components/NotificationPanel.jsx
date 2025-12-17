import React, { useState, useRef } from 'react';
import { Check, Clock, X, BellOff } from 'lucide-react';

const SwipeableNotificationItem = ({ notification, onMarkRead, onDelete }) => {
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const [isSwiping, setIsSwiping] = useState(false);

    // Threshold to trigger delete
    const DELETE_THRESHOLD = 100;

    const handleTouchStart = (e) => {
        setStartX(e.targetTouches[0].clientX);
        setStartY(e.targetTouches[0].clientY);
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // If simple click/tap or vertical scroll dominance, don't swipe
        // We only want to takeover if horizontal move is significant and dominant
        if (!isSwiping) {
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                setIsSwiping(true);
            }
        }

        if (isSwiping) {
            // Prevent vertical scrolling while swiping horizontally
            if (e.cancelable) e.preventDefault();

            setTranslateX(diffX);

            // Fade out as we get closer to threshold
            const newOpacity = Math.max(0, 1 - Math.abs(diffX) / (DELETE_THRESHOLD * 2));
            setOpacity(newOpacity);
        }
    };

    const handleTouchEnd = () => {
        if (Math.abs(translateX) > DELETE_THRESHOLD) {
            // Trigger Delete
            // Slide completely off screen visuals first? Or just call delete
            // For smoother UX, maybe animate off, but calling onDelete directly works too 
            // as data update will remove the item.
            setTranslateX(translateX > 0 ? 500 : -500); // Throw it away visual
            setOpacity(0);
            setTimeout(() => {
                onDelete(notification._id);
            }, 200);
        } else {
            // Reset
            setTranslateX(0);
            setOpacity(1);
        }
        setIsSwiping(false);
    };

    return (
        <li
            className={`p-4 transition-colors cursor-pointer hover:opacity-90 group relative overflow-hidden`}
            style={{
                backgroundColor: !notification.isRead ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                borderBottom: '1px solid var(--border-color)',
                transform: `translateX(${translateX}px)`,
                opacity: opacity,
                transition: isSwiping ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
            }}
            onClick={() => onMarkRead(notification._id)}
            onMouseEnter={(e) => {
                // Only apply hover bg if not swiping/moved
                if (translateX === 0) e.currentTarget.style.backgroundColor = !notification.isRead ? 'rgba(37, 99, 235, 0.15)' : 'var(--border-color)'
            }}
            onMouseLeave={(e) => {
                if (translateX === 0) e.currentTarget.style.backgroundColor = !notification.isRead ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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

                {/* Delete Button (X mark) - Desktop/Click */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent marking as read when deleting
                        onDelete(notification._id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete notification"
                >
                    <X size={14} />
                </button>
            </div>
        </li>
    );
};

const NotificationPanel = ({
    notifications,
    onMarkAllRead,
    onMarkRead,
    onDelete,
    onClose,
    loading
}) => {
    return (
        <div className="absolute right-0 mt-2 max-[600px]:w-70 max-[600px]:left-[-130px] max-[600px]:top-11 md:w-96 max-[1000px]:left-[-220px] max-[1000px]:top-12 rounded-lg shadow-xl border z-50 overflow-hidden"
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
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
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
                            <SwipeableNotificationItem
                                key={notification._id}
                                notification={notification}
                                onMarkRead={onMarkRead}
                                onDelete={onDelete}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
