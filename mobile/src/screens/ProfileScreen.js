import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice, formatDate } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAvatarLoading(true);
    try {
      const form = new FormData();
      form.append('files', {
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      const { data: uploadData } = await API.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl =
        uploadData.files?.[0]?.thumbnailLink || uploadData.files?.[0]?.viewLink;
      if (!avatarUrl) throw new Error('No URL');
      const { data } = await API.put('/auth/update-profile', { avatar: avatarUrl });
      updateUser(data.user);
      Toast.show({ type: 'success', text1: 'Avatar updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update avatar' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const startEditName = () => {
    setNameVal(user?.name || '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (nameVal.trim().length < 2) {
      Toast.show({ type: 'error', text1: 'Name must be at least 2 characters' });
      return;
    }
    setNameLoading(true);
    try {
      const { data } = await API.put('/auth/update-profile', { name: nameVal.trim() });
      updateUser(data.user);
      setEditingName(false);
      Toast.show({ type: 'success', text1: 'Name updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update name' });
    } finally {
      setNameLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.page,
          paddingBottom: spacing.bottomInset,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickAvatar} disabled={avatarLoading}>
            <View style={styles.avatar}>
              {avatarLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.camBtn} onPress={pickAvatar}>
            <Feather name="camera" size={16} color="#fff" />
          </TouchableOpacity>

          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={styles.nameInput}
                value={nameVal}
                onChangeText={setNameVal}
                maxLength={100}
              />
              <TouchableOpacity onPress={saveName} disabled={nameLoading}>
                <Feather name="check" size={22} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingName(false)}>
                <Feather name="x" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <TouchableOpacity onPress={startEditName}>
                <Feather name="edit-2" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.userId}>{user?.userId}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          {[
            { icon: 'phone', label: 'Phone', value: `+91 ${user?.phone}` },
            {
              icon: 'credit-card',
              label: 'Wallet Balance',
              value: formatPrice(user?.walletBalance || 0),
              valueColor: colors.accent,
            },
            { icon: 'shopping-bag', label: 'Total Orders', value: String(user?.numOrders || 0) },
            {
              icon: 'map-pin',
              label: 'Address',
              value: user?.address?.full || user?.address?.label || 'Not set',
            },
            {
              icon: 'calendar',
              label: 'Member Since',
              value: formatDate(user?.createdAt || new Date()),
            },
          ].map((row, i) => (
            <View key={i} style={styles.row}>
              <Feather name={row.icon} size={20} color={colors.primary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[styles.rowValue, row.valueColor && { color: row.valueColor }]}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => router.push(href.admin)}
          >
            <Feather name="settings" size={18} color={colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.adminBtnText}>Admin dashboard</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginLeft: 12, flex: 1 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 40, fontWeight: '800', color: colors.primaryLight },
  camBtn: {
    position: 'absolute',
    top: 88,
    right: '28%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.bgCard,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  nameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userId: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  adminBadge: {
    marginTop: 10,
    backgroundColor: colors.primary + '33',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: { color: colors.primaryLight, fontWeight: '800', fontSize: 12 },
  details: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowIcon: { marginRight: 14 },
  rowLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' },
  rowValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  adminBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBtnText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  logoutBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
  },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
