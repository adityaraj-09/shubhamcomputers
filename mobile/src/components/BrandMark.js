import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/** Consistent printer mark for headers, splash, footers (no emoji). */
export default function BrandMark({ size = 40, iconSize, containerStyle }) {
  const inner = iconSize ?? Math.round(size * 0.5);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }, containerStyle]}>
      <MaterialCommunityIcons name="printer-outline" size={inner} color={colors.primaryLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
