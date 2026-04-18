import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import SearchBar from '../components/SearchBar';
import ServiceGrid from '../components/ServiceGrid';
import MartSection from '../components/MartSection';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/constants';
import { href } from '../utils/routes';
import { colors, radius, shadows, spacing } from '../theme/colors';
import BrandMark from '../components/BrandMark';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IMG_PRINTER = require('../../assets/printer_banner.jpg');
const IMG_PASSPORT = require('../../assets/photo_print_banner.jpg');
const IMG_PVC = require('../../assets/PVC_print_banner.jpg');
const IMG_BULK = require('../../assets/bulkorder_banner.jpg');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, cart, cartTotal } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showLocation, setShowLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const nowHour = new Date().getHours();
  const isStoreOpen = nowHour >= 7 && nowHour < 22;

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
          <View style={[styles.storeBadge, isStoreOpen ? styles.storeBadgeOpen : styles.storeBadgeClosed]}>
            <View style={[styles.storeDot, isStoreOpen ? styles.storeDotOpen : styles.storeDotClosed]} />
            <Text style={[styles.storeBadgeText, isStoreOpen ? styles.storeBadgeTextOpen : styles.storeBadgeTextClosed]}>
              {isStoreOpen ? 'Store is Open' : 'Store Closed'}
            </Text>
          </View>
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
        {/* <View style={styles.noticeWrap}>
          <View style={[styles.noticeDot, isStoreOpen ? styles.noticeDotOpen : styles.noticeDotClosed]} />
          <Text style={styles.noticeText}>
            Notice: Store is {isStoreOpen ? 'Open' : 'Closed'} now
          </Text>
          <Text style={styles.noticeTime}>7 AM - 10 PM</Text>
        </View> */}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/home/print-store')}
          style={styles.bannerPrint}
        >
          <LinearGradient
            colors={['#8b6bff', '#8b6bff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerInner}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.bannerTitle}>Get it printed</Text>
              <View style={styles.bannerSubRow}>
                <Feather name="clock" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.bannerSub}> Delivered within 30 minutes</Text>
              </View>
            </View>
            <Image source={IMG_PRINTER} style={styles.bannerImg} resizeMode="cover" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.miniRow}>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniPassport]}
            onPress={() => router.push('/home/passport-photos')}
            activeOpacity={0.9}
          >
            <View style={styles.miniTextWrap}>
              <Text style={styles.miniTitle}>Print Photos</Text>
              <Text style={styles.miniSub}>Passport, Postcard · ₹30+</Text>
            </View>
            <Image source={IMG_PASSPORT} style={styles.miniImg} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniPvc]}
            onPress={() => router.push(href.pvcCard)}
            activeOpacity={0.9}
          >
            <View style={styles.miniTextWrap}>
              <Text style={styles.miniTitle}>PVC Card Print</Text>
              <Text style={styles.miniSub}>Front + back upload</Text>
            </View>
            <Image source={IMG_PVC} style={styles.miniImg} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniBanner, styles.miniDemand]}
            onPress={() => router.push(href.onDemandPrint)}
            activeOpacity={0.9}
          >
            <View style={styles.miniTextWrap}>
              <Text style={[styles.miniTitle, styles.miniTitleDark]}>Bulk / Custom</Text>
              <Text style={[styles.miniSub, styles.miniSubDark]}>Call or drop a request</Text>
            </View>
            <Image source={IMG_BULK} style={styles.miniImg} resizeMode="contain" />
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
          {/* Divider */}
          <View style={styles.footerDivider} />

          {/* Brand row */}
          <View style={styles.footerBrand}>
            <BrandMark size={48} iconSize={24} />
            <View style={{ flex: 1 }}>
              <Text style={styles.footerName}>Shubham Computers</Text>
              <Text style={styles.footerTagline}>Your trusted print &amp; stationery partner</Text>
            </View>
          </View>

          {/* Info rows */}
          <View style={styles.footerInfoBlock}>
            <View style={styles.footerInfoRow}>
              <Feather name="map-pin" size={14} color={colors.primary} style={styles.footerIcon} />
              <Text style={styles.footerInfoText}>Go Green Opp. Gujjar Dharmsala, near Govt. Girls Sr. Sec. School, Jhajjar, Haryana 124103</Text>
            </View>
            <View style={styles.footerInfoRow}>
              <Feather name="phone" size={14} color={colors.primary} style={styles.footerIcon} />
              <Text style={styles.footerInfoText}>+91 93503 36367</Text>
            </View>
            <View style={styles.footerInfoRow}>
              <Feather name="mail" size={14} color={colors.primary} style={styles.footerIcon} />
              <Text style={styles.footerInfoText}>garg80912@gmail.com</Text>
            </View>
            <View style={styles.footerInfoRow}>
              <Feather name="clock" size={14} color={colors.primary} style={styles.footerIcon} />
              <Text style={styles.footerInfoText}>Mon – Sat &nbsp; 7:00 AM – 10:00 PM</Text>
            </View>
          </View>

          {/* Services row */}
          <View style={styles.footerServicesRow}>
            {['Print Store', 'Print Photos', 'PVC Cards', 'Stationery Mart'].map((s) => (
              <View key={s} style={styles.footerChip}>
                <Text style={styles.footerChipText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Copyright */}
          <View style={styles.footerCopyRow}>
            <Text style={styles.footerCopy}>© {new Date().getFullYear()} Shubham Computers. All rights reserved.</Text>
          </View>
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
  locationBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  locText: { marginLeft: 8, flex: 1 },
  locLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  locAddr: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  storeBadgeOpen: { backgroundColor: '#F0FFF4', borderColor: '#16A34A' },
  storeBadgeClosed: { backgroundColor: '#FFF1F1', borderColor: '#DC2626' },
  storeDot: { width: 7, height: 7, borderRadius: 4 },
  storeDotOpen: { backgroundColor: '#16A34A' },
  storeDotClosed: { backgroundColor: '#DC2626' },
  storeBadgeText: { fontSize: 12, fontWeight: '700' },
  storeBadgeTextOpen: { color: '#16A34A' },
  storeBadgeTextClosed: { color: '#DC2626' },
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    ...shadows.card,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 16,
    minHeight: 150,
  },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: colors.textOnPrimary },
  bannerSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  bannerImg: {
    width: 140,
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginLeft: 10,
  },
  bannerFallback: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniRow: {
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginBottom: 8,
  },
  miniBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    overflow: 'hidden',
    ...shadows.card,
  },
  miniTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  miniPassport: { backgroundColor: '#5A4D8A' },
  miniPvc: { backgroundColor: '#9B8FCC' },
  miniDemand: { backgroundColor: '#FFD24D' },
  miniTitle: { fontSize: 15, fontWeight: '800', color: colors.textOnPrimary },
  miniSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  miniTitleDark: { color: colors.textPrimary },
  miniSubDark: { color: colors.textSecondary },
  miniImg: {
    width: 96,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: spacing.page,
    paddingBottom: 28,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerDivider: {
    height: 3,
    width: 40,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: 20,
    marginBottom: 18,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  footerName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  footerTagline: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  footerInfoBlock: { gap: 10, marginBottom: 18 },
  footerInfoRow: { flexDirection: 'row', alignItems: 'center' },
  footerIcon: { marginRight: 10 },
  footerInfoText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  footerServicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  footerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerChipText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  footerCopyRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  footerCopy: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
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
