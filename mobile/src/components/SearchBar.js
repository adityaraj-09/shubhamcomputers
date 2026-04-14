import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import API from '../api/client';
import { formatPrice } from '../utils/constants';
import { colors, radius } from '../theme/colors';
import { href } from '../utils/routes';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], services: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setResults({ products: [], services: [] });
      return;
    }
    setLoading(true);
    try {
      const [productsRes, servicesRes] = await Promise.all([
        API.get(`/products/search/quick?q=${encodeURIComponent(q)}`),
        API.get(`/print-services/search?q=${encodeURIComponent(q)}`),
      ]);
      setResults({
        products: productsRes.data.results || [],
        services: servicesRes.data.results || [],
      });
    } catch {
      setResults({ products: [], services: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value) => {
    setQuery(value);
    setShowResults(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(value), 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ products: [], services: [] });
    setShowResults(false);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const hasResults = results.products.length > 0 || results.services.length > 0;
  const handleNavigate = (path) => {
    // Close the dropdown first, then navigate on next tick
    // so nested scroll/touch handlers do not swallow the route action.
    handleClear();
    requestAnimationFrame(() => {
      router.push(path);
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search prints, stationery..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleInput}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {!!query && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Feather name="x" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && query.length >= 2 && (
        <View style={styles.dropdown}>
          {loading && <Text style={styles.hint}>Searching...</Text>}
          {!loading && !hasResults && (
            <Text style={styles.hint}>No results for &quot;{query}&quot;</Text>
          )}
          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {results.services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Print Services</Text>
                {results.services.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={styles.item}
                    onPress={() => {
                      handleNavigate(href.printService(s._id));
                    }}
                  >
                    <View style={styles.itemIconWrap}>
                      <MaterialCommunityIcons name="printer-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{s.name}</Text>
                      <Text style={styles.itemPrice}>From {formatPrice(s.basePrice)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {results.products.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mart Products</Text>
                {results.products.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={styles.item}
                    onPress={() => {
                      handleNavigate(href.product(p._id));
                    }}
                  >
                    <View style={styles.itemIconWrap}>
                      <Feather name="package" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{p.name}</Text>
                      <Text style={styles.itemPrice}>{formatPrice(p.price)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 20, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdown: {
    marginTop: 8,
    maxHeight: 280,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  scroll: { maxHeight: 260 },
  hint: { padding: 14, color: colors.textSecondary, fontSize: 14 },
  section: { paddingVertical: 6 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemPrice: { fontSize: 13, color: colors.accent, marginTop: 2 },
});
