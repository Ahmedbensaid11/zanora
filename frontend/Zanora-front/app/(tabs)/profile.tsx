import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';

const BASE_URL = 'http://localhost:8080/api';

const getToken = async (): Promise<string> => {
  return (await AsyncStorage.getItem('token')) ?? '';
};

const authHeaders = async () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${await getToken()}`,
});

interface UserDto {
  id: number;
  username: string;
  email: string;
  active: boolean;
  hasPassword: boolean;
  role?: { id: number; name: string };
}

interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({
  userId,
  refreshKey,
  username,
  onPress,
}: {
  userId: number;
  refreshKey: number;
  username: string;
  onPress: () => void;
}) => {
  const [hasImage, setHasImage] = useState(true);
  const uri = `${BASE_URL}/users/${userId}/profile-picture?t=${refreshKey}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.avatarWrap}>
      {hasImage ? (
        <Image
          source={{ uri }}
          style={styles.avatarImg}
          onError={() => setHasImage(false)}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {username?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View style={styles.cameraTag}>
        <View style={styles.cameraIcon}>
          <View style={styles.cameraLens} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ username: '' });
  const [saving, setSaving] = useState(false);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdData, setPwdData] = useState<UpdatePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPwd, setChangingPwd] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const fetchUser = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${BASE_URL}/auth/me`, { headers });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: UserDto = await res.json();
      setUser(data);
      setEditData({ username: data.username });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!loading) {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const handleSave = async () => {
    if (!user) return;
    if (!editData.username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: user.id,
          username: editData.username.trim(),
          email: user.email,
          active: user.active,
          role: user.role ? { id: user.role.id } : null,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update profile.');
      }
      await fetchUser();
      setEditMode(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (user.hasPassword && !pwdData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (!pwdData.newPassword || !pwdData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (pwdData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setChangingPwd(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          active: user.active,
          role: user.role ? { id: user.role.id } : null,
          password: pwdData.newPassword,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update password.');
      }
      Alert.alert(
        'Updated',
        user.hasPassword ? 'Password changed.' : 'Password set. You can now log in with email.',
      );
      setShowPwdForm(false);
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setUser(prev => prev ? { ...prev, hasPassword: true } : prev);
      await fetchUser();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setChangingPwd(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      const token = await getToken();
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, 'profile.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }
      const res = await fetch(`${BASE_URL}/users/${user.id}/profile-picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed.');
      setAvatarKey(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorMsg}>Could not load profile.</Text>
        <TouchableOpacity onPress={fetchUser} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const animStyle = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerCircle1} />
          <View style={styles.bannerCircle2} />
          <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
            <Avatar
              userId={user.id}
              refreshKey={avatarKey}
              username={user.username}
              onPress={handlePickImage}
            />
            <Text style={styles.bannerName}>{user.username}</Text>
            <Text style={styles.bannerEmail}>{user.email}</Text>
            <View style={styles.bannerMeta}>
              {user.role && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{user.role.name}</Text>
                </View>
              )}
              <View style={[styles.statusPill, user.active ? styles.statusPillActive : styles.statusPillInactive]}>
                <View style={[styles.statusDot, { backgroundColor: user.active ? '#22C55E' : '#EF4444' }]} />
                <Text style={[styles.statusPillText, { color: user.active ? '#22C55E' : '#EF4444' }]}>
                  {user.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Account Info ── */}
        <Animated.View style={animStyle}>
          <View style={[styles.card, styles.cardFirst]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardMeta}>PERSONAL</Text>
                <Text style={styles.cardTitle}>Account Details</Text>
              </View>
              {!editMode ? (
                <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditMode(false);
                    setEditData({ username: user.username });
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {editMode ? (
              <>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.input}
                  value={editData.username}
                  onChangeText={t => setEditData(d => ({ ...d, username: t }))}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InfoRow label="Username" value={user.username} />
                <View style={styles.divider} />
                <InfoRow label="Email" value={user.email} />
                <View style={styles.divider} />
                <InfoRow label="Role" value={user.role?.name} />
              </>
            )}
          </View>
        </Animated.View>

        {/* ── Security ── */}
        <Animated.View style={[animStyle, { marginTop: 16 }]}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardMeta}>SECURITY</Text>
                <Text style={styles.cardTitle}>Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowPwdForm(v => !v);
                  setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                style={showPwdForm ? styles.cancelBtn : styles.editBtn}
              >
                <Text style={showPwdForm ? styles.cancelBtnText : styles.editBtnText}>
                  {showPwdForm ? 'Cancel' : user.hasPassword ? 'Change' : 'Set Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPwdForm ? (
              <>
                {!user.hasPassword && (
                  <View style={styles.noticeBox}>
                    <View style={styles.noticeBar} />
                    <Text style={styles.noticeText}>
                      You signed in with Google. Setting a password lets you also log in with your email.
                    </Text>
                  </View>
                )}
                {user.hasPassword && (
                  <>
                    <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                    <TextInput
                      style={styles.input}
                      secureTextEntry
                      value={pwdData.currentPassword}
                      onChangeText={t => setPwdData(d => ({ ...d, currentPassword: t }))}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                    />
                  </>
                )}
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={pwdData.newPassword}
                  onChangeText={t => setPwdData(d => ({ ...d, newPassword: t }))}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={pwdData.confirmPassword}
                  onChangeText={t => setPwdData(d => ({ ...d, confirmPassword: t }))}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 8 }, changingPwd && styles.btnDisabled]}
                  onPress={handleChangePassword}
                  disabled={changingPwd}
                >
                  {changingPwd
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>
                        {user.hasPassword ? 'Update Password' : 'Set Password'}
                      </Text>}
                </TouchableOpacity>
              </>
            ) : (
              <InfoRow
                label="Password"
                value={user.hasPassword ? '••••••••' : 'Google account'}
              />
            )}
          </View>
        </Animated.View>

        {/* ── Account Status ── */}
        <Animated.View style={[animStyle, { marginTop: 16 }]}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardMeta}>ACCOUNT</Text>
                <Text style={styles.cardTitle}>Status</Text>
              </View>
            </View>
            <View style={[
              styles.statusBlock,
              {
                borderColor: user.active ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                backgroundColor: user.active ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
              },
            ]}>
              <View style={[styles.statusBlockDot, { backgroundColor: user.active ? '#22C55E' : '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusBlockTitle, { color: user.active ? '#15803D' : '#B91C1C' }]}>
                  {user.active ? 'Active' : 'Suspended'}
                </Text>
                <Text style={styles.statusBlockDesc}>
                  {user.active
                    ? 'Your account is in good standing.'
                    : 'Your account has been suspended. Please contact support.'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  errorMsg: {
    color: '#64748B',
    fontSize: 15,
  },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Banner ──
  banner: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 52,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -30,
  },
  bannerCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: 20,
  },
  bannerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  bannerEmail: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ── Pills ──
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rolePillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Avatar ──
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraTag: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cameraIcon: {
    width: 12,
    height: 9,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLens: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFirst: {
    marginTop: -24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#94A3B8',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.1,
  },

  // ── Buttons ──
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 4,
  },
  editBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  btnDisabled: { opacity: 0.5 },

  // ── Info Row ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // ── Input ──
  inputLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },

  // ── Notice Box ──
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    gap: 10,
  },
  noticeBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    alignSelf: 'stretch',
  },
  noticeText: {
    flex: 1,
    color: '#1D4ED8',
    fontSize: 13,
    lineHeight: 20,
  },

  // ── Status Block ──
  statusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  statusBlockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  statusBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  statusBlockDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});