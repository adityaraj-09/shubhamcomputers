import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Index() {
  const { user, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) {
    return <LoadingScreen />;
  }
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)/home" />;
}
