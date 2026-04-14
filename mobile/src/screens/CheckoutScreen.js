import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';
import FileTypeIcon from '../components/FileTypeIcon';

const COLOR_LABEL = { bw: 'Black & White', colour: 'Colour' };
const ORIENTATION_LABEL = { portrait: 'Portrait', landscape: 'Landscape' };

const isImageExt = (name = '') =>
  ['jpg', 'jpeg', 'png', 'webp'].includes(name.split('.').pop().toLowerCase());

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, cart, removeFromCart, clearCart, updateUser, cartTotal, cartCount } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [deliveryAddr, setDeliveryAddr] = useState(user?.address?.full || '');

  const hasPrintItems = cart.some((i) => i.type === 'print');
  const hasAddress = !!user?.address?.lat;

  useEffect(() => {
    setDeliveryAddr(user?.address?.full || '');
  }, [user?.address?.full]);

  useEffect(() => {
    API.get('/products?limit=10')
      .then(({ data }) => setSuggestions(data.products || []))
      .catch(() => {});
  }, []);

  const placeOrder = async () => {
    if (!hasAddress) {
      setShowLocation(true);
      return;
    }
    if (deliveryAddr.trim().length < 5) {
      Toast.show({ type: 'error', text1: 'Please enter your complete delivery address' });
      return;
    }
    if ((user?.walletBalance || 0) < cartTotal) {
      Toast.show({
        type: 'error',
        text1: `Insufficient balance. Need ₹${cartTotal - (user?.walletBalance || 0)} more.`,
      });
      return;
    }

    setPlacing(true);
    try {
      const items = cart.map((item) => {
        const base = {
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          options: item.printConfig || item.options || {},
          customNote: item.customNote || '',
          fileUrl: item.fileUrl || '',
        };
        if (item.type === 'mart') {
          if (isObjectId(item.id)) base.productId = item.id;
        } else if (item.driveFileId) {
          base.driveFileId = item.driveFileId;
        } else if (isObjectId(item.id)) {
          base.productId = item.id;
        }
        return base;
      });

      const { data } = await API.post('/orders', {
        items,
        deliveryAddress: deliveryAddr.trim(),
      });
      Toast.show({
        type: 'success',
        text1: `Order placed! ${data.order.orderId}`,
      });
      const newBalance = (user?.walletBalance || 0) - cartTotal;
      updateUser({
        walletBalance: newBalance,
        numOrders: (user?.numOrders || 0) + 1,
      });
      clearCart();
      router.replace(href.orders);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Failed to place order',
      });
    } finally {
      setPlacing(false);
    }
  };

  const totalPages = cart
    .filter((i) => i.type === 'print')
    .reduce((s, i) => s + (i.printConfig?.pages || 1) * (i.printConfig?.copies || 1), 0);
  const itemCount = cartCount;

  if (cart.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.chkHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.chkTitle}>Checkout</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-cart" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity onPress={() => router.push(href.home)}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Shop Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.chkHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.chkTitle}>Checkout</Text>
        <TouchableOpacity onPress={() => { clearCart(); router.back(); }}>
          <Text style={styles.clearText}>Clear cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#f4f4f5', '#e4e4e8']} style={styles.deliveryCard}>
          <View style={styles.deliveryIconWrap}>
            <Feather name="clock" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryTime}>Delivery in 30 minutes</Text>
            <Text style={styles.deliverySub}>
              {totalPages > 0
                ? `${totalPages} page${totalPages !== 1 ? 's' : ''}`
                : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </LinearGradient>

        {hasPrintItems && (
          <Text style={styles.printNotice}>
            Delivery time may have increased due to print items.
          </Text>
        )}

        <View style={styles.items}>
          {cart.map((item, idx) => {
            const cfg = item.printConfig;
            const specs = cfg
              ? [
                  cfg.copies > 1 ? `${cfg.copies} copies` : null,
                  `${cfg.pages} page${cfg.pages !== 1 ? 's' : ''}`,
                  COLOR_LABEL[cfg.color] || cfg.color,
                  ORIENTATION_LABEL[cfg.orientation] || cfg.orientation,
                ]
                  .filter(Boolean)
                  .join(', ')
              : null;
            const hasThumb = item.image && isImageExt(item.name || '');

            return (
              <View key={`${item.type}-${item.id}-${idx}`} style={styles.chkItem}>
                <View style={styles.thumb}>
                  {hasThumb || item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.thumbImg}
                    />
                  ) : item.type === 'print' ? (
                    <FileTypeIcon fileName={item.name || ''} size={28} />
                  ) : (
                    <Feather name="package" size={26} color={colors.textSecondary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.type === 'print'
                      ? `File ${idx + 1} - ${String(item.driveFileId || item.id || '').slice(0, 28)}…`
                      : item.name}
                  </Text>
                  {!!specs && <Text style={styles.specs}>{specs}</Text>}
                  {item.type === 'mart' && item.quantity > 1 && (
                    <Text style={styles.specs}>Qty: {item.quantity}</Text>
                  )}
                  <TouchableOpacity onPress={() => removeFromCart(item.id, item.type)}>
                    <Text style={styles.remove}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                  <Text style={styles.priceFinal}>₹{item.price * item.quantity}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestSection}>
            <Text style={styles.sectionTitle}>You might also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map((p) => (
                <TouchableOpacity
                  key={p._id}
                  style={styles.suggestCard}
                  onPress={() => router.push(href.product(p._id))}
                >
                  <View style={styles.suggestImg}>
                    {p.image ? (
                      <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Feather name="package" size={28} color={colors.textSecondary} />
                    )}
                  </View>
                  <Text style={styles.suggestName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.suggestPrice}>₹{p.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.addrLabelRow}>
          <Feather name="map-pin" size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.addrLabel}>
            Delivery Address <Text style={{ color: colors.danger }}>*</Text>
          </Text>
        </View>
        <TextInput
          style={styles.textarea}
          placeholder="House / flat no., street, landmark, area…"
          placeholderTextColor={colors.textMuted}
          value={deliveryAddr}
          onChangeText={setDeliveryAddr}
          multiline
          maxLength={300}
        />

        <View style={styles.walletRow}>
          <Text style={{ color: colors.textSecondary }}>Wallet Balance</Text>
          <Text
            style={{
              fontWeight: '800',
              color: (user?.walletBalance || 0) >= cartTotal ? colors.accent : colors.danger,
            }}
          >
            {formatPrice(user?.walletBalance || 0)}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomItems}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.bottomTotal}>₹{cartTotal}</Text>
        </View>
        <TouchableOpacity
          onPress={hasAddress ? placeOrder : () => setShowLocation(true)}
          disabled={placing}
          style={{ flex: 1, maxWidth: 220 }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[styles.payBtn, placing && { opacity: 0.6 }]}
          >
            <Text style={styles.payBtnText}>
              {placing
                ? 'Placing order…'
                : hasAddress
                  ? `Pay ₹${cartTotal}`
                  : 'Select address to continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <LocationPicker visible={showLocation} onClose={() => setShowLocation(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  chkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  chkTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  clearText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
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
  emptyText: { fontSize: 16, color: colors.textSecondary },
  shopBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, borderRadius: radius.sm },
  shopBtnText: { color: '#fff', fontWeight: '800' },
  deliveryCard: {
    marginHorizontal: spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  deliveryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(20,20,20,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deliveryTime: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  deliverySub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  printNotice: {
    marginHorizontal: spacing.page,
    fontSize: 13,
    color: colors.warning,
    marginBottom: 12,
  },
  items: { paddingHorizontal: spacing.page },
  chkItem: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  specs: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  remove: { color: colors.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },
  edit: { fontSize: 12, color: colors.primaryLight, marginBottom: 6 },
  priceFinal: { fontSize: 16, fontWeight: '800', color: colors.accent },
  suggestSection: { marginTop: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.page,
    marginBottom: 10,
  },
  suggestCard: {
    width: 120,
    marginLeft: spacing.page,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestImg: {
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  suggestName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  suggestPrice: { fontSize: 13, fontWeight: '800', color: colors.accent, marginTop: 4 },
  addrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    marginTop: 20,
  },
  addrLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  textarea: {
    marginHorizontal: spacing.page,
    marginTop: 8,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 88,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.page,
    marginTop: 16,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  bottomItems: { fontSize: 13, color: colors.textSecondary },
  bottomTotal: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  payBtn: { paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
