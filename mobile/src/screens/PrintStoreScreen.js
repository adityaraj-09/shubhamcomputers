import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import ServiceGrid from '../components/ServiceGrid';
import PrintStoreLanding from '../components/PrintStoreLanding';
import PrintOrderConfig, { uploadMorePrintFiles } from '../components/PrintOrderConfig';
import { formatPrice } from '../utils/constants';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

export default function PrintStoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, cartTotal } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/print-services');
        setServices(data.services || []);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFilesUploaded = (files) => {
    setUploadedFiles(files);
    if (files.length > 0) setShowConfig(true);
  };

  const handleAddMoreFiles = async (newFileMetas) => {
    const combined = await uploadMorePrintFiles(uploadedFiles, newFileMetas, setUploading);
    if (combined) setUploadedFiles(combined);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Print Store</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.page, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {showConfig && uploadedFiles.length > 0 && (
          <View style={styles.inlineConfigWrap}>
            <PrintOrderConfig
              embedded
              uploadedFiles={uploadedFiles}
              onAddMoreFiles={handleAddMoreFiles}
              onBack={() => setShowConfig(false)}
            />
          </View>
        )}

        <PrintStoreLanding onFilesUploaded={handleFilesUploaded} />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <ServiceGrid services={services} />
        )}
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: Math.max(insets.bottom, 12) + 8 }]}
          onPress={() => router.push(href.orders)}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.floatingInner}
          >
            <View>
              <Text style={styles.fcCount}>{cart.length} item(s)</Text>
              <Text style={styles.fcTotal}>{formatPrice(cartTotal)}</Text>
            </View>
            <View style={styles.fcActionRow}>
              <Text style={styles.fcAction}>View cart</Text>
              <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  inlineConfigWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  floatingCart: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  floatingInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  fcCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  fcTotal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  fcActionRow: { flexDirection: 'row', alignItems: 'center' },
  fcAction: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
