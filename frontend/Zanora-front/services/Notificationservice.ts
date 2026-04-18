import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8080/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  if (!text || text.trim() === '') return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${path}: "${text.slice(0, 80)}"`);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export enum NotificationType {
  OFFER_RECEIVED = 'OFFER_RECEIVED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
}

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  message: string;
  offerId?: number;
  propertyId?: number;
  reviewId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Notification API ─────────────────────────────────────────────────────────

export async function getAllNotifications(): Promise<NotificationResponse[]> {
  const result = await request<NotificationResponse[] | null>('/notifications');
  return result ?? [];
}

export async function getUnreadNotifications(): Promise<NotificationResponse[]> {
  const result = await request<NotificationResponse[] | null>('/notifications/unread');
  return result ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const result = await request<{ count: number } | null>('/notifications/unread/count');
  return result?.count ?? 0;
}

export async function markAsRead(notificationId: number): Promise<void> {
  return request<void>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<void> {
  return request<void>('/notifications/read-all', { method: 'PATCH' });
}