import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';

const SERVICES = [
  { id: 'print',     label: 'PVC Card Print',                price: 80  },
  { id: 'lost_dl',   label: 'Lost DL PVC Charges',           price: 200 },
  { id: 'lost_rc',   label: 'Lost RC PVC Card Charges',      price: 200 },
  { id: 'lost_pan',  label: 'Lost PAN Card PVC Charges',     price: 200 },
  { id: 'lost_vote', label: 'Lost Vote Card PVC Charges',    price: 200 },
];

export default function PvcCardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useAuth();

  const [selectedService, setSelectedService] = useState('print');
  const [frontLocal, setFrontLocal] = useState(null);
  const [backLocal, setBackLocal] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [uploadingSide, setUploadingSide] = useState(null);
  const [lostDescription, setLostDescription] = useState('');

  const service = SERVICES.find((s) => s.id === selectedService);
  const isLostService = selectedService.startsWith('lost_');

  useEffect(() => {
    if (!isLostService) {
      setLostDescription('');
    }
  }, [isLostService]);

  const uploadAsset = async (asset, side) => {
    setUploadingSide(side);
    try {
      const formData = new FormData();
      formData.append('files', {
        uri: asset.uri,
        name: asset.name || `${side}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.files?.[0];
      if (!uploaded) throw new Error('Upload failed');
      if (side === 'front') setFrontFile(uploaded);
      else setBackFile(uploaded);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Upload failed' });
      if (side === 'front') setFrontLocal(null);
      else setBackLocal(null);
    } finally {
      setUploadingSide(null);
    }
  };

  const pickFromGallery = async (side) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    if (side === 'front') { setFrontLocal(asset.uri); setFrontFile(null); }
    else { setBackLocal(asset.uri); setBackFile(null); }
    await uploadAsset(
      { uri: asset.uri, name: asset.fileName || `${side}.jpg`, mimeType: asset.mimeType || 'image/jpeg' },
      side,
    );
  };

  const pickFromFiles = async (side) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      if (side === 'front') { setFrontLocal(asset.uri); setFrontFile(null); }
      else { setBackLocal(asset.uri); setBackFile(null); }
      await uploadAsset(
        { uri: asset.uri, name: asset.name || `${side}.jpg`, mimeType: asset.mimeType || 'image/jpeg' },
        side,
      );
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick file' });
    }
  };

  const clearSide = (side) => {
    if (side === 'front') { setFrontLocal(null); setFrontFile(null); }
    else { setBackLocal(null); setBackFile(null); }
  };

  const canCheckout = isLostService
    ? lostDescription.trim().length > 0
    : Boolean((frontFile || frontLocal) && (backFile || backLocal));

  const handleAddToCart = () => {
    if (!canCheckout) {
      Toast.show({ type: 'error', text1: isLostService ? 'Please enter details for lost PVC' : 'Upload both front and back images' });
      return;
    }
    addToCart({
      id: `pvc-card-${Date.now()}`,
      type: 'mart',
      name: service.label,
      price: service.price,
      quantity: 1,
      image: isLostService ? null : (frontFile?.thumbnailLink || frontFile?.viewLink || frontLocal || null),
      fileUrl: isLostService ? null : (frontFile?.viewLink || null),
      options: {
        service: service.label,
        lostDescription: isLostService ? lostDescription.trim() : '',
        frontFile: frontFile?.name || 'front.jpg',
        backFile: backFile?.name || 'back.jpg',
      },
      attachments: isLostService
        ? []
        : [
            frontFile?.viewLink || frontFile?.thumbnailLink,
            backFile?.viewLink || backFile?.thumbnailLink,
          ].filter(Boolean),
    });
    Toast.show({ type: 'success', text1: 'PVC card added to cart!' });
    router.push(href.checkout);
  };

  const CardSlot = ({ label, localUri, serverFile, side }) => {
    const displayUri = serverFile?.thumbnailLink || serverFile?.viewLink || localUri;
    const isUploading = uploadingSide === side;
    const isDone = Boolean(displayUri && !isUploading);
    return (
      <View style={styles.cardSlot}>
        <Text style={styles.cardSlotLabel}>{label}</Text>
        <View style={[styles.cardPreview, isDone && styles.cardPreviewDone]}>
          {displayUri ? (
            <>
              <Image source={{ uri: displayUri }} style={styles.cardImage} resizeMode="cover" />
              {isUploading ? (
                <View style={styles.cardOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : (
                <TouchableOpacity style={styles.cardRemoveBtn} onPress={() => clearSide(side)}>
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          ) : isUploading ? (
            <View style={styles.cardEmpty}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.cardEmptyText}>Uploading...</Text>
            </View>
          ) : (
            <View style={styles.cardEmpty}>
              <Feather name="upload" size={22} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.cardEmptyText}>Upload {label.toLowerCase()}</Text>
              <View style={styles.pickRow}>
                <TouchableOpacity style={styles.pickBtn} onPress={() => pickFromGallery(side)}>
                  <Feather name="image" size={13} color={colors.textPrimary} />
                  <Text style={styles.pickBtnText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickBtn} onPress={() => pickFromFiles(side)}>
                  <Feather name="folder" size={13} color={colors.textPrimary} />
                  <Text style={styles.pickBtnText}>Files</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PVC Card Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsRow}>
          <CardSlot label="Front Side" localUri={frontLocal} serverFile={frontFile} side="front" />
          <CardSlot label="Back Side" localUri={backLocal} serverFile={backFile} side="back" />
        </View>

        <Text style={styles.sectionTitle}>Select Service</Text>
        <View style={styles.serviceList}>
          {SERVICES.map((svc, index) => {
            const active = selectedService === svc.id;
            const isLast = index === SERVICES.length - 1;
            return (
              <TouchableOpacity
                key={svc.id}
                style={[styles.serviceRow, active && styles.serviceRowActive, isLast && styles.serviceRowLast]}
                onPress={() => setSelectedService(svc.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.serviceLabel, active && styles.serviceLabelActive]}>{svc.label}</Text>
                <Text style={[styles.servicePrice, active && styles.servicePriceActive]}>₹{svc.price}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLostService && (
          <View style={styles.lostBox}>
            <Text style={styles.lostLabel}>Enter lost card details</Text>
            <Text style={styles.lostSub}>Example: Name, old card number, DOB, address, ID type</Text>
            <TextInput
              style={styles.lostInput}
              placeholder="Type details to help us reissue your PVC card"
              placeholderTextColor={colors.textMuted}
              value={lostDescription}
              onChangeText={setLostDescription}
              multiline
              maxLength={500}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomSub} numberOfLines={1}>{service.label}</Text>
          <Text style={styles.bottomPrice}>₹{service.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.cartBtn, !canCheckout && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!canCheckout}
        >
          <Feather name="shopping-cart" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.cartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginBottom: 20,
    marginTop: 8,
  },
  cardSlot: { flex: 1 },
  cardSlotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardPreview: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPreviewDone: {
    borderColor: '#16A34A',
    borderWidth: 1.5,
  },
  cardRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardEmptyText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickRow: { flexDirection: 'row', gap: 5 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSurface,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pickBtnText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.page,
    marginBottom: 8,
  },
  serviceList: {
    marginHorizontal: spacing.page,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  lostBox: {
    marginTop: 16,
    marginHorizontal: spacing.page,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  lostLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  lostSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  lostInput: {
    minHeight: 90,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
    padding: 10,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  serviceRowLast: { borderBottomWidth: 0 },
  serviceRowActive: { backgroundColor: colors.primary + '0E' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  serviceLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  serviceLabelActive: { color: colors.primary, fontWeight: '700' },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  servicePriceActive: { color: colors.primary },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomSub: { fontSize: 11, color: colors.textMuted, maxWidth: 160 },
  bottomPrice: { fontSize: 26, fontWeight: '800', color: colors.accent },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.sm,
  },
  cartBtnDisabled: { opacity: 0.45 },
  cartBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});