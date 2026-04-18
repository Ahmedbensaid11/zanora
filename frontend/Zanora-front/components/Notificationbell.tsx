import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotifications } from '../context/Notificationcontext';
import { Colors } from '../constants/Colors';

interface NotificationBellProps {
  onPress: () => void;
  size?: number;
}

/**
 * Drop this into any header / tab bar.
 * Shows an animated badge with the unread count.
 *
 * Usage:
 *   <NotificationBell onPress={() => navigation.navigate('Notifications')} />
 */
export function NotificationBell({ onPress, size = 28 }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity onPress={onPress} style={styles.wrapper} activeOpacity={0.7}>
      {/* Bell icon using unicode — swap for your icon library if preferred */}
      <Text style={[styles.bell, { fontSize: size }]}>🔔</Text>

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    padding: 4,
  },
  bell: {
    lineHeight: 36,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
});