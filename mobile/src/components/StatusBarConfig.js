import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function StatusBarConfig() {
  return (
    <StatusBar 
      style="dark" 
      backgroundColor="#f7f7f8"
      translucent={Platform.OS === 'android'}
    />
  );
}