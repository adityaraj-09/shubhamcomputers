import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Login() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user, router]);
  if (loading) {
    return <LoadingScreen />;
  }
  if (user) {
    return <LoadingScreen />;
  }
  return <LoginScreen />;
}
