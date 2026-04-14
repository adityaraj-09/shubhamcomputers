import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
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
import FileTypeIcon from '../components/FileTypeIcon';
import ImageEditModal from '../components/ImageEditModal';
import FilePreviewModal from '../components/FilePreviewModal';

const CARD_TYPES = ['Aadhaar', 'PAN', 'Voter ID', 'Driving License', 'Other'];
const FINISH_TYPES = ['Glossy', 'Matte'];
const BASE_PRICE = 60;

export default function PvcCardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useAuth();
  const [cardType, setCardType] = useState(CARD_TYPES[0]);
  const [finish, setFinish] = useState(FINISH_TYPES[0]);
  const [quantity, setQuantity] = useState(1);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [uploadingSide, setUploadingSide] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorAsset, setEditorAsset] = useState(null);
  const [editingSide, setEditingSide] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const uploadAsset = async (asset, side) => {
    setUploadingSide(side);
    try {
      const formData = new FormData();
      formData.append('files', {
        uri: asset.uri,
        name: asset.fileName || asset.name || `${side}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.files?.[0];
      if (!uploaded) throw new Error('Upload failed');
      if (side === 'front') setFrontFile(uploaded);
      else setBackFile(uploaded);
      Toast.show({ type: 'success', text1: `${side === 'front' ? 'Front' : 'Back'} image uploaded` });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Upload failed',
      });
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
    setEditingSide(side);
    setEditorAsset({
      uri: asset.uri,
      name: asset.fileName || asset.name || `${side}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      width: asset.width,
      height: asset.height,
    });
    setEditorVisible(true);
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
      setEditingSide(side);
      setEditorAsset({
        uri: asset.uri,
        name: asset.name || `${side}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      });
      setEditorVisible(true);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick file' });
    }
  };

  const openPreview = (file) => {
    setPreviewFile({
      name: file?.name || file?.originalName || 'card-image.jpg',
      uri: file?.viewLink || file?.thumbnailLink || file?.uri || null,
      mimeType: file?.mimeType || 'image/jpeg',
    });
    setPreviewVisible(true);
  };

  const totalPrice = BASE_PRICE * quantity;
  const canCheckout = Boolean(frontFile && backFile);

  const handleAddToCart = () => {
    if (!canCheckout) {
      Toast.show({ type: 'error', text1: 'Upload both front and back images' });
      return;
    }
    addToCart({
      id: `pvc-card-${Date.now()}`,
      type: 'mart',
      name: `${cardType} PVC Card`,
      price: totalPrice,
      quantity: 1,
      image: frontFile.thumbnailLink || frontFile.viewLink || null,
      fileUrl: frontFile.viewLink || null,
      options: {
        service: 'PVC Card',
        cardType,
        finish,
        quantity,
        frontFile: frontFile.name,
        backFile: backFile.name,
      },
      attachments: [
        frontFile.viewLink || frontFile.thumbnailLink || null,
        backFile.viewLink || backFile.thumbnailLink || null,
      ].filter(Boolean),
    });
    Toast.show({ type: 'success', text1: 'PVC card added to cart!' });
    router.push(href.checkout);
  };

  const renderUploadCard = (label, file, side) => (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadLabel}>{label}</Text>
      {file ? (
        <View style={styles.uploadedRow}>
          {file.thumbnailLink || file.viewLink ? (
            <Image source={{ uri: file.thumbnailLink || file.viewLink }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbFallback}>
              <FileTypeIcon fileName={file.name} size={20} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <View style={styles.uploadActions}>
              <TouchableOpacity onPress={() => openPreview(file)}>
                <Text style={styles.linkBtn}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickFromGallery(side)}>
                <Text style={styles.linkBtn}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => (side === 'front' ? setFrontFile(null) : setBackFile(null))}>
            <Feather name="x" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickWrap}>
          {uploadingSide === side ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickFromGallery(side)}>
                <Feather name="image" size={14} color={colors.textPrimary} />
                <Text style={styles.pickBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickFromFiles(side)}>
                <Feather name="folder" size={14} color={colors.textPrimary} />
                <Text style={styles.pickBtnText}>Files</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ImageEditModal
        visible={editorVisible}
        asset={editorAsset}
        onCancel={() => {
          setEditorVisible(false);
          setEditorAsset(null);
          setEditingSide(null);
        }}
        onDone={async (edited) => {
          const side = editingSide;
          setEditorVisible(false);
          setEditorAsset(null);
          setEditingSide(null);
          if (!side) return;
          await uploadAsset(
            {
              uri: edited.uri,
              name: edited.name || `${side}.jpg`,
              fileName: edited.name || `${side}.jpg`,
              mimeType: edited.mimeType || 'image/jpeg',
            },
            side
          );
        }}
      />
      <FilePreviewModal
        visible={previewVisible}
        file={previewFile}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewFile(null);
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PVC Card Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Feather name="credit-card" size={30} color={colors.primary} />
          <Text style={styles.heroTitle}>Upload front + back and get PVC card printed</Text>
          <Text style={styles.heroSub}>Both side image required · clean print · durable finish</Text>
        </View>

        {renderUploadCard('Front side image', frontFile, 'front')}
        {renderUploadCard('Back side image', backFile, 'back')}

        <Text style={styles.sectionTitle}>Card Type</Text>
        <View style={styles.chipsRow}>
          {CARD_TYPES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, cardType === item && styles.chipOn]}
              onPress={() => setCardType(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Finish</Text>
        <View style={styles.chipsRow}>
          {FINISH_TYPES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, finish === item && styles.chipOn]}
              onPress={() => setFinish(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Feather name="minus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
              <Feather name="plus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomSub}>₹{BASE_PRICE} per card</Text>
          <Text style={styles.bottomPrice}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[styles.cartBtn, !canCheckout && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!canCheckout}
        >
          <Text style={styles.cartBtnText}>Add to cart</Text>
          <Feather name="chevron-right" size={16} color="#fff" style={{ marginLeft: 6 }} />
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  hero: {
    marginHorizontal: spacing.page,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginBottom: 16,
    gap: 6,
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  heroSub: { fontSize: 12, color: colors.textSecondary },
  uploadCard: {
    marginHorizontal: spacing.page,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  uploadLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },
  pickWrap: { flexDirection: 'row', gap: 10 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pickBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  thumbFallback: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  uploadActions: { flexDirection: 'row', gap: 14, marginTop: 4 },
  linkBtn: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.page,
    marginTop: 8,
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.page },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  chipText: { fontSize: 12, color: colors.textPrimary, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: spacing.page,
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
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
  bottomSub: { fontSize: 12, color: colors.textMuted },
  bottomPrice: { fontSize: 24, fontWeight: '800', color: colors.accent },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  cartBtnDisabled: { opacity: 0.5 },
  cartBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
