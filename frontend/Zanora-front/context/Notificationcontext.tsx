import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  NotificationResponse,
  getAllNotifications,
  getUnreadCount,
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
} from '../services/Notificationservice';
import { useNotificationSocket } from '../hooks/Usenotificationsocket';

interface NotificationContextValue {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, count] = await Promise.all([
        getAllNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(all);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, []);

  // Push new real-time notifications to the top of the list
  const handleSocketNotification = useCallback((n: NotificationResponse) => {
    setNotifications((prev) => [n, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  useNotificationSocket({ onNotification: handleSocketNotification });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback(async (id: number) => {
    await apiMarkAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await apiMarkAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}