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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API, { getApiOrigin } from '../api/client';
import SearchBar from '../components/SearchBar';
import ServiceGrid from '../components/ServiceGrid';
import MartSection from '../components/MartSection';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/constants';
import { href } from '../utils/routes';
import { colors, radius, spacing } from '../theme/colors';
import BrandMark from '../components/BrandMark';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, cart, cartTotal } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showLocation, setShowLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState({});

  const origin = getApiOrigin();
  const nowHour = new Date().getHours();
  const isStoreOpen = nowHour >= 9 && nowHour < 20;

  useEffect(() => {
    if (!user?.address?.lat) setShowLocation(true);
  }, [user?.address?.lat]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          API.get('/print-services'),
          API.get('/products/categories/all'),
        ]);
        if (!cancelled) {
          setServices(servicesRes.data.services || []);
          setCategories(categoriesRes.data.categories || []);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.locationBtn} onPress={() => setShowLocation(true)}>
            <Feather name="map-pin" size={18} color={colors.primary} />
            <View style={styles.locText}>
              <Text style={styles.locLabel}>Delivering to</Text>
              <Text style={styles.locAddr} numberOfLines={1}>
                {user?.address?.label || user?.address?.full || 'Set Location'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => router.push(href.wallet)}
          >
            <Feather name="credit-card" size={18} color={colors.accent} />
            <Text style={styles.walletAmt}>{formatPrice(user?.walletBalance || 0)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchPad}>
          <SearchBar />
        </View>
        <View style={styles.noticeWrap}>
          <View style={[styles.noticeDot, isStoreOpen ? styles.noticeDotOpen : styles.noticeDotClosed]} />
          <Text style={styles.noticeText}>
            Notice: Store is {isStoreOpen ? 'Open' : 'Closed'} now
          </Text>
          <Text style={styles.noticeTime}>9 AM - 8 PM</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push(href.printStore)}
          style={styles.bannerPrint}
        >
          <LinearGradient
            colors={['#f4f4f5', '#e8e8eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerInner}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Get it printed</Text>
              <View style={styles.bannerSubRow}>
                <Feather name="clock" size={14} color={colors.textSecondary} />
                <Text style={styles.bannerSub}> Delivered within 30 minutes</Text>
              </View>
            </View>
            {!imgErr.printer ? (
              <Image
                source={{ uri: `${origin}/images/printer.png` }}
                style={styles.bannerImg}
                onError={() => setImgErr((s) => ({ ...s, printer: true }))}
              />
            ) : (
              <View style={styles.bannerFallback}>
                <MaterialCommunityIcons name="printer-outline" size={44} color={colors.primaryLight} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.miniRow}>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniPassport]}
            onPress={() => router.push(href.passportPhotos)}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.miniTitle}>Passport Photos</Text>
              <Text style={styles.miniSub}>Pro quality · ₹40/8 pics</Text>
            </View>
            {!imgErr.pass ? (
              <Image
                source={{ uri: `${origin}/images/passport-photo.png` }}
                style={styles.miniImg}
                onError={() => setImgErr((s) => ({ ...s, pass: true }))}
              />
            ) : (
              <View style={styles.miniImgFallback}>
                <Feather name="image" size={28} color={colors.primaryLight} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniPvc]}
            onPress={() => router.push(href.pvcCard)}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.miniTitle}>PVC Card Print</Text>
              <Text style={styles.miniSub}>Front + back upload</Text>
            </View>
            <Feather name="credit-card" size={28} color={colors.primaryLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniDemand]}
            onPress={() => router.push(href.onDemandPrint)}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.miniTitle}>Bulk / Custom</Text>
              <Text style={styles.miniSub}>Call or drop a request</Text>
            </View>
            <Feather name="phone" size={28} color={colors.primaryLight} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
        ) : (
          <>
            <ServiceGrid services={services} />
            <MartSection categories={categories} />
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <BrandMark size={48} iconSize={24} />
            <View>
              <Text style={styles.footerName}>Shubham print&apos;s</Text>
              <Text style={styles.footerTag}>9350336367</Text>
            </View>
          </View>
          <Text style={styles.footerSmall}>garg80912@gmail.com</Text>
        </View>
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: Math.max(insets.bottom, 12) + 56 }]}
          onPress={() => router.push(href.checkout)}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingInner}
          >
            <View>
              <Text style={styles.fcCount}>{cart.length} item(s)</Text>
              <Text style={styles.fcTotal}>{formatPrice(cartTotal)}</Text>
            </View>
            <View style={styles.fcActionRow}>
              <Text style={styles.fcAction}>Checkout</Text>
              <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <LocationPicker visible={showLocation} onClose={() => setShowLocation(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 10,
  },
  locationBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  locText: { marginLeft: 8, flex: 1 },
  locLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  locAddr: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletAmt: { fontSize: 14, fontWeight: '800', color: colors.accent },
  searchPad: { paddingHorizontal: spacing.page },
  noticeWrap: {
    marginHorizontal: spacing.page,
    marginTop: 10,
    marginBottom: 12,
    minHeight: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noticeDotOpen: { backgroundColor: colors.accent },
  noticeDotClosed: { backgroundColor: colors.danger },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  noticeTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bannerPrint: {
    marginHorizontal: spacing.page,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    minHeight: 120,
  },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  bannerSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  bannerSub: { fontSize: 14, color: colors.textSecondary },
  bannerImg: { width: 100, height: 90, resizeMode: 'contain' },
  bannerFallback: {
    width: 100,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginBottom: 8,
  },
  miniBanner: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  miniPassport: { backgroundColor: '#f2f2f4' },
  miniDemand: { backgroundColor: '#ececee' },
  miniPvc: { backgroundColor: '#efeff2' },
  miniTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  miniSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  miniImg: { width: 56, height: 56, resizeMode: 'contain' },
  miniImgFallback: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: spacing.page,
    paddingBottom: 20,
  },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  footerName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  footerTag: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  footerSmall: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  floatingCart: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  floatingInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  fcCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  fcTotal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  fcActionRow: { flexDirection: 'row', alignItems: 'center' },
  fcAction: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
