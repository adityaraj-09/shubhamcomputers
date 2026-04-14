import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/colors';

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'medium',
  style, 
  textStyle,
  ...props 
}) {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  default: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    ...typography.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultText: {
    color: colors.textSecondary,
  },
  primaryText: {
    color: '#fff',
  },
  successText: {
    color: '#fff',
  },
  warningText: {
    color: '#fff',
  },
  dangerText: {
    color: '#fff',
  },
});