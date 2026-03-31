import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const NotificationBadge = ({ count: manualCount }) => {
    const [unreadCount, setUnreadCount] = useState(manualCount || 0);

    useEffect(() => {
        if (manualCount !== undefined) {
             setUnreadCount(manualCount);
             return;
        }

        const fetchUnread = async () => {
            try {
                const res = await api.get('chat/messages/unread_count/');
                setUnreadCount(res.data.unread_count);
            } catch (err) {
                console.error("Unread fetch error:", err);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [manualCount]);

    if (unreadCount === 0) return null;

    return (
        <span style={{ 
            background: '#FF453A', 
            color: 'white', 
            fontSize: '0.7rem', 
            fontWeight: 900, 
            padding: '2px 6px', 
            borderRadius: '100px', 
            marginLeft: 'auto',
            border: '2px solid rgba(0,0,0,0.2)',
            boxShadow: '0 4px 10px rgba(255, 69, 58, 0.4)'
        }}>
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    );
};

export default NotificationBadge;
