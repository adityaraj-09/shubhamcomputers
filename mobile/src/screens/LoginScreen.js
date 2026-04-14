import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius } from '../theme/colors';
import BrandMark from '../components/BrandMark';

export default function LoginScreen() {
  const { login } = useAuth();
  const [step, setStep] = useState('name');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const handleNameNext = () => {
    if (name.trim().length < 2) {
      Toast.show({ type: 'error', text1: 'Please enter your full name' });
      return;
    }
    setStep('phone');
  };

  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Toast.show({ type: 'error', text1: 'Enter a valid 10-digit phone number' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/send-otp', { phone });
      Toast.show({ type: 'success', text1: 'OTP sent!' });
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep('otp');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Failed to send OTP',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter 6-digit OTP' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/verify-otp', { phone, otp });
      await login(data.token, data.user);
      if (data.isNewUser) {
        try {
          const profileRes = await API.put('/auth/complete-profile', { name: name.trim() });
          await login(data.token, profileRes.data.user);
          Toast.show({
            type: 'success',
            text1: `Welcome, ${profileRes.data.user.name}!`,
          });
        } catch {
          Toast.show({ type: 'success', text1: 'Welcome!' });
        }
      } else {
        Toast.show({ type: 'success', text1: `Welcome back, ${data.user.name}!` });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Invalid OTP',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BrandMark size={72} iconSize={36} containerStyle={styles.logoMark} />
          <Text style={styles.title}>Shubham Computers</Text>
          <Text style={styles.tagline}>Print and stationery mart</Text>
          <View style={styles.subRow}>
            <Feather name="map-pin" size={12} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.sub}>Jhajjar · Typical delivery under 30 minutes</Text>
          </View>
        </View>

        <View style={styles.card}>
          {step === 'name' && (
            <View>
              <Text style={styles.formTitle}>Login / Sign Up</Text>
              <Text style={styles.info}>What&apos;s your name?</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={100}
              />
              <TouchableOpacity
                onPress={handleNameNext}
                disabled={name.trim().length < 2}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.btn, name.trim().length < 2 && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 'phone' && (
            <View>
              <Text style={styles.formTitle}>Enter Phone Number</Text>
              <Text style={styles.info}>
                Hi <Text style={{ fontWeight: '700' }}>{name}</Text>! Enter your number to continue.
              </Text>
              <View style={styles.phoneRow}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </View>
              <TouchableOpacity
                onPress={handleSendOTP}
                disabled={loading || phone.length !== 10}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={[styles.btn, (loading || phone.length !== 10) && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{loading ? 'Sending...' : 'Get OTP'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setStep('name');
                  setPhone('');
                }}
                style={styles.linkBtn}
              >
                <View style={styles.linkRow}>
                  <Feather name="chevron-left" size={18} color={colors.primaryLight} />
                  <Text style={styles.linkText}>Change name</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View>
              <Text style={styles.formTitle}>Verify OTP</Text>
              <Text style={styles.info}>OTP sent to +91 {phone}</Text>
              <TouchableOpacity
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                }}
                style={styles.linkBtn}
              >
                <View style={styles.linkRow}>
                  <Feather name="chevron-left" size={18} color={colors.primaryLight} />
                  <Text style={styles.linkText}>Change number</Text>
                </View>
              </TouchableOpacity>
              {!!devOtp && <Text style={styles.devOtp}>Dev OTP: {devOtp}</Text>}
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <TouchableOpacity
                onPress={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={[styles.btn, (loading || otp.length !== 6) && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Login'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.footer}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgDark },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logoMark: { marginBottom: 16 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  sub: { fontSize: 13, color: colors.textMuted },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  info: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  prefix: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 14,
  },
  phoneInput: { flex: 1, marginBottom: 0 },
  btnWrap: { marginTop: 4 },
  btn: {
    paddingVertical: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 12, alignSelf: 'flex-start' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: colors.primaryLight, fontSize: 14, fontWeight: '600' },
  devOtp: {
    color: colors.warning,
    fontSize: 13,
    marginBottom: 8,
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
