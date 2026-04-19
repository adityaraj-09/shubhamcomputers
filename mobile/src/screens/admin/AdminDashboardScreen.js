import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/client';
import { colors, radius, spacing } from '../../theme/colors';
import { href } from '../../utils/routes';

const statMeta = [
  { key: 'totalUsers', label: 'Total Users', icon: 'users', color: '#3f3f46' },
  { key: 'totalOrders', label: 'Total Orders', icon: 'shopping-bag', color: '#14532d' },
  { key: 'todayOrders', label: 'Today Orders', icon: 'clock', color: '#b45309' },
  { key: 'totalProducts', label: 'Products', icon: 'package', color: '#9f1239' },
  { key: 'revenue', label: 'Revenue', icon: 'dollar-sign', color: '#525252', format: 'rupee' },
  { key: 'pendingOrders', label: 'Pending', icon: 'trending-up', color: '#78716c' },
];

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/admin/dashboard');
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      } catch {
        Toast.show({ type: 'error', text1: 'Failed to load dashboard' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusColor = (status) => {
    const colorsMap = {
      placed: '#78716c',
      confirmed: '#b45309',
      delivered: '#14532d',
      cancelled: '#dc2626',
    };
    return colorsMap[status] || '#888';
  };

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
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={styles.topTitle}>Admin</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.page, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Admin Dashboard</Text>
        <Text style={styles.sub}>Shubink</Text>

        <View style={styles.grid}>
          {statMeta.map((s) => {
            const raw = stats?.[s.key];
            const val =
              s.format === 'rupee' ? `₹${(raw ?? 0).toLocaleString?.() ?? raw}` : raw ?? 0;
            return (
              <View key={s.key} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                  <Feather name={s.icon} size={16} color={s.color} />
                </View>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {[
          { title: 'Manage Orders', path: href.adminScreens.manageOrders, icon: 'shopping-bag' },
          { title: 'Manage Products', path: href.adminScreens.manageProducts, icon: 'package' },
          { title: 'Manage Users', path: href.adminScreens.manageUsers, icon: 'users' },
          { title: 'Add Product', path: href.adminScreens.addProduct, icon: 'plus-circle' },
        ].map((item) => (
          <TouchableOpacity
            key={item.path}
            style={styles.navItem}
            onPress={() => router.push(item.path)}
          >
            <Feather name={item.icon} size={22} color={colors.primary} />
            <Text style={styles.navText}>{item.title}</Text>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionH}>Recent Orders</Text>
        <TouchableOpacity onPress={() => router.push(href.adminScreens.manageOrders)}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>

        {recentOrders.length === 0 ? (
          <Text style={styles.empty}>No orders yet</Text>
        ) : (
          recentOrders.slice(0, 5).map((order) => (
            <View key={order._id} style={styles.miniCard}>
              <View style={styles.miniTop}>
                <Text style={styles.miniId}>{order.orderId}</Text>
                <View
                  style={[
                    styles.miniStatus,
                    { backgroundColor: statusColor(order.status) + '22' },
                  ]}
                >
                  <Text style={[styles.miniStatusT, { color: statusColor(order.status) }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              <View style={styles.miniBot}>
                <Text style={styles.miniName}>{order.customer?.name || 'User'}</Text>
                <Text style={styles.miniAmt}>₹{order.amount}</Text>
              </View>
            </View>
          ))
        )}
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
  h1: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statCard: {
    width: '31.5%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statVal: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10.5, color: colors.textMuted, marginTop: 3, textAlign: 'center' },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navText: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionH: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 16 },
  seeAll: { color: colors.primaryLight, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  empty: { color: colors.textMuted, paddingVertical: 16 },
  miniCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniTop: { flexDirection: 'row', justifyContent: 'space-between' },
  miniId: { fontWeight: '800', color: colors.textPrimary },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniStatusT: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  miniBot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  miniName: { color: colors.textSecondary, fontSize: 14 },
  miniAmt: { fontWeight: '800', color: colors.accent },
});
