import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { addToCart } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data.product);
      } catch {
        Toast.show({ type: 'error', text1: 'Product not found' });
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: product._id,
        type: 'mart',
        name: product.name,
        price: product.price,
        mrp: product.mrp || null,
        image: product.image || null,
      });
    }
    Toast.show({ type: 'success', text1: `${product.name} added to cart!` });
    router.push(href.checkout);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!product) return null;

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imgBox}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.img} resizeMode="contain" />
          ) : (
            <View style={styles.imageFallback}>
              <Feather name="package" size={56} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          {!!product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.mrp > product.price && (
              <>
                <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>
          {!!product.description && (
            <Text style={styles.desc}>{product.description}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Unit: {product.unit}</Text>
            <Text style={styles.meta}>
              Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Feather name="minus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                <Feather name="plus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          onPress={handleAdd}
          disabled={product.stock <= 0}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[styles.cta, product.stock <= 0 && { opacity: 0.4 }]}
          >
            <Feather name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.ctaText}>
              Add to Cart • {formatPrice(product.price * qty)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  imgBox: {
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 200,
    justifyContent: 'center',
  },
  img: { width: '100%', height: 200 },
  imageFallback: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    marginHorizontal: spacing.page,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  brand: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  price: { fontSize: 26, fontWeight: '800', color: colors.accent },
  mrp: { fontSize: 15, color: colors.textMuted, textDecorationLine: 'line-through' },
  badge: { backgroundColor: colors.accent + '33', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.accent },
  desc: { fontSize: 14, color: colors.textSecondary, marginTop: 12, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  meta: { fontSize: 12, color: colors.textMuted },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyVal: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, minWidth: 28, textAlign: 'center' },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
