import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../../api/client';
import { colors, radius, spacing } from '../../theme/colors';
import { href } from '../../utils/routes';

const UNITS = ['piece', 'pack', 'box', 'ream', 'set'];

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    mrp: '',
    image: '',
    stock: '',
    unit: 'piece',
    brand: '',
    tags: '',
    isFeatured: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/products/categories/all');
        if (data.categories) setCategories(data.categories);
      } catch {}
    })();
  }, []);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) {
      Toast.show({ type: 'error', text1: 'Name, price and stock are required' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        stock: Number(form.stock),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await API.post('/admin/products', payload);
      Toast.show({ type: 'success', text1: 'Product added!' });
      router.push(href.adminScreens.manageProducts);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to add product',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push(href.adminScreens.manageProducts)}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Add Product</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.page, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Product Name *" value={form.name} onChangeText={(t) => handleChange('name', t)} />
        <Field
          label="Description"
          value={form.description}
          onChangeText={(t) => handleChange('description', t)}
          multiline
        />
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !form.category && styles.chipOn]}
            onPress={() => handleChange('category', '')}
          >
            <Text style={styles.chipT}>None</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c._id}
              style={[styles.chip, form.category === c._id && styles.chipOn]}
              onPress={() => handleChange('category', c._id)}
            >
              <Text style={[styles.chipT, form.category === c._id && styles.chipTOn]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field
              label="Price (₹) *"
              value={form.price}
              onChangeText={(t) => handleChange('price', t)}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="MRP (₹)"
              value={form.mrp}
              onChangeText={(t) => handleChange('mrp', t)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field
              label="Stock *"
              value={form.stock}
              onChangeText={(t) => handleChange('stock', t)}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, form.unit === u && styles.chipOn]}
                  onPress={() => handleChange('unit', u)}
                >
                  <Text style={[styles.chipT, form.unit === u && styles.chipTOn]}>
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        <Field
          label="Image URL"
          value={form.image}
          onChangeText={(t) => handleChange('image', t)}
        />
        <Field label="Brand" value={form.brand} onChangeText={(t) => handleChange('brand', t)} />
        <Field
          label="Tags (comma separated)"
          value={form.tags}
          onChangeText={(t) => handleChange('tags', t)}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => handleChange('isFeatured', !form.isFeatured)}
        >
          <Text style={styles.toggleL}>Featured Product</Text>
          <Text style={styles.toggleV}>{form.isFeatured ? 'Yes' : 'No'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ marginTop: 20 }}>
          <View style={[styles.submit, loading && { opacity: 0.6 }]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitT}>Add Product</Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  chips: { marginBottom: 14, maxHeight: 44 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  chipT: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTOn: { color: colors.primaryLight },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleL: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  toggleV: { fontSize: 15, color: colors.primaryLight, fontWeight: '700' },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  submitT: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
