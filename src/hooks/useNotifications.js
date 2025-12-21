import { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../api/authservices/authservice';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(new Audio('/assets/notify.mp3'));
    const intervalRef = useRef(null);

    const fetchNotifications = useCallback(async (playAudio = false) => {
        try {
            setLoading(true);
            const { data } = await API.get('/notifications');

            setNotifications(prev => {

                const newUnreadCount = data.filter(n => !n.isRead).length;
                const prevUnreadCount = prev.filter(n => !n.isRead).length;

                if (playAudio && newUnreadCount > prevUnreadCount) {
                    audioRef.current.play().catch(e => console.log("Audio play failed", e));
                }

                setUnreadCount(newUnreadCount);
                return data;
            });
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    useEffect(() => {
        fetchNotifications(false); // Initial fetch

        // Polling every 30 seconds
        intervalRef.current = setInterval(() => {
            fetchNotifications(true);
        }, 30000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchNotifications]);

    // Auto-delete timer logic
    useEffect(() => {
        const timers = [];
        notifications.forEach(n => {
            if (n.isRead && n.readAt) {
                const readTime = new Date(n.readAt).getTime();
                const now = Date.now();
                const timeSinceRead = now - readTime;

                const deleteDelay = 5 * 60 * 1000 + (Math.random() * 3 * 60 * 1000); // 5-8 mins

                if (timeSinceRead >= deleteDelay) {
                    // Already passed, delete immediately
                    handleDelete(n._id);
                } else {
                    // Set timeout
                    const timeoutId = setTimeout(() => {
                        handleDelete(n._id);
                    }, deleteDelay - timeSinceRead);
                    timers.push(timeoutId);
                }
            }
        });

        return () => timers.forEach(clearTimeout);
    }, [notifications]);

    const handleDelete = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n._id !== id));

        try {
            await API.delete(`/notifications/${id}`);
        } catch (error) {
            console.error("Failed to delete notification", error);
            // Revert on failure
            fetchNotifications(false);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification: handleDelete,
        refresh: () => fetchNotifications(false)
    };
};
