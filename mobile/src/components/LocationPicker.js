import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { getCurrentLocation } from '../utils/location';
import { STORE_LOCATION } from '../utils/constants';
import { colors, radius } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (!data || data.error) return null;
    const a = data.address || {};
    const area = a.neighbourhood || a.suburb || a.village || a.town || a.county || '';
    const city = a.city || a.town || a.village || a.state_district || '';
    const short = [area, city].filter(Boolean).join(', ');
    return {
      short: short || data.display_name?.split(',')[0] || 'Current Location',
      full: data.display_name || 'Current Location',
    };
  } catch {
    return null;
  }
}

async function geocodeAddress(query) {
  const encoded = encodeURIComponent(`${query}, Jhajjar, Haryana, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function searchAddressSuggestions(query) {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const encoded = encodeURIComponent(`${q}, Jhajjar, Haryana, India`);
    const url =
      `https://nominatim.openstreetmap.org/search?q=${encoded}` +
      '&format=json&addressdetails=1&limit=6&countrycodes=in&namedetails=1';
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ShubhamPrints/1.0 (garg80912@gmail.com)',
      },
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: item.place_id?.toString() || `${item.lat}-${item.lon}`,
      label: item.display_name,
      full: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

export default function LocationPicker({ visible, onClose }) {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
    },
    []
  );

  const requestSuggestions = (value) => {
    if (suggestionsTimerRef.current) clearTimeout(suggestionsTimerRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    suggestionsTimerRef.current = setTimeout(async () => {
      const list = await searchAddressSuggestions(value);
      setSuggestions(list);
      setLoadingSuggestions(false);
    }, 350);
  };

  const saveAddress = async ({ label, full, lat, lng }) => {
    const res = await API.put('/users/address', {
      label: label || 'Home',
      full,
      lat,
      lng,
    });
    updateUser({ address: res.data.address });
    Toast.show({ type: 'success', text1: 'Address saved!' });
    onClose();
  };

  const handleCurrentLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const coords = await getCurrentLocation();
      const place = await reverseGeocode(coords.lat, coords.lng);
      const label = place?.short || 'Current Location';
      const full = place?.full || 'Current Location';
      const res = await API.put('/users/address', {
        label,
        full,
        lat: coords.lat,
        lng: coords.lng,
      });
      updateUser({ address: res.data.address });
      Toast.show({ type: 'success', text1: `Location set to ${label}` });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to get location';
      setError(msg);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddress = async () => {
    if (!address.trim()) {
      setError('Please enter your address');
      return;
    }
    setLoading(true);
    setSearching(true);
    setError('');
    try {
      let coords = await geocodeAddress(address.trim());
      if (!coords) {
        coords = { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng };
      }
      await saveAddress({
        label: address.trim().split(',')[0] || 'Home',
        full: address.trim(),
        lat: coords.lat,
        lng: coords.lng,
      });
    } catch (err) {
      try {
        await saveAddress({
          label: address.trim().split(',')[0] || 'Home',
          full: address.trim(),
          lat: STORE_LOCATION.lat,
          lng: STORE_LOCATION.lng,
        });
      } catch (e) {
        const msg = e.response?.data?.error || 'Failed to save address';
        setError(msg);
        Toast.show({ type: 'error', text1: msg });
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Feather name="map-pin" size={18} color={colors.primary} />
                <Text style={styles.modalTitle}>Set delivery location</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.descRow}>
              <Feather name="info" size={14} color={colors.textMuted} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.desc}>
                Delivery within 3 km of our Jhajjar store, typically under 30 minutes.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCurrentLocation}
              disabled={loading}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.primaryBtn, loading && !searching && styles.btnDis]}
              >
                {loading && !searching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="navigation" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Use Current Location</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter your address in Jhajjar..."
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  setError('');
                  requestSuggestions(t);
                }}
                maxLength={200}
              />
              <TouchableOpacity
                style={styles.searchIconBtn}
                onPress={handleManualAddress}
                disabled={loading}
              >
                {searching ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Feather name="search" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
            {loadingSuggestions && (
              <View style={styles.suggestionsBox}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.suggestionsHint}>Searching locations...</Text>
              </View>
            )}
            {!loadingSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.suggestionItem}
                    onPress={async () => {
                      setAddress(s.full);
                      setSuggestions([]);
                      setSearching(true);
                      setError('');
                      try {
                        await saveAddress({
                          label: s.label.split(',')[0] || 'Home',
                          full: s.full,
                          lat: s.lat,
                          lng: s.lng,
                        });
                      } catch (e) {
                        const msg = e.response?.data?.error || 'Failed to save address';
                        setError(msg);
                        Toast.show({ type: 'error', text1: msg });
                      } finally {
                        setSearching(false);
                      }
                    }}
                  >
                    <Feather name="map-pin" size={14} color={colors.primary} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              onPress={handleManualAddress}
              disabled={loading}
              style={[styles.secondaryBtn, loading && styles.btnDis]}
            >
              <Text style={styles.secondaryBtnText}>{searching ? 'Saving...' : 'Save Address'}</Text>
            </TouchableOpacity>
            {!!error && <Text style={styles.err}>{error}</Text>}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: { width: '100%' },
  modalInner: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  descRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  desc: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  btnWrap: { marginBottom: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDis: { opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchIconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionsBox: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  suggestionsHint: { color: colors.textMuted, fontSize: 12 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryBtn: {
    backgroundColor: colors.bgSurface,
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.textPrimary, fontWeight: '600' },
  err: { color: colors.danger, marginTop: 10, fontSize: 13 },
});
