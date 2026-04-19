import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import FileUpload from './FileUpload';
import { colors, radius } from '../theme/colors';

export default function PrintStoreLanding({ onFilesUploaded }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name="printer-outline" size={36} color={colors.primaryLight} />
        </View>
        <Text style={styles.heroTitle}>Print Store</Text>
        <Text style={styles.heroSub}>Shubink provides Safe & Secure printouts</Text>
      </View>

      <FileUpload onFilesUploaded={onFilesUploaded} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why try our Print Store?</Text>
        <View style={styles.featureGrid}>
          {[
            { icon: 'clock', color: '#1a1a1a', title: 'Delivery in minutes', desc: 'Instant deliveries under 30 minutes' },
            { icon: 'shield', color: '#404040', title: 'Safe and secure', desc: 'We delete your files once delivered' },
            { icon: 'dollar-sign', color: '#b45309', title: 'Affordable Printing', desc: 'B&W: ₹3 per page\nColour: ₹10 per page' },
            { icon: 'layers', color: '#71717a', title: 'No minimum order', desc: 'Order as many pages as few as you want' },
          ].map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={[styles.fIcon, { backgroundColor: f.color + '22' }]}>
                <Feather name={f.icon} size={20} color={f.color} />
              </View>
              <Text style={styles.fTitle}>{f.title}</Text>
              <Text style={styles.fDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Print Store works</Text>
        <Text style={styles.sectionDesc}>
          Let Shubink take care of your everyday printing needs
        </Text>
        {[
          { title: 'Visit Print Store', sub: 'Open the app and browse print services', icon: 'eye' },
          { title: 'Upload file(s)', sub: 'Upload a file or multiple files to take prints', icon: 'upload-cloud' },
          { title: 'Customise print', sub: 'Choose print settings as per your requirement', icon: 'printer' },
          { title: 'Checkout', sub: 'Add prints to cart and place an order', icon: 'shopping-cart' },
        ].map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepSub}>{s.sub}</Text>
            </View>
            <View style={styles.stepIcon}>
              <Feather name={s.icon} size={18} color={colors.primary} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customisation options</Text>
        {[
          { icon: 'file-text', t: 'Upload any file type', d: 'Print PDF, JPG, PNG, JPEG, and many more' },
          { icon: 'image', t: 'Black & White / Colour', d: 'Save cost with B&W or pick the coloured option' },
          { icon: 'columns', t: 'Paper format size', d: 'We work with A4 printing paper of 70 GSM' },
          { icon: 'rotate-cw', t: 'Orientation', d: 'Choose landscape or portrait as per your need' },
        ].map((o, i) => (
          <View key={i} style={styles.optRow}>
            <Feather name={o.icon} size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{o.t}</Text>
              <Text style={styles.optDesc}>{o.d}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, { marginBottom: 24 }]}>
        <Text style={styles.sectionTitle}>Proudly serving 500+ happy customers</Text>
        <Text style={styles.testLabel}>Testimonials</Text>
        <View style={styles.testGrid}>
          <View style={styles.testCard}>
            <View style={styles.testAv}>
              <Text style={styles.testAvT}>R</Text>
            </View>
            <Text style={styles.testName}>Rahul Sharma</Text>
            <Text style={styles.testBody}>
              Super fast delivery! Got my project printed in under 20 minutes.
            </Text>
          </View>
          <View style={styles.testCard}>
            <View style={styles.testAv}>
              <Text style={styles.testAvT}>P</Text>
            </View>
            <Text style={styles.testName}>Priya Yadav</Text>
            <Text style={styles.testBody}>
              Affordable and quality printing right at my doorstep.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  heroSub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 14 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  fTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  fDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  stepSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingVertical: 8,
  },
  optTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  optDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  testLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  testGrid: { flexDirection: 'row', gap: 10 },
  testCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testAv: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  testAvT: { color: '#fff', fontWeight: '800' },
  testName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  testBody: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
