import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { formatPrice, formatDateTime, MIN_WALLET_TOPUP, MAX_WALLET_TOPUP } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await API.get('/wallet');
      setTransactions(data.transactions || []);
      updateUser({ walletBalance: data.balance });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load wallet' });
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount, 10);
    if (!amount || amount < MIN_WALLET_TOPUP) {
      Toast.show({
        type: 'error',
        text1: `Minimum top-up is ${formatPrice(MIN_WALLET_TOPUP)}`,
      });
      return;
    }
    if (amount > MAX_WALLET_TOPUP) {
      Toast.show({
        type: 'error',
        text1: `Maximum top-up is ${formatPrice(MAX_WALLET_TOPUP)}`,
      });
      return;
    }

    setTopupLoading(true);
    try {
      const { data } = await API.post('/wallet/topup', { amount });

      const options = {
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: data.currency || 'INR',
        name: data.merchantName || 'Shubham Prints',
        description: `Wallet Top-up ${data.txnRef}`,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: { color: colors.primary },
      };

      const paymentResult = await RazorpayCheckout.open(options);

      const confirmRes = await API.post('/wallet/topup/confirm', {
        transactionId: data.transactionId,
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      });

      updateUser({ walletBalance: confirmRes.data.balance });
      Toast.show({
        type: 'success',
        text1: `${formatPrice(amount)} added to wallet!`,
      });
      setShowTopup(false);
      setTopupAmount('');
      fetchWallet();
    } catch (error) {
      const cancelled =
        error?.code === 0 ||
        /cancelled|dismissed|closed/i.test(String(error?.description || error?.message || ''));
      if (cancelled) {
        Toast.show({ type: 'info', text1: 'Payment cancelled' });
      } else {
        Toast.show({
          type: 'error',
          text1: error.response?.data?.error || error?.description || 'Top-up failed',
        });
      }
    } finally {
      setTopupLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Wallet</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.balanceCard}
        >
          <Text style={styles.balLabel}>Current Balance</Text>
          <Text style={styles.balAmt}>{formatPrice(user?.walletBalance || 0)}</Text>
          <TouchableOpacity style={styles.addMoney} onPress={() => setShowTopup(true)}>
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.txnTitle}>Transaction History</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet. Top-up your wallet to get started!</Text>
        ) : (
          transactions.map((t) => (
            <View key={t._id || t.id} style={styles.txnRow}>
              <View style={styles.txnIconWrap}>
                <Feather
                  name={
                    t.type === 'topup'
                      ? 'plus-circle'
                      : t.type === 'refund'
                        ? 'rotate-ccw'
                        : 'shopping-bag'
                  }
                  size={20}
                  color={
                    t.type === 'topup'
                      ? colors.accent
                      : t.type === 'refund'
                        ? colors.warning
                        : colors.primaryLight
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnDesc}>{t.description}</Text>
                <Text style={styles.txnDate}>{formatDateTime(t.createdAt)}</Text>
              </View>
              <Text
                style={[
                  styles.txnAmt,
                  t.type === 'debit' ? styles.txnDebit : styles.txnCredit,
                ]}
              >
                {t.type === 'debit' ? '-' : '+'}
                {formatPrice(t.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showTopup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Money</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={topupAmount}
              onChangeText={setTopupAmount}
            />
            <View style={styles.quickRow}>
              {quickAmounts.map((a) => (
                <TouchableOpacity key={a} style={styles.quickChip} onPress={() => setTopupAmount(String(a))}>
                  <Text style={styles.quickText}>{formatPrice(a)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleTopup}
              disabled={topupLoading}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.gradientBtn, topupLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.modalBtnText}>{topupLoading ? 'Processing...' : 'Continue'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTopup(false)} style={styles.cancelModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  balanceCard: {
    borderRadius: radius.lg,
    padding: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  balLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  balAmt: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 8 },
  addMoney: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 16,
    gap: 8,
  },
  addMoneyText: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  txnTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  txnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnDesc: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  txnDate: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  txnAmt: { fontSize: 16, fontWeight: '800' },
  txnDebit: { color: colors.danger },
  txnCredit: { color: colors.accent },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 18,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  modalBtn: { marginTop: 20 },
  gradientBtn: { paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelModal: { marginTop: 14, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontSize: 15 },
});
