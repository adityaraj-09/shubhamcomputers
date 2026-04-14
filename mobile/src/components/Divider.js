import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Divider({ style, vertical = false, ...props }) {
  return (
    <View 
      style={[
        vertical ? styles.vertical : styles.horizontal, 
        style
      ]} 
      {...props} 
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  vertical: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
});