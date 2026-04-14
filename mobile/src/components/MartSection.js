import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius, shadows, typography } from '../theme/colors';
import { href } from '../utils/routes';

export default function MartSection({ categories }) {
  const router = useRouter();
  const { addToCart } = useAuth();
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      try {
        const params = activeCategory ? `?category=${activeCategory}&limit=40` : '?limit=40';
        const { data } = await API.get(`/products${params}`);
        if (!cancelled) setProducts(data.products || []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const handleAddToCart = (product) => {
    if (product.stock < 1) {
      Toast.show({ type: 'error', text1: 'Out of stock' });
      return;
    }
    addToCart({
      id: product._id,
      type: 'mart',
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      quantity: 1,
    });
    Toast.show({ type: 'success', text1: 'Added to cart!' });
  };

  const chips =
    categories?.filter((c) => c.name !== 'All Stationery') || [];

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.titleIconWrap}>
          <Feather name="shopping-bag" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.heading, { flex: 1 }]}>Stationery mart</Text>
      </View>
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, !activeCategory && styles.chipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {chips.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.chip, activeCategory === cat._id && styles.chipActive]}
              onPress={() => setActiveCategory(cat._id)}
            >
              <Text
                style={[styles.chipText, activeCategory === cat._id && styles.chipTextActive]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loadingProducts ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <Text style={styles.empty}>No products yet in this category.</Text>
      ) : (
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
                  <View style={styles.placeholder}>
                    <Feather name="package" size={32} color={colors.textMuted} />
                  </View>
                )}
                {product.stock < 1 && (
                  <View style={styles.outBadge}>
                    <Text style={styles.outText}>Out</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddToCart(product)}
                  disabled={product.stock < 1}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.pName} numberOfLines={2}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{product.price}</Text>
                {product.mrp > product.price && (
                  <Text style={styles.mrp}>₹{product.mrp}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  titleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.accent + '18',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  chipsRow: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.primary,
  },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.primaryLight },
  loader: { padding: 32, alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '24%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  imgWrap: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  outBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: -1 },
  pName: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, minHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontSize: 12, fontWeight: '800', color: colors.accent },
  mrp: {
    fontSize: 10,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
