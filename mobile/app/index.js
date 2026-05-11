import React, { useEffect } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace('/(tabs)/home');
  }, [user, loading, rootNavigationState?.key, router]);

  return <LoadingScreen />;
}
