import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice, formatDateTime, ORDER_STATUS_MAP } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, cart, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data.orders || []);
    } catch {
      console.warn('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const { data } = await API.put(`/orders/${orderId}/cancel`);
      Toast.show({ type: 'success', text1: 'Order cancelled. Amount refunded.' });
      updateUser({ walletBalance: data.walletBalance });
      fetchOrders();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.error || 'Failed to cancel',
      });
    }
  };

  const goCheckout = () => {
    router.push(href.checkout);
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
        <Text style={styles.pageTitle}>My Orders</Text>
        {cart.length > 0 ? (
          <TouchableOpacity onPress={goCheckout} style={styles.cartBtn}>
            <Feather name="shopping-cart" size={14} color="#fff" />
            <Text style={styles.cartBtnText}>Cart ({cart.length})</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.page,
          paddingBottom: spacing.bottomInset,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.hint}>Loading...</Text>
        ) : orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Feather name="package" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No orders yet.</Text>
            <TouchableOpacity onPress={() => router.push(href.home)}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.shopBtn}
              >
                <Text style={styles.shopBtnText}>Shop Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => {
            const statusInfo = ORDER_STATUS_MAP[order.status] || {};
            return (
              <View key={order._id} style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.orderId}>{order.orderId}</Text>
                  <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.badgeText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.summary}>
                  {order.items.map((item, idx) => (
                    <Text key={idx} style={styles.summaryLine}>
                      {item.name} × {item.quantity}
                    </Text>
                  ))}
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.amt}>{formatPrice(order.amount)}</Text>
                  <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
                </View>
                {order.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => cancelOrder(order._id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                )}
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, flex: 1, marginLeft: 8 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cartBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  shopBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  shopBtnText: { color: '#fff', fontWeight: '800' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  summary: { marginTop: 10 },
  summaryLine: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  amt: { fontSize: 18, fontWeight: '800', color: colors.accent },
  date: { fontSize: 12, color: colors.textMuted },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.danger + '22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
