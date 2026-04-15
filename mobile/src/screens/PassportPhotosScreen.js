import React, { useState, useRef } from 'react';
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
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageEditor } from 'expo-dynamic-image-crop';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius, spacing } from '../theme/colors';
import { href } from '../utils/routes';
import FileTypeIcon from '../components/FileTypeIcon';
import FilePreviewModal from '../components/FilePreviewModal';

const CATEGORIES = [
  { id: 'passport', label: 'Standard Passport A4 Photos', icon: 'user' },
  { id: 'postcard', label: 'Post Card', icon: 'layout' },
  { id: 'a4', label: 'A4 Print', icon: 'file-text' },
];

const PASSPORT_PACKS = [
  { id: 'pack6', label: '6 Photos', price: 30 },
  { id: 'pack12', label: '12 Photos', price: 50 },
  { id: 'pack36', label: '36 Photos', price: 80 },
];

const POSTCARD_OPTIONS = [
  { id: 'small', label: '4" x 6" Size Photo', price: 30 },
];

const A4_OPTIONS = [
  { id: 'a4glossy', label: 'A4 Size Glossy Print', price: 60 },
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

const hsvToHex = (h, s, v) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
};

const CUSTOM_PALETTE = (() => {
  const shades = [0.95, 0.8, 0.65];
  const list = [];
  for (let h = 0; h < 360; h += 30) {
    shades.forEach((v) => list.push(hsvToHex(h, 0.75, v)));
  }
  list.push('#ffffff', '#f5f5f5', '#d9d9d9', '#111111');
  return list;
})();

export default function PassportPhotosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('passport');
  const [selectedPack, setSelectedPack] = useState('pack6');
  const [selectedBg, setSelectedBg] = useState('white');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [selectedPostcard, setSelectedPostcard] = useState('small');
  const [selectedA4, setSelectedA4] = useState('a4glossy');
  const [localUri, setLocalUri] = useState(null);
  const [localAsset, setLocalAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [isBW, setIsBW] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const [showBrightness, setShowBrightness] = useState(false);
  const sliderWidth = useRef(200);
  // normalized 0-1 position for brightness (1.0 brightness = ~0.412)
  const sliderPos = useSharedValue((1.0 - 0.3) / 1.7);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const ratio = Math.max(0, Math.min(1, e.x / sliderWidth.current));
      sliderPos.value = ratio;
      runOnJS(setBrightness)(0.3 + ratio * 1.7);
    })
    .onUpdate((e) => {
      const ratio = Math.max(0, Math.min(1, e.x / sliderWidth.current));
      sliderPos.value = ratio;
      runOnJS(setBrightness)(0.3 + ratio * 1.7);
    });

  const thumbAnimStyle = useAnimatedStyle(() => ({
    left: `${sliderPos.value * 100}%`,
  }));

  const fillAnimStyle = useAnimatedStyle(() => ({
    width: `${sliderPos.value * 100}%`,
  }));

  const clearFile = () => {
    setLocalUri(null);
    setLocalAsset(null);
    setIsBW(false);
    setBrightness(1.0);
    setShowBrightness(false);
    sliderPos.value = (1.0 - 0.3) / 1.7;
  };

  const changeCategory = (catId) => {
    if (catId === selectedCategory) return;
    setSelectedCategory(catId);
    clearFile();
  };

  const applyManipulation = async (actions) => {
    if (!localUri) return;
    try {
      const result = await ImageManipulator.manipulateAsync(localUri, actions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setLocalUri(result.uri);
      // update the asset uri so the final upload uses the edited version
      setLocalAsset((prev) => ({ ...prev, uri: result.uri }));
    } catch {
      Toast.show({ type: 'error', text1: 'Could not apply edit' });
    }
  };

  // Uploads the current localAsset to the server and returns the server file object.
  const uploadLocalAsset = async () => {
    if (!localAsset) return null;
    const formData = new FormData();
    formData.append('files', {
      uri: localAsset.uri,
      name: localAsset.name || 'photo.jpg',
      type: localAsset.mimeType || 'application/octet-stream',
    });
    const { data } = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const uploaded = data.files?.[0];
    if (!uploaded) throw new Error('Upload failed');
    return uploaded;
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
    setLocalUri(asset.uri);
    setLocalAsset({ uri: asset.uri, name: asset.fileName || asset.name || 'photo.jpg', mimeType: 'image/jpeg' });
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
      const isImage = asset.mimeType?.startsWith('image/');
      if (isImage) setLocalUri(asset.uri);
      setLocalAsset({ uri: asset.uri, name: asset.name || 'file', mimeType: asset.mimeType || 'application/octet-stream' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick file' });
    }
  };

  const getTotal = () => {
    if (selectedCategory === 'passport') {
      return PASSPORT_PACKS.find((p) => p.id === selectedPack)?.price ?? 0;
    }
    if (selectedCategory === 'postcard') {
      return POSTCARD_OPTIONS.find((o) => o.id === selectedPostcard)?.price ?? 0;
    }
    if (selectedCategory === 'a4') {
      return A4_OPTIONS.find((o) => o.id === selectedA4)?.price ?? 0;
    }
    return 0;
  };

  const getCartLabel = () => {
    if (selectedCategory === 'passport') {
      const pack = PASSPORT_PACKS.find((p) => p.id === selectedPack);
      const bg =
        selectedBg === 'custom'
          ? ('Custom (' + customBgColor.toUpperCase() + ')')
          : BACKGROUNDS.find((b) => b.id === selectedBg)?.label;
      return 'Passport Photos - ' + pack?.label + ', ' + bg + ' bg';
    }
    if (selectedCategory === 'postcard') {
      const opt = POSTCARD_OPTIONS.find((o) => o.id === selectedPostcard);
      return 'Post Card - ' + opt?.label;
    }
    if (selectedCategory === 'a4') {
      const opt = A4_OPTIONS.find((o) => o.id === selectedA4);
      return 'A4 Print - ' + opt?.label;
    }
    return '';
  };

  const handleAddToCart = async () => {
    setUploading(true);
    let serverFile = null;
    try {
      if (localAsset) {
        serverFile = await uploadLocalAsset();
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Upload failed' });
      setUploading(false);
      return;
    }
    setUploading(false);

    const total = getTotal();
    const label = getCartLabel();
    const options = {};
    if (selectedCategory === 'passport') {
      const pack = PASSPORT_PACKS.find((p) => p.id === selectedPack);
      const bgObj =
        selectedBg === 'custom'
          ? { label: 'Custom (' + customBgColor.toUpperCase() + ')', color: customBgColor }
          : BACKGROUNDS.find((b) => b.id === selectedBg);
      options.pack = pack?.label;
      options.background = bgObj?.label;
    }
    if (selectedCategory === 'postcard') {
      const opt = POSTCARD_OPTIONS.find((o) => o.id === selectedPostcard);
      options.size = opt?.label;
    }
    if (selectedCategory === 'a4') {
      const opt = A4_OPTIONS.find((o) => o.id === selectedA4);
      options.size = opt?.label;
    }
    if (isBW) options.isBlackWhite = true;
    if (brightness !== 1.0) options.brightness = Math.round(brightness * 100);
    addToCart({
      id: 'print-photo-' + Date.now(),
      type: 'mart',
      name: label,
      price: total,
      quantity: 1,
      image: serverFile?.thumbnailLink || serverFile?.viewLink || localUri || null,
      fileUrl: serverFile?.viewLink || null,
      options,
      mrp: null,
    });
    Toast.show({ type: 'success', text1: 'Added to cart!' });
    router.push(href.checkout);
  };

  const total = getTotal();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FilePreviewModal
        visible={previewVisible}
        file={{
          name: localAsset?.name || 'photo.jpg',
          uri: localUri,
          mimeType: localAsset?.mimeType || 'image/jpeg',
        }}
        onClose={() => setPreviewVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Print Photos</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Crop editor modal */}
      {localUri ? (
        <ImageEditor
          isVisible={cropMode}
          imageUri={localUri}
          onEditingComplete={(data) => {
            setLocalUri(data.uri);
            setLocalAsset((prev) => ({ ...prev, uri: data.uri }));
            setCropMode(false);
          }}
          onEditingCancel={() => setCropMode(false)}
          dynamicCrop={true}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {localUri ? (
          <View>
            {/* ── Image card with tool strip ── */}
            <View style={styles.previewCard}>
              <View style={styles.toolStrip}>
                {/* 1. Crop */}
                <TouchableOpacity
                  style={[styles.toolBtn, cropMode && styles.toolBtnActive]}
                  onPress={() => setCropMode(true)}
                >
                  <Feather name="crop" size={20} color={cropMode ? '#fff' : colors.primary} />
                </TouchableOpacity>
                {/* 2. Rotate left */}
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => applyManipulation([{ rotate: -90 }])}
                >
                  <Feather name="rotate-ccw" size={20} color={colors.primary} />
                </TouchableOpacity>
                {/* 3. Rotate right */}
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => applyManipulation([{ rotate: 90 }])}
                >
                  <Feather name="rotate-cw" size={20} color={colors.primary} />
                </TouchableOpacity>
                {/* 4. B&W */}
                <TouchableOpacity
                  style={[styles.toolBtn, isBW && styles.toolBtnActive]}
                  onPress={() => setIsBW((v) => !v)}
                >
                  <MaterialCommunityIcons
                    name="circle-half-full"
                    size={20}
                    color={isBW ? '#fff' : colors.primary}
                  />
                </TouchableOpacity>
                {/* 5. Brightness */}
                <TouchableOpacity
                  style={[styles.toolBtn, showBrightness && styles.toolBtnActive]}
                  onPress={() => setShowBrightness((v) => !v)}
                >
                  <Feather name="sun" size={20} color={showBrightness ? '#fff' : colors.primary} />
                </TouchableOpacity>
              </View>
              {/* filter goes on View — more reliable than on Image in RN 0.81 */}
              <View
                style={[
                  styles.previewImgWrap,
                  { filter: `grayscale(${isBW ? 1 : 0}) brightness(${brightness})` },
                ]}
              >
                <Image
                  source={{ uri: localUri }}
                  style={styles.previewImg}
                  resizeMode="contain"
                />
                <TouchableOpacity style={styles.previewRemoveBtn} onPress={clearFile}>
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            {/* ── Brightness slider ── */}
            {showBrightness && (
              <View style={styles.brightnessPanel}>
                <Feather name="moon" size={14} color={colors.textMuted} />
                <GestureDetector gesture={panGesture}>
                  <View
                    style={styles.sliderTrack}
                    onLayout={(e) => { sliderWidth.current = e.nativeEvent.layout.width; }}
                  >
                    <Animated.View style={[styles.sliderFill, fillAnimStyle]} />
                    <Animated.View style={[styles.sliderThumb, thumbAnimStyle]} />
                  </View>
                </GestureDetector>
                <Feather name="sun" size={18} color={colors.textMuted} />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.uploadBox, uploading && { opacity: 0.6 }]}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Feather name="upload-cloud" size={28} color={colors.primary} />
                <Text style={styles.uploadBoxText}>Upload photo or document</Text>
                <Text style={styles.uploadBoxSub}>Gallery or Files · up to 20 MB</Text>
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

        <Text style={styles.secTitle}>Select Category</Text>
        <Text style={styles.secSub}>One category per file upload</Text>
        <View style={styles.catList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catBtn,
                selectedCategory === cat.id && styles.catBtnOn,
                cat.comingSoon && styles.catBtnDisabled,
              ]}
              onPress={() => !cat.comingSoon && changeCategory(cat.id)}
              activeOpacity={cat.comingSoon ? 1 : 0.8}
            >
              <View style={styles.catBtnInner}>
                <Feather
                  name={cat.icon}
                  size={18}
                  color={
                    selectedCategory === cat.id && !cat.comingSoon
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.catBtnLabel,
                    selectedCategory === cat.id && !cat.comingSoon && styles.catBtnLabelOn,
                  ]}
                >
                  {cat.label}
                </Text>
              </View>
              {cat.comingSoon ? (
                <Text style={styles.comingSoonBadge}>Coming Soon</Text>
              ) : (
                <View style={[styles.radio, selectedCategory === cat.id && styles.radioOn]}>
                  {selectedCategory === cat.id && <View style={styles.radioDot} />}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategory === 'passport' && (
          <>
            <Text style={styles.secTitle}>Choose Pack</Text>
            <View style={styles.packRow}>
              {PASSPORT_PACKS.map((p) => (
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
                        customBgColor.toLowerCase() === hex.toLowerCase() &&
                          styles.paletteSwatchOn,
                      ]}
                      onPress={() => setCustomBgColor(hex)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {selectedCategory === 'postcard' && (
          <>
            <Text style={styles.secTitle}>Choose Size</Text>
            <View style={styles.optList}>
              {POSTCARD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optBtn, selectedPostcard === opt.id && styles.optBtnOn]}
                  onPress={() => setSelectedPostcard(opt.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optLabel}>{opt.label}</Text>
                  </View>
                  <Text style={styles.optPrice}>₹{opt.price}</Text>
                  <View
                    style={[
                      styles.radio,
                      selectedPostcard === opt.id && styles.radioOn,
                      { marginLeft: 12 },
                    ]}
                  >
                    {selectedPostcard === opt.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedCategory === 'a4' && (
          <>
            <Text style={styles.secTitle}>Choose Option</Text>
            <View style={styles.optList}>
              {A4_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optBtn, selectedA4 === opt.id && styles.optBtnOn]}
                  onPress={() => setSelectedA4(opt.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optLabel}>{opt.label}</Text>
                  </View>
                  <Text style={styles.optPrice}>₹{opt.price}</Text>
                  <View
                    style={[
                      styles.radio,
                      selectedA4 === opt.id && styles.radioOn,
                      { marginLeft: 12 },
                    ]}
                  >
                    {selectedA4 === opt.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₹{total}</Text>
          </View>
          <TouchableOpacity style={[styles.addCart, uploading && { opacity: 0.7 }]} onPress={handleAddToCart} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.addCartText}>Add to Cart</Text>
                <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
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
  secTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 20,
    paddingHorizontal: spacing.page,
  },
  secSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    paddingHorizontal: spacing.page,
  },
  catList: { marginTop: 12, paddingHorizontal: spacing.page, gap: 10 },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary + '11' },
  catBtnDisabled: { opacity: 0.5 },
  catBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  catBtnLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  catBtnLabelOn: { color: colors.primary, fontWeight: '700' },
  comingSoonBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  packRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.page, marginTop: 12 },
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
  packPrice: { fontSize: 16, fontWeight: '800', color: colors.accent, marginTop: 4 },
  optList: { marginTop: 12, paddingHorizontal: spacing.page, gap: 10 },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary + '11' },
  optLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  optPrice: { fontSize: 16, fontWeight: '800', color: colors.accent },
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
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  paletteSwatchOn: { borderColor: colors.primary, borderWidth: 2 },
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
  upName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  upOkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  upOk: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  previewBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewBtnText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  uploadBox: {
    marginHorizontal: spacing.page,
    marginTop: 12,
    padding: 28,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  uploadBoxText: { marginTop: 10, color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  uploadBoxSub: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  // ── Image preview card ─────────────────────────────────────────────────────
  previewCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.page,
    marginTop: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolStrip: {
    width: 44,
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    marginVertical: 2,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
  },
  brightnessPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    top: -8,
    marginLeft: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  previewImgWrap: {
    flex: 1,
    aspectRatio: 0.8,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  previewRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
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
  totalLabel: { fontSize: 13, color: colors.textSecondary },
  totalPrice: { fontSize: 24, fontWeight: '800', color: colors.accent },
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