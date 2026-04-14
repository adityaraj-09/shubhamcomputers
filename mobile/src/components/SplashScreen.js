import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme/colors';
import BrandMark from './BrandMark';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={[colors.bgDark, colors.bgSurface]}
      style={styles.container}
    >
      <View style={styles.content}>
        <BrandMark size={88} iconSize={44} containerStyle={styles.logoMark} />
        <Text style={styles.title}>Shubham Computers</Text>
        <Text style={styles.subtitle}>Digital solutions and print services</Text>

        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoMark: {
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  loader: {
    marginTop: 32,
  },
});
