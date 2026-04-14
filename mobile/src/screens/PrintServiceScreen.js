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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

export default function PrintServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { addToCart } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/print-services/${id}`);
        const svc = data.service;
        setService(svc);
        const defaults = {};
        const opts = svc.options || {};
        if (opts.colorOptions?.length) defaults.color = opts.colorOptions[0];
        if (opts.sizeOptions?.length) defaults.size = opts.sizeOptions[0];
        if (opts.sidesOptions?.length) defaults.sides = opts.sidesOptions[0];
        if (opts.paperOptions?.length) defaults.paper = opts.paperOptions[0];
        if (opts.bindingOptions?.length) defaults.binding = opts.bindingOptions[0];
        setSelectedOptions(defaults);
      } catch {
        Toast.show({ type: 'error', text1: 'Service not found' });
        router.replace(href.home);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  const calculatePrice = () => {
    if (!service) return 0;
    let price = service.basePrice;
    if (selectedOptions.color) price *= selectedOptions.color.priceMultiplier || 1;
    if (selectedOptions.size) price *= selectedOptions.size.priceMultiplier || 1;
    if (selectedOptions.sides) price *= selectedOptions.sides.priceMultiplier || 1;
    if (selectedOptions.paper) price *= selectedOptions.paper.priceMultiplier || 1;
    if (selectedOptions.binding) price += selectedOptions.binding.price || 0;
    return Math.ceil(price);
  };

  const handleAddToCart = () => {
    const price = calculatePrice();
    addToCart({
      id: service._id,
      type: 'print',
      name: service.name,
      price,
      options: selectedOptions,
      customNote,
      quantity: 1,
    });
    for (let i = 1; i < quantity; i++) {
      addToCart({ id: service._id, type: 'print', name: service.name, price });
    }
    Toast.show({ type: 'success', text1: `${service.name} added to cart!` });
    router.push(href.checkout);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!service) return null;

  const unitPrice = calculatePrice();
  const totalPrice = unitPrice * quantity;
  const opts = service.options || {};

  const chip = (label, options, key, optKey = 'label') => (
    <View style={styles.optGroup}>
      <Text style={styles.optLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.chip,
              selectedOptions[key]?.[optKey] === opt[optKey] && styles.chipActive,
            ]}
            onPress={() => setSelectedOptions((p) => ({ ...p, [key]: opt }))}
          >
            <Text
              style={[
                styles.chipText,
                selectedOptions[key]?.[optKey] === opt[optKey] && styles.chipTextActive,
              ]}
            >
              {opt.label}
              {key === 'binding' && opt.price != null ? ` (+${formatPrice(opt.price)})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service.name}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{service.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{service.name}</Text>
            <Text style={styles.heroDesc}>{service.description}</Text>
            <Text style={styles.heroPrice}>From {formatPrice(service.basePrice)}/page</Text>
          </View>
        </View>

        {opts.sizeOptions?.length > 0 && chip('Paper Size', opts.sizeOptions, 'size')}
        {opts.sidesOptions?.length > 0 && chip('Print Sides', opts.sidesOptions, 'sides')}
        {opts.colorOptions?.length > 0 && chip('Color', opts.colorOptions, 'color')}
        {opts.paperOptions?.length > 0 && chip('Paper Type', opts.paperOptions, 'paper')}
        {opts.bindingOptions?.length > 0 && chip('Binding', opts.bindingOptions, 'binding')}

        <Text style={styles.optLabel}>Quantity (pages/copies)</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.qtyInput}
            keyboardType="number-pad"
            value={String(quantity)}
            onChangeText={(t) => setQuantity(Math.max(1, parseInt(t, 10) || 1))}
          />
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.optLabel}>Customization Note (optional)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="E.g., Print only pages 1-10..."
          placeholderTextColor={colors.textMuted}
          value={customNote}
          onChangeText={setCustomNote}
          multiline
          maxLength={500}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.summary}>
            {formatPrice(unitPrice)} × {quantity}
          </Text>
          <Text style={styles.total}>{formatPrice(totalPrice)}</Text>
        </View>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleAddToCart}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add to Cart • {formatPrice(totalPrice)}</Text>
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  hero: {
    flexDirection: 'row',
    padding: spacing.page,
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.page,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  heroIcon: { fontSize: 48, marginRight: 14 },
  heroName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  heroDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  heroPrice: { fontSize: 15, color: colors.accent, fontWeight: '700', marginTop: 8 },
  optGroup: { paddingHorizontal: spacing.page, marginBottom: 16 },
  optLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: spacing.page,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.page },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  chipTextActive: { color: colors.primaryLight },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.page,
    marginBottom: 16,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnText: { fontSize: 22, color: colors.textPrimary, fontWeight: '700' },
  qtyInput: {
    minWidth: 50,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  textarea: {
    marginHorizontal: spacing.page,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 80,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summary: { fontSize: 13, color: colors.textSecondary },
  total: { fontSize: 22, fontWeight: '800', color: colors.accent },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
