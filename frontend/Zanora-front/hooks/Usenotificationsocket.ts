import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationResponse } from '../services/Notificationservice';

interface UseNotificationSocketOptions {
  onNotification: (notification: NotificationResponse) => void;
  enabled?: boolean;
}

/**
 * Connects to the Spring STOMP WebSocket and listens for real-time
 * notifications on /user/queue/notifications.
 *
 * Usage:
 *   useNotificationSocket({ onNotification: (n) => setNotifications(prev => [n, ...prev]) });
 */
export function useNotificationSocket({
  onNotification,
  enabled = true,
}: UseNotificationSocketOptions) {
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !enabled) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const notification: NotificationResponse = JSON.parse(message.body);
            onNotification(notification);
          } catch (e) {
            console.warn('Failed to parse notification:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers['message']);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });

    clientRef.current = client;
    client.activate();
  }, [onNotification, enabled]);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [connect]);
}