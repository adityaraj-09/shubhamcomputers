import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/client';
import { formatDateTime } from '../../utils/constants';
import { colors, radius, spacing } from '../../theme/colors';
import { href } from '../../utils/routes';

const statusFlow = ['confirmed', 'delivered'];
const statusColors = {
  placed: '#78716c',
  confirmed: '#b45309',
  delivered: '#14532d',
  cancelled: '#dc2626',
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function ManageOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/admin/orders');
      setOrders(data.orders || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      Toast.show({ type: 'success', text1: `Marked as ${newStatus.replace(/-/g, ' ')}` });
      fetchOrders();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to update',
      });
    }
  };

  const getNextStatus = (current) => {
    const idx = statusFlow.indexOf(current);
    return idx !== -1 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const filters = ['all', 'confirmed', 'delivered', 'cancelled'];
  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

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
        <Text style={styles.topTitle}>Manage Orders</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipT, filter === f && styles.chipTOn]}>
              {f === 'all' ? 'All' : f.replace(/-/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.count}>
        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <Text style={styles.empty}>No orders found</Text>
        ) : (
          filteredOrders.map((order) => {
            const next = getNextStatus(order.status);
            const color = statusColors[order.status] || '#888';
            const open = expanded[order._id];
            const itemCount = order.items?.length || 0;

            return (
              <View key={order._id} style={styles.card}>
                <View style={styles.row1}>
                  <View>
                    <Text style={styles.oid}>{order.orderId}</Text>
                    <Text style={styles.ago}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.statusT, { color }]}>
                      {order.status === 'out-for-delivery' ? 'Out for delivery' : order.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cust}>{order.customer?.name || 'Customer'}</Text>
                {order.customer?.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
                    style={styles.phoneRow}
                  >
                    <Feather name="phone" size={12} color={colors.primary} />
                    <Text style={styles.phone}>{order.customer.phone}</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.metaRow}>
                  <View style={styles.timeRow}>
                    <Feather name="clock" size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.meta}>{formatDateTime(order.createdAt)}</Text>
                  </View>
                  <Text style={styles.amt}>₹{order.amount}</Text>
                </View>
                <View style={styles.addrRow}>
                  <Feather name="map-pin" size={14} color={colors.textMuted} style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={styles.addr} numberOfLines={3}>
                    {order.deliveryAddress?.full ||
                      order.deliveryAddress?.label ||
                      'Address not available'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.toggle}
                  onPress={() => setExpanded((e) => ({ ...e, [order._id]: !e[order._id] }))}
                >
                  <Text style={styles.toggleT}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                  <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {open &&
                  order.items?.map((item, i) => (
                    <View key={i} style={styles.itemCard}>
                      <Text style={styles.itemBadge}>{item.type?.toUpperCase()}</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                  ))}

                <View style={styles.actions}>
                  {order.status === 'confirmed' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => updateStatus(order._id, 'cancelled')}
                    >
                      <Text style={styles.cancelT}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  {next && (
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={() => updateStatus(order._id, next)}
                    >
                      <Text style={styles.nextT}>Mark {next.replace(/-/g, ' ')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
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
  filterBar: { paddingHorizontal: spacing.page, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  chipT: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  chipTOn: { color: colors.primaryLight },
  count: { paddingHorizontal: spacing.page, color: colors.textMuted, marginBottom: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  oid: { fontWeight: '800', color: colors.textPrimary, fontSize: 15 },
  ago: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusT: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cust: { marginTop: 10, fontWeight: '700', color: colors.textPrimary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  phone: { color: colors.primary, fontSize: 13 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 12, color: colors.textSecondary },
  amt: { fontWeight: '800', color: colors.accent, fontSize: 16 },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  addr: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  toggleT: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  itemCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemBadge: { fontSize: 10, fontWeight: '800', color: colors.primaryLight },
  itemName: { fontSize: 14, color: colors.textPrimary, marginTop: 4 },
  itemPrice: { fontSize: 13, color: colors.accent, marginTop: 4, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.danger + '22',
  },
  cancelT: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  nextBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary + '33',
  },
  nextT: { color: colors.primaryLight, fontWeight: '700', fontSize: 13 },
});
