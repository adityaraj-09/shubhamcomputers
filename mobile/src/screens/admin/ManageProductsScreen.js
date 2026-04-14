import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/client';
import { colors, radius, spacing } from '../../theme/colors';
import { href } from '../../utils/routes';

const UNITS = ['piece', 'pack', 'box', 'ream', 'set'];

export default function ManageProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=100');
      setProducts(data.products || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/products/categories/all');
      setCategories(data.categories || []);
    } catch {}
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category?._id || product.category || '',
      price: product.price ?? '',
      mrp: product.mrp ?? '',
      stock: product.stock ?? '',
      unit: product.unit || 'piece',
      image: product.image || '',
      brand: product.brand || '',
      tags: (product.tags || []).join(', '),
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
    });
  };

  const handleChange = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    if (!editForm.name || editForm.price === '') {
      Toast.show({ type: 'error', text1: 'Name and price are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        mrp: editForm.mrp !== '' ? Number(editForm.mrp) : undefined,
        stock: Number(editForm.stock),
        tags: editForm.tags
          ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      await API.put(`/admin/products/${id}`, payload);
      Toast.show({ type: 'success', text1: 'Product updated' });
      setEditingId(null);
      fetchProducts();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update product' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (id) => {
    Alert.alert('Delete product?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.delete(`/admin/products/${id}`);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            fetchProducts();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete product' });
          }
        },
      },
    ]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        (p.category?.name || '').toLowerCase().includes(q)
    );
  }, [products, search]);

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
        <Text style={styles.topTitle}>Manage Products</Text>
        <TouchableOpacity onPress={() => router.push(href.adminScreens.addProduct)}>
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, brand or category…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Feather name="x" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.count}>
        {filtered.length}
        {search ? ` of ${products.length}` : ''} product{filtered.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={styles.noRes}>No products match &quot;{search}&quot;</Text>
        ) : (
          filtered.map((product) => (
            <View
              key={product._id}
              style={[styles.card, editingId === product._id && styles.cardEdit]}
            >
              {editingId === product._id ? (
                <View>
                  {!!editForm.image && (
                    <Image source={{ uri: editForm.image }} style={styles.prevImg} />
                  )}
                  <E label="Image URL" v={editForm.image} onChangeText={(t) => handleChange('image', t)} />
                  <E label="Product Name *" v={editForm.name} onChangeText={(t) => handleChange('name', t)} />
                  <E
                    label="Description"
                    v={editForm.description}
                    onChangeText={(t) => handleChange('description', t)}
                    multiline
                  />
                  <Text style={styles.el}>Category</Text>
                  <ScrollView horizontal style={{ marginBottom: 10 }}>
                    <TouchableOpacity
                      style={[styles.cchip, !editForm.category && styles.cchipOn]}
                      onPress={() => handleChange('category', '')}
                    >
                      <Text style={styles.cchipT}>None</Text>
                    </TouchableOpacity>
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c._id}
                        style={[styles.cchip, editForm.category === c._id && styles.cchipOn]}
                        onPress={() => handleChange('category', c._id)}
                      >
                        <Text style={[styles.cchipT, editForm.category === c._id && { color: colors.primaryLight }]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={styles.erow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <E
                        label="Price *"
                        v={String(editForm.price)}
                        onChangeText={(t) => handleChange('price', t)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <E
                        label="MRP"
                        v={String(editForm.mrp)}
                        onChangeText={(t) => handleChange('mrp', t)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={styles.erow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <E
                        label="Stock *"
                        v={String(editForm.stock)}
                        onChangeText={(t) => handleChange('stock', t)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.el}>Unit</Text>
                      <ScrollView horizontal>
                        {UNITS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.cchip, editForm.unit === u && styles.cchipOn]}
                            onPress={() => handleChange('unit', u)}
                          >
                            <Text style={styles.cchipT}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                  <E label="Brand" v={editForm.brand} onChangeText={(t) => handleChange('brand', t)} />
                  <E label="Tags" v={editForm.tags} onChangeText={(t) => handleChange('tags', t)} />
                  <TouchableOpacity
                    style={styles.rowT}
                    onPress={() => handleChange('isActive', !editForm.isActive)}
                  >
                    <Text style={styles.el}>Active</Text>
                    <Text style={styles.tv}>{editForm.isActive ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rowT}
                    onPress={() => handleChange('isFeatured', !editForm.isFeatured)}
                  >
                    <Text style={styles.el}>Featured</Text>
                    <Text style={styles.tv}>{editForm.isFeatured ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                  <View style={styles.eact}>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => saveEdit(product._id)}
                      disabled={saving}
                    >
                      <Text style={styles.saveT}>{saving ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.canBtn} onPress={() => setEditingId(null)}>
                      <Text style={styles.canT}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.thumb}>
                    {product.image ? (
                      <Image source={{ uri: product.image }} style={styles.thumbImg} />
                    ) : (
                      <Feather name="package" size={28} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pname}>{product.name}</Text>
                    <Text style={styles.pmeta}>
                      ₹{product.price}
                      {product.mrp > product.price ? ` / ₹${product.mrp}` : ''} · Stock: {product.stock}
                    </Text>
                    <Text
                      style={[
                        styles.status,
                        { color: product.isActive ? colors.accent : colors.danger },
                      ]}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => startEdit(product)} style={styles.iconBtn}>
                    <Feather name="edit-2" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteProduct(product._id)} style={styles.iconBtn}>
                    <Feather name="trash-2" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function E({ label, v, onChangeText, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.el}>{label}</Text>
      <TextInput
        style={[styles.ein, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
        value={v}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
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
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: colors.textPrimary, fontSize: 15 },
  count: { paddingHorizontal: spacing.page, color: colors.textMuted, marginBottom: 8 },
  noRes: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEdit: { borderColor: colors.primary },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  pname: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  pmeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  status: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  iconBtn: { padding: 8 },
  prevImg: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10, resizeMode: 'contain' },
  el: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  ein: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    padding: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  erow: { flexDirection: 'row' },
  cchip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    marginBottom: 4,
  },
  cchipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  cchipT: { fontSize: 12, color: colors.textSecondary },
  rowT: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },
  tv: { color: colors.primaryLight, fontWeight: '700' },
  eact: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveT: { color: colors.textPrimary, fontWeight: '800' },
  canBtn: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  canT: { color: colors.textPrimary, fontWeight: '700' },
});
