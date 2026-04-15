import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

const BUSINESS_PHONE = '+919350336367';

export default function OnDemandPrintScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ requirements: '', quantity: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.requirements.trim()) {
      Toast.show({ type: 'error', text1: 'Please describe what you need' });
      return;
    }
    setLoading(true);
    try {
      await API.post('/orders/inquiry', {
        requirements: form.requirements,
        quantity: form.quantity,
      });
      updateUser({ numOrders: (user?.numOrders || 0) + 1 });
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not submit. Please call us directly.';
      console.warn('Inquiry submit error:', err.response?.status, err.response?.data);
      Toast.show({
        type: 'error',
        text1: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const call = () => Linking.openURL(`tel:${BUSINESS_PHONE}`);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>On-Demand Printing</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.bgSurface, '#e6e6e9']} style={styles.hero}>
          <MaterialCommunityIcons name="printer" size={52} color={colors.textPrimary} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroH}>Bulk & Custom Orders</Text>
            <Text style={styles.heroP}>
              Flex banners · visiting cards · brochures · t-shirt prints & more
            </Text>
          </View>
        </LinearGradient>

        <Text style={styles.callLabel}>Talk to us directly</Text>
        <TouchableOpacity style={styles.callBtn} onPress={call}>
          <Feather name="phone" size={20} color="#fff" />
          <Text style={styles.callBtnText}>
            Call {BUSINESS_PHONE.replace(/^\+91/, '+91 ')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hours}>Mon – Sat · 9 AM – 8 PM</Text>

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or leave an enquiry</Text>
          <View style={styles.divLine} />
        </View>

        {submitted ? (
          <View style={styles.success}>
            <Feather name="check-circle" size={52} color={colors.accent} />
            <Text style={styles.successH}>Enquiry Received!</Text>
            <Text style={styles.successP}>
              We&apos;ll call you back at <Text style={{ fontWeight: '800' }}>{user?.phone}</Text> within
              a few hours.
            </Text>
            <Text style={styles.successSub}>
              Your order has been saved under <Text style={{ fontWeight: '800' }}>My Orders</Text>.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.push(href.orders)}
            >
              <Text style={styles.successBtnText}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(href.home)}>
              <Text style={styles.homeLink}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Enquiry Form</Text>
            <View style={styles.accountBox}>
              <Text style={styles.accName}>{user?.name}</Text>
              <View style={styles.accPhoneRow}>
                <Feather name="phone" size={14} color={colors.primaryLight} style={{ marginRight: 8 }} />
                <Text style={styles.accPhone}>{user?.phone}</Text>
              </View>
            </View>
            <Text style={styles.label}>What do you need? *</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g. 500 visiting cards, matte finish..."
              placeholderTextColor={colors.textMuted}
              value={form.requirements}
              onChangeText={(t) => setForm((f) => ({ ...f, requirements: t }))}
              multiline
            />
            <Text style={styles.label}>Estimated Quantity (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 200 copies, 3 posters"
              placeholderTextColor={colors.textMuted}
              value={form.quantity}
              onChangeText={(t) => setForm((f) => ({ ...f, quantity: t }))}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitText}>{loading ? 'Sending…' : 'Send Enquiry'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  heroH: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  heroP: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
  callLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: spacing.page,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  callBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  hours: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginTop: 8 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: spacing.page,
  },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { marginHorizontal: 12, fontSize: 12, color: colors.textMuted },
  success: { alignItems: 'center', paddingHorizontal: spacing.page },
  successH: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 16 },
  successP: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  successSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  successBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  successBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeLink: { marginTop: 16, color: colors.primaryLight, fontWeight: '600', fontSize: 15 },
  form: { paddingHorizontal: spacing.page },
  formTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  accountBox: {
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: radius.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  accPhoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  accPhone: { fontSize: 14, color: colors.textSecondary },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  textarea: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 100,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
