import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../theme/colors';

export default function Card({ children, style, shadow = true, ...props }) {
  return (
    <View style={[styles.card, shadow && shadows.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});