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
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'price_low', label: 'Price ↑' },
  { id: 'price_high', label: 'Price ↓' },
  { id: 'newest', label: 'Newest' },
];

export default function MartCategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categoryId: catParam } = useLocalSearchParams();
  const categoryId = Array.isArray(catParam) ? catParam[0] : catParam;
  const { addToCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await API.get(
          `/products?category=${categoryId}&sort=${sort}&limit=50`
        );
        if (!cancelled) {
          setProducts(data.products || []);
          if (data.products?.length > 0 && data.products[0].category) {
            setCategoryName(data.products[0].category.name);
          }
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, sort]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      type: 'mart',
      name: product.name,
      price: product.price,
    });
    Toast.show({ type: 'success', text1: `${product.name} added!` });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName || 'Products'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortBar}
      >
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sortChip, sort === s.id && styles.sortChipActive]}
            onPress={() => setSort(s.id)}
          >
            <Text style={[styles.sortText, sort === s.id && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.heroFallback}>
            <Feather name="layers" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>No products in this category yet.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.card}
                onPress={() => router.push(href.product(product._id))}
                activeOpacity={0.9}
              >
                <View style={styles.imgWrap}>
                  {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.img} />
                  ) : (
                    <View style={styles.cardImgFallback}>
                      <Feather name="package" size={28} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <Text style={styles.pName} numberOfLines={2}>
                  {product.name}
                </Text>
                {!!product.brand && (
                  <Text style={styles.brand} numberOfLines={1}>
                    {product.brand}
                  </Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPrice(product.price)}</Text>
                  {product.mrp > product.price && (
                    <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddToCart(product)}
                >
                  <Feather name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  sortBar: { paddingHorizontal: spacing.page, paddingBottom: 12, gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  sortChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  sortText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  sortTextActive: { color: colors.primaryLight },
  empty: { alignItems: 'center', marginTop: 48 },
  heroFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: colors.textMuted, marginTop: 12 },
  cardImgFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  imgWrap: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  img: { width: '100%', height: '100%' },
  pName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, minHeight: 36 },
  brand: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  price: { fontSize: 15, fontWeight: '800', color: colors.accent },
  mrp: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
