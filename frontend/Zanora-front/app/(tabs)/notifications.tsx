import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { NotificationResponse, NotificationType } from '../../services/Notificationservice';
import { useNotifications } from '../../context/Notificationcontext';
import { Colors } from '../../constants/Colors';

// ─── ICON MAP ───────────────────────────────────────────────

const ICON: Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  [NotificationType.OFFER_RECEIVED]: 'email-receive-outline',
  [NotificationType.OFFER_ACCEPTED]: 'check-decagram-outline',
  [NotificationType.OFFER_DECLINED]: 'close-circle-outline',
  [NotificationType.REVIEW_RECEIVED]: 'star-outline',
};

// ─── LABELS ────────────────────────────────────────────────

const TYPE_LABEL: Record<NotificationType, string> = {
  [NotificationType.OFFER_RECEIVED]: 'New Offer',
  [NotificationType.OFFER_ACCEPTED]: 'Offer Accepted',
  [NotificationType.OFFER_DECLINED]: 'Offer Declined',
  [NotificationType.REVIEW_RECEIVED]: 'New Review',
};

// ─── COLORS ────────────────────────────────────────────────

const ACCENT: Record<NotificationType, string> = {
  [NotificationType.OFFER_RECEIVED]: '#3B82F6',
  [NotificationType.OFFER_ACCEPTED]: '#10B981',
  [NotificationType.OFFER_DECLINED]: '#EF4444',
  [NotificationType.REVIEW_RECEIVED]: '#F59E0B',
};

// ─── TIME HELPER ───────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── PULSE COMPONENT ───────────────────────────────────────

function PulseIcon({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [active, scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
}

// ─── CARD ──────────────────────────────────────────────────

interface CardProps {
  item: NotificationResponse;
  onPress: (id: number) => void;
}

function NotificationCard({ item, onPress }: CardProps) {
  const accent = ACCENT[item.type] ?? Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      activeOpacity={0.75}
      onPress={() => onPress(item.id)}
    >
      {/* left bar */}
      <View style={[styles.cardBar, { backgroundColor: accent }]} />

      {/* icon */}
      <View style={[styles.iconBubble, { backgroundColor: accent + '18' }]}>
        <PulseIcon active={!item.isRead}>
          <MaterialCommunityIcons
            name={(ICON[item.type] ?? 'bell-outline') as string}
            size={24}
            color={accent}
          />
        </PulseIcon>
      </View>

      {/* content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardType, { color: accent }]}>
            {TYPE_LABEL[item.type]}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>

        <Text style={styles.cardMessage} numberOfLines={3}>
          {item.message}
        </Text>
      </View>

      {/* unread dot */}
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
    </TouchableOpacity>
  );
}

// ─── EMPTY STATE ───────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <MaterialCommunityIcons
          name="bell-off-outline"
          size={54}
          color={Colors.textSecondary}
        />
      </View>

      <Text style={styles.emptyTitle}>All caught up</Text>

      <Text style={styles.emptySubtitle}>
        No notifications yet. We'll let you know when something happens.
      </Text>
    </View>
  );
}

// ─── SCREEN ────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } =
    useNotifications();

  const handlePress = useCallback(
    (id: number) => {
      const n = notifications.find((x) => x.id === id);
      if (n && !n.isRead) markAsRead(id);
    },
    [notifications, markAsRead]
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationResponse }) => (
      <NotificationCard item={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item: NotificationResponse) => String(item.id), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* list */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.primary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  markAllBtn: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  divider: { height: 1, backgroundColor: Colors.border },

  list: { padding: 16 },
  emptyList: { flex: 1 },

  separator: { height: 10 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingRight: 14,
    elevation: 2,
  },
  cardUnread: { backgroundColor: '#FAFCFF' },

  cardBar: { width: 4, alignSelf: 'stretch', marginRight: 12 },

  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardContent: { flex: 1 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  cardType: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  cardTime: { fontSize: 11, color: Colors.textSecondary },

  cardMessage: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyIconWrapper: { marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});