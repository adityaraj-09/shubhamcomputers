import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/client';
import { colors, radius, spacing } from '../../theme/colors';
import { href } from '../../utils/routes';

export default function ManageUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.users || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = (userId) => {
    Alert.alert('Make admin?', 'This user will have full admin access.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await API.put(`/admin/users/${userId}/make-admin`);
            Toast.show({ type: 'success', text1: 'User is now an admin' });
            fetchUsers();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to update user' });
          }
        },
      },
    ]);
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push(href.admin)}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Manage Users</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.count}>{filtered.length} users</Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((u) => (
          <View key={u._id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarT}>{u.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.name}>{u.name || 'Unnamed'}</Text>
                {u.role === 'admin' && (
                  <View style={styles.adminB}>
                    <Text style={styles.adminT}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.phone}>{u.phone}</Text>
              <Text style={styles.meta}>
                ₹{u.walletBalance || 0} wallet · {u.numOrders || 0} orders
              </Text>
            </View>
            {u.role !== 'admin' && (
              <TouchableOpacity style={styles.shieldBtn} onPress={() => makeAdmin(u._id)}>
                <Feather name="shield" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.page,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: colors.textPrimary, fontSize: 15 },
  count: { paddingHorizontal: spacing.page, color: colors.textMuted, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarT: { fontSize: 20, fontWeight: '800', color: colors.primaryLight },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  adminB: {
    backgroundColor: colors.accent + '33',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminT: { fontSize: 10, fontWeight: '800', color: colors.accent },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  shieldBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
