import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';
import LoadingScreen from '../src/components/LoadingScreen';

export default function Login() {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <LoginScreen />;
}
