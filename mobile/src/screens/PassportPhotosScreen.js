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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API, { getApiOrigin } from '../api/client';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';
import FileTypeIcon from '../components/FileTypeIcon';
import ImageEditModal from '../components/ImageEditModal';
import FilePreviewModal from '../components/FilePreviewModal';

const SIZES = [
  { id: 'std', label: 'Standard Passport', dims: '35 × 45 mm', badge: 'Most Popular' },
  { id: 'stamp', label: 'Stamp Size', dims: '25 × 35 mm', badge: null },
  { id: 'visa', label: 'Visa / US Passport', dims: '50 × 50 mm', badge: null },
];

const BACKGROUNDS = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'offwhite', label: 'Off-White', color: '#f5f0e8' },
  { id: 'slate', label: 'Slate', color: '#787882' },
  { id: 'grey', label: 'Grey', color: '#c5c5c5' },
  { id: 'lightpink', label: 'Light Pink', color: '#f5dfe6' },
  { id: 'mint', label: 'Mint', color: '#d9efe4' },
  { id: 'cream', label: 'Cream', color: '#f7f2df' },
  { id: 'pearl', label: 'Pearl', color: '#e5e5ea' },
];

const PACKS = [
  { id: 'pack8', label: '8 Photos', price: 40 },
  { id: 'pack16', label: '16 Photos', price: 75 },
  { id: 'pack24', label: '24 Photos', price: 100 },
];

const hsvToHex = (h, s, v) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const CUSTOM_PALETTE = (() => {
  const shades = [0.95, 0.8, 0.65];
  const colorsList = [];
  for (let h = 0; h < 360; h += 30) {
    shades.forEach((v) => {
      colorsList.push(hsvToHex(h, 0.75, v));
    });
  }
  colorsList.push('#ffffff', '#f5f5f5', '#d9d9d9', '#111111');
  return colorsList;
})();

export default function PassportPhotosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useAuth();
  const [selectedSize, setSelectedSize] = useState('std');
  const [selectedBg, setSelectedBg] = useState('white');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [selectedPack, setSelectedPack] = useState('pack8');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [heroErr, setHeroErr] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorAsset, setEditorAsset] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [photoBw, setPhotoBw] = useState(false);
  const origin = getApiOrigin();

  const uploadAsset = async (asset, fallbackName = 'file') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', {
        uri: asset.uri,
        name: asset.fileName || asset.name || fallbackName,
        type: asset.mimeType || 'application/octet-stream',
      });
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.files?.[0];
      if (!uploaded) throw new Error('fail');
      setUploadedPhoto(uploaded);
      Toast.show({ type: 'success', text1: 'File uploaded!' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      Toast.show({ type: 'error', text1: 'File must be under 10 MB' });
      return;
    }
    setEditorAsset({
      ...asset,
      name: asset.fileName || asset.name || 'photo.jpg',
    });
    setEditorVisible(true);
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      if (asset.size && asset.size > 20 * 1024 * 1024) {
        Toast.show({ type: 'error', text1: 'File must be under 20 MB' });
        return;
      }
      await uploadAsset(asset, asset.name || 'passport-file');
      setPhotoBw(false);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick file' });
    }
  };

  const pack = PACKS.find((p) => p.id === selectedPack);
  const size = SIZES.find((s) => s.id === selectedSize);
  const totalPrice = pack.price;
  const packNum = parseInt(pack.label.replace(' Photos', ''), 10);
  const totalPhotos = packNum;

  const handleAddToCart = () => {
    const bg = selectedBg === 'custom'
      ? { label: `Custom (${customBgColor.toUpperCase()})`, color: customBgColor }
      : BACKGROUNDS.find((b) => b.id === selectedBg);
    const totalPhotoCount = packNum;
    addToCart({
      id: `passport-${Date.now()}`,
      type: 'mart',
      name: `Passport Photos – ${size.label}, ${bg.label} bg, ${pack.label}`,
      price: totalPrice,
      quantity: 1,
      image: uploadedPhoto?.thumbnailLink || uploadedPhoto?.viewLink || null,
      fileUrl: uploadedPhoto?.viewLink || null,
      options: {
        passportPack: pack.label,
        passportSize: size.label,
        passportDims: size.dims,
        passportBg: bg.label,
        totalPhotos: totalPhotoCount,
        passportTone: photoBw ? 'Black & White' : 'Colour',
      },
      mrp: null,
    });
    Toast.show({ type: 'success', text1: 'Passport photos added to cart!' });
    router.push(href.checkout);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ImageEditModal
        visible={editorVisible}
        asset={editorAsset}
        onCancel={() => {
          setEditorVisible(false);
          setEditorAsset(null);
        }}
        onDone={async (edited) => {
          setEditorVisible(false);
          setEditorAsset(null);
          setPhotoBw(Boolean(edited?.isBlackWhite));
          await uploadAsset(
            {
              uri: edited.uri,
              name: edited.name || 'photo.jpg',
              fileName: edited.name || 'photo.jpg',
              mimeType: edited.mimeType || 'image/jpeg',
            },
            edited.name || 'photo.jpg'
          );
        }}
      />
      <FilePreviewModal
        visible={previewVisible}
        file={{
          name: uploadedPhoto?.name || 'passport-photo.jpg',
          uri: uploadedPhoto?.viewLink || uploadedPhoto?.thumbnailLink || null,
          mimeType: uploadedPhoto?.mimeType || 'image/jpeg',
        }}
        onClose={() => setPreviewVisible(false)}
        onEditImage={
          uploadedPhoto?.viewLink || uploadedPhoto?.thumbnailLink
            ? async () => {
                const uri = uploadedPhoto?.viewLink || uploadedPhoto?.thumbnailLink;
                setPreviewVisible(false);
                setEditorAsset({
                  uri,
                  name: uploadedPhoto?.name || 'passport-photo.jpg',
                });
                setEditorVisible(true);
              }
            : null
        }
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport Size Photos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {!heroErr ? (
            <Image
              source={{ uri: `${origin}/images/passport-photo.png` }}
              style={styles.heroImg}
              onError={() => setHeroErr(true)}
            />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Feather name="image" size={48} color={colors.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(247,247,248,0.97)']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroH}>Professional Quality</Text>
            <Text style={styles.heroP}>Printed on glossy photo paper • Ready in minutes</Text>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          <Text style={styles.secTitle}>Upload Your Photo</Text>
          <Text style={styles.secSub}>Optional · Gallery or files · up to 20 MB</Text>
          {uploadedPhoto ? (
            <View style={styles.uploaded}>
              {uploadedPhoto.thumbnailLink || uploadedPhoto.viewLink ? (
                <Image
                  source={{ uri: uploadedPhoto.thumbnailLink || uploadedPhoto.viewLink }}
                  style={styles.thumb}
                />
              ) : (
                <View style={styles.thumbFallback}>
                  <FileTypeIcon fileName={uploadedPhoto.name} size={24} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.upName} numberOfLines={1}>
                  {uploadedPhoto.name}
                </Text>
                <View style={styles.upOkRow}>
                  <Feather name="check-circle" size={14} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.upOk}>Ready to print</Text>
                </View>
                {photoBw && <Text style={styles.bwTag}>B/W preference selected</Text>}
                <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewVisible(true)}>
                  <Feather name="eye" size={14} color={colors.primary} />
                  <Text style={styles.previewBtnText}>Preview / Edit</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setUploadedPhoto(null);
                  setPhotoBw(false);
                }}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}>
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Feather name="upload-cloud" size={24} color={colors.primary} />
                  <Text style={styles.uploadBtnText}>Upload from gallery or files</Text>
                  <View style={styles.pickRow}>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickPhoto}>
                      <Feather name="image" size={14} color={colors.textPrimary} />
                      <Text style={styles.pickBtnText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickFromFiles}>
                      <Feather name="folder" size={14} color={colors.textPrimary} />
                      <Text style={styles.pickBtnText}>Files</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        <Text style={styles.secTitle}>Choose Pack</Text>
        <View style={styles.packRow}>
          {PACKS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.packBtn, selectedPack === p.id && styles.packBtnOn]}
              onPress={() => setSelectedPack(p.id)}
            >
              <Text style={styles.packLabel}>{p.label}</Text>
              <Text style={styles.packPrice}>₹{p.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.secTitle}>Photo Size</Text>
        {SIZES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sizeBtn, selectedSize === s.id && styles.sizeBtnOn]}
            onPress={() => setSelectedSize(s.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sizeName}>{s.label}</Text>
              <Text style={styles.sizeDims}>{s.dims}</Text>
            </View>
            {s.badge && <Text style={styles.badge}>{s.badge}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.secTitle}>Background Color</Text>
        <View style={styles.bgRow}>
          {BACKGROUNDS.map((bg) => (
            <TouchableOpacity
              key={bg.id}
              style={[styles.bgBtn, selectedBg === bg.id && styles.bgBtnOn]}
              onPress={() => setSelectedBg(bg.id)}
            >
              <View style={[styles.swatch, { backgroundColor: bg.color }]} />
              <Text style={styles.bgLabel}>{bg.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.bgBtn, selectedBg === 'custom' && styles.bgBtnOn]}
            onPress={() => setSelectedBg('custom')}
          >
            <View style={[styles.swatch, { backgroundColor: customBgColor }]} />
            <Text style={styles.bgLabel}>Custom</Text>
          </TouchableOpacity>
        </View>
        {selectedBg === 'custom' && (
          <View style={styles.customColorWrap}>
            <Text style={styles.customColorLabel}>Pick any color</Text>
            <View style={styles.customRow}>
              <View style={[styles.customPreview, { backgroundColor: customBgColor }]} />
              <Text style={styles.customColorValue}>{customBgColor.toUpperCase()}</Text>
            </View>
            <View style={styles.paletteGrid}>
              {CUSTOM_PALETTE.map((hex) => (
                <TouchableOpacity
                  key={hex}
                  style={[
                    styles.paletteSwatch,
                    { backgroundColor: hex },
                    customBgColor.toLowerCase() === hex.toLowerCase() && styles.paletteSwatchOn,
                  ]}
                  onPress={() => setCustomBgColor(hex)}
                />
              ))}
            </View>
            <Text style={styles.customHint}>Tap a swatch to select custom background color.</Text>
          </View>
        )}

      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.totalP}>{totalPhotos} Photos</Text>
          <Text style={styles.totalRs}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.addCart} onPress={handleAddToCart}>
          <Text style={styles.addCartText}>Add to cart</Text>
          <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
  hero: { height: 180, marginHorizontal: spacing.page, borderRadius: radius.lg, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  heroH: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  heroP: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  body: { paddingHorizontal: spacing.page, marginTop: 20 },
  secTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 20,
    paddingHorizontal: spacing.page,
  },
  secSub: { fontSize: 13, color: colors.textMuted, marginTop: 4, paddingHorizontal: spacing.page },
  uploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbFallback: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  upOkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  upOk: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  bwTag: { fontSize: 11, color: colors.primaryLight, marginTop: 4, fontWeight: '600' },
  previewBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewBtnText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  uploadBtn: {
    marginHorizontal: spacing.page,
    marginTop: 12,
    padding: 24,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  uploadBtnText: { marginTop: 8, color: colors.textPrimary, fontWeight: '600' },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
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
  packRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginTop: 12,
  },
  packBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  packBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  packLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  packPrice: { fontSize: 15, fontWeight: '800', color: colors.accent, marginTop: 4 },
  sizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    marginTop: 10,
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeBtnOn: { borderColor: colors.primary },
  sizeName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sizeDims: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    backgroundColor: colors.primary + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.page,
    marginTop: 12,
  },
  bgBtn: {
    width: '22%',
    minWidth: 72,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bgBtnOn: { borderColor: colors.primary },
  swatch: { width: 36, height: 36, borderRadius: 18, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  bgLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  customColorWrap: {
    marginTop: 12,
    marginHorizontal: spacing.page,
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customColorLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customPreview: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  customColorValue: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  paletteSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paletteSwatchOn: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  customHint: { marginTop: 8, color: colors.textMuted, fontSize: 11 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalP: { fontSize: 14, color: colors.textSecondary },
  totalRs: { fontSize: 24, fontWeight: '800', color: colors.accent },
  addCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  addCartText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
