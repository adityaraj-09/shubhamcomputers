import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { colors, radius } from '../theme/colors';
import { href } from '../utils/routes';
import FileTypeIcon from './FileTypeIcon';
import ImageEditModal from './ImageEditModal';
import FilePreviewModal from './FilePreviewModal';

const COLOR_PRICE = { bw: 3, colour: 10 };

const isImage = (name = '') =>
  ['jpg', 'jpeg', 'png', 'webp'].includes(name.split('.').pop().toLowerCase());
const isPdf = (name = '') => name.split('.').pop()?.toLowerCase() === 'pdf';

const defaultConfig = () => ({
  copies: 1,
  pages: 1,
  color: 'bw',
  orientation: 'portrait',
  sides: 'single',
  imageAdjustments: {
    rotation: 0,
    cropMode: 'original',
    bw: false,
  },
});

const ALLOWED_EXT = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
];
const MAX_FILES = 15;
const MAX_SIZE_MB = 50;

const toFileMeta = (asset) => ({
  uri: asset.uri,
  name: asset.name || asset.fileName || 'file',
  size: asset.size || asset.fileSize || 0,
  mimeType: asset.mimeType || 'application/octet-stream',
});

export default function PrintOrderConfig({ uploadedFiles, onAddMoreFiles, onBack, embedded = false }) {
  const router = useRouter();
  const { addToCart } = useAuth();
  const [current, setCurrent] = useState(0);
  const [configs, setConfigs] = useState(() => uploadedFiles.map(() => defaultConfig()));
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorAsset, setEditorAsset] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    setConfigs((prev) => {
      if (uploadedFiles.length > prev.length) {
        const extra = uploadedFiles.slice(prev.length).map(() => defaultConfig());
        return [...prev, ...extra];
      }
      return prev.slice(0, uploadedFiles.length);
    });
  }, [uploadedFiles.length]);

  const updateConfig = (key, value) => {
    setConfigs((prev) =>
      prev.map((c, i) => (i === current ? { ...c, [key]: value } : c))
    );
  };

  const updateImageAdjustments = (key, value) => {
    setConfigs((prev) =>
      prev.map((c, i) =>
        i === current
          ? {
              ...c,
              imageAdjustments: {
                ...(c.imageAdjustments || defaultConfig().imageAdjustments),
                [key]: value,
              },
            }
          : c
      )
    );
  };

  const applyToAll = () => {
    const base = configs[current];
    setConfigs((prev) => prev.map(() => ({ ...base })));
    Toast.show({ type: 'success', text1: 'Settings applied to all files' });
  };

  const totalPages = configs.reduce((sum, c, i) => {
    return sum + (uploadedFiles[i] ? c.copies * c.pages : 0);
  }, 0);

  const totalPrice = configs.reduce((sum, c, i) => {
    if (!uploadedFiles[i]) return sum;
    return sum + c.copies * c.pages * COLOR_PRICE[c.color];
  }, 0);

  const pickMore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const assets = result.assets || [];
      const files = assets.map((a) => ({
        uri: a.uri,
        name: a.name || 'file',
        size: a.size || 0,
        mimeType: a.mimeType || 'application/octet-stream',
      }));
      if (files.length) onAddMoreFiles?.(files);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not add files' });
    }
  };

  const pickMoreFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (result.canceled) return;
      const first = result.assets?.[0];
      if (!first) return;
      onAddMoreFiles?.([
        {
          uri: first.uri,
          name: first.fileName || first.name || 'image.jpg',
          size: first.fileSize || first.size || 0,
          mimeType: first.mimeType || 'image/jpeg',
        },
      ]);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not add gallery images' });
    }
  };

  const handleAddToCart = () => {
    uploadedFiles.forEach((f, i) => {
      const cfg = configs[i] || defaultConfig();
      const pricePerPage = COLOR_PRICE[cfg.color];
      const lineTotal = cfg.copies * cfg.pages * pricePerPage;
      addToCart({
        id: f.id,
        type: 'print',
        name: f.name,
        price: lineTotal,
        quantity: 1,
        image: f.thumbnailLink || f.viewLink || null,
        fileUrl: f.viewLink || f.thumbnailLink || null,
        driveFileId: f.id,
        printConfig: { ...cfg },
      });
    });
    Toast.show({ type: 'success', text1: 'Added to cart!' });
    router.push(href.checkout);
  };

  const cfg = configs[current] || defaultConfig();
  const currentFile = uploadedFiles[current];
  const currentIsImage = isImage(currentFile?.name || '');
  const currentIsPdf = isPdf(currentFile?.name || '');
  const currentPdfUri = currentFile?.viewLink || currentFile?.fileUrl || currentFile?.uri || null;

  const handlePdfLoad = (index, pages) => {
    if (!pages || pages < 1) return;
    setPdfPageCount((prev) => {
      if (prev[index] === pages) return prev;
      return { ...prev, [index]: pages };
    });
    setConfigs((prev) =>
      prev.map((c, i) => (i === index && c.pages === 1 ? { ...c, pages } : c))
    );
  };

  return (
    <View style={[styles.page, embedded && styles.pageEmbedded]}>
      <ImageEditModal
        visible={editorVisible}
        asset={editorAsset}
        onCancel={() => {
          setEditorVisible(false);
          setEditorAsset(null);
        }}
        onDone={(edited) => {
          setEditorVisible(false);
          setEditorAsset(null);
          onAddMoreFiles?.([
            {
              uri: edited.uri,
              name: edited.name || 'image.jpg',
              size: edited.size || 0,
              mimeType: edited.mimeType || 'image/jpeg',
            },
          ]);
          if (edited.isBlackWhite) {
            updateConfig('color', 'bw');
          }
        }}
      />
      <FilePreviewModal
        visible={previewVisible}
        file={{
          ...currentFile,
          name: currentFile?.name,
          uri: currentFile?.viewLink || currentFile?.thumbnailLink || currentFile?.uri || null,
        }}
        onClose={() => setPreviewVisible(false)}
        onEditImage={
          currentIsImage && (currentFile?.viewLink || currentFile?.thumbnailLink || currentFile?.uri)
            ? () => {
                setPreviewVisible(false);
                setEditorAsset({
                  name: currentFile?.name || 'image.jpg',
                  uri: currentFile?.viewLink || currentFile?.thumbnailLink || currentFile?.uri,
                });
                setEditorVisible(true);
              }
            : null
        }
      />
      <View style={[styles.header, embedded && styles.headerEmbedded]}>
        {embedded ? (
          <Text style={styles.headerTitle}>Preview & Print Setup</Text>
        ) : (
          <TouchableOpacity onPress={onBack} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {!embedded && <Text style={styles.headerTitle}>Print Setup</Text>}
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addFiles} onPress={pickMoreFromGallery}>
            <Feather name="image" size={16} color={colors.primary} />
            <Text style={styles.addFilesText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addFiles} onPress={pickMore}>
            <Feather name="folder-plus" size={16} color={colors.primary} />
            <Text style={styles.addFilesText}>Files</Text>
          </TouchableOpacity>
          {embedded && (
            <TouchableOpacity style={styles.addFiles} onPress={onBack}>
              <Feather name="x" size={16} color={colors.primary} />
              <Text style={styles.addFilesText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.sliderScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
      >
        {uploadedFiles.map((f, i) => (
          <TouchableOpacity
            key={f.id || i}
            style={[styles.slide, i === current && styles.slideActive]}
            onPress={() => setCurrent(i)}
          >
            {(isImage(f.name) || isPdf(f.name)) && (f.thumbnailLink || f.viewLink) ? (
              <Image
                source={{ uri: f.thumbnailLink || f.viewLink }}
                style={styles.slideImg}
              />
            ) : (
              <View style={styles.slideIcon}>
                <FileTypeIcon fileName={f.name} size={32} />
                <Text style={styles.ext}>{f.name?.split('.').pop()?.toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.counter}>
        {current + 1}/{uploadedFiles.length}
      </Text>

      <ScrollView
        style={[styles.config, embedded && styles.configEmbedded]}
        nestedScrollEnabled={embedded}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text style={styles.secTitle}>Selected file preview</Text>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.previewActionBtn} onPress={() => setPreviewVisible(true)}>
            <Feather name="eye" size={14} color={colors.primary} />
            <Text style={styles.previewActionText}>Open preview</Text>
          </TouchableOpacity>
          {currentIsImage && (
            <TouchableOpacity
              style={styles.previewActionBtn}
              onPress={() => {
                setEditorAsset({
                  name: currentFile?.name || 'image.jpg',
                  uri: currentFile?.viewLink || currentFile?.thumbnailLink || currentFile?.uri,
                });
                setEditorVisible(true);
              }}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
              <Text style={styles.previewActionText}>Edit & re-add</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.previewCard}>
          {currentIsImage && (currentFile?.viewLink || currentFile?.thumbnailLink) ? (
            <Image
              source={{ uri: currentFile.viewLink || currentFile.thumbnailLink }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : currentIsPdf ? (
            <View style={styles.pdfPreviewWrap}>
              <View style={styles.pdfHeader}>
                <FileTypeIcon fileName={currentFile?.name || 'file.pdf'} size={24} />
                <Text style={styles.pdfTitle} numberOfLines={1}>
                  {currentFile?.name}
                </Text>
              </View>
              {!!currentPdfUri ? (
                <View style={styles.pdfViewerWrap}>
                  <WebView
                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentPdfUri)}` }}
                    style={styles.pdfViewer}
                    onError={() => {
                      Toast.show({ type: 'error', text1: 'Could not render PDF preview' });
                    }}
                  />
                </View>
              ) : (
                <View style={styles.pdfFallback}>
                  <Feather name="file-text" size={22} color={colors.primaryLight} />
                  <Text style={styles.pdfPageText}>PDF preview not available for this file</Text>
                </View>
              )}
              <Text style={styles.pdfHint}>
                {pdfPageCount[current] ? `${pdfPageCount[current]} page(s) detected` : 'Loading pages...'}
              </Text>
              {!!(currentFile?.viewLink || currentFile?.fileUrl) && (
                <TouchableOpacity
                  style={styles.openPdfBtn}
                  onPress={() => Linking.openURL(currentFile.viewLink || currentFile.fileUrl)}
                >
                  <Feather name="external-link" size={14} color={colors.primaryLight} />
                  <Text style={styles.openPdfBtnText}>Open full PDF</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.genericPreviewWrap}>
              <FileTypeIcon fileName={currentFile?.name || 'file'} size={34} />
              <Text style={styles.genericPreviewName} numberOfLines={2}>
                {currentFile?.name || 'Selected file'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.secTitle}>All files and pages</Text>
        <View style={styles.fileList}>
          <ScrollView
            style={styles.fileListScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {uploadedFiles.map((f, idx) => {
              const fileCfg = configs[idx] || defaultConfig();
              const active = idx === current;
              return (
                <TouchableOpacity
                  key={`${f.id || idx}-meta`}
                  style={[styles.fileRow, active && styles.fileRowActive]}
                  onPress={() => setCurrent(idx)}
                >
                  <FileTypeIcon fileName={f.name} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileRowName} numberOfLines={1}>
                      {f.name}
                    </Text>
                    <Text style={styles.fileRowMeta}>
                      {fileCfg.pages} page{fileCfg.pages !== 1 ? 's' : ''} · {fileCfg.copies} cop
                      {fileCfg.copies !== 1 ? 'ies' : 'y'}
                    </Text>
                  </View>
                  <Feather
                    name={active ? 'check-circle' : 'chevron-right'}
                    size={16}
                    color={active ? colors.accent : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.secTitle}>Number of copies</Text>
            <Text style={styles.secSub}>
              File {current + 1} ({cfg.pages} page{cfg.pages !== 1 ? 's' : ''})
            </Text>
          </View>
          <View style={styles.counterBtns}>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => updateConfig('copies', Math.max(1, cfg.copies - 1))}
            >
              <Feather name="minus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.countVal}>{cfg.copies}</Text>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => updateConfig('copies', cfg.copies + 1)}
            >
              <Feather name="plus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.secTitle}>Number of pages</Text>
            <Text style={styles.secSub}>Set pages in this document</Text>
          </View>
          <View style={styles.counterBtns}>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => updateConfig('pages', Math.max(1, cfg.pages - 1))}
            >
              <Feather name="minus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.countVal}>{cfg.pages}</Text>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => updateConfig('pages', cfg.pages + 1)}
            >
              <Feather name="plus" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.secTitle}>Print sides</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, cfg.sides === 'both' && styles.toggleOn]}
            onPress={() => updateConfig('sides', 'both')}
          >
            <Feather name="file-text" size={16} color={colors.textPrimary} />
            <Text style={styles.toggleText}>Both sides</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, cfg.sides === 'single' && styles.toggleOn]}
            onPress={() => updateConfig('sides', 'single')}
          >
            <Feather name="file-text" size={16} color={colors.textPrimary} />
            <Text style={styles.toggleText}>One side</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.secTitle}>Choose print color</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, cfg.color === 'colour' && styles.toggleOn]}
            onPress={() => updateConfig('color', 'colour')}
          >
            <Text style={styles.toggleText}>Coloured</Text>
            <Text style={styles.priceHint}>₹10/page</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, cfg.color === 'bw' && styles.toggleOn]}
            onPress={() => updateConfig('color', 'bw')}
          >
            <Text style={styles.toggleText}>B & W</Text>
            <Text style={styles.priceHint}>₹3/page</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.secTitle}>Orientation</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, cfg.orientation === 'portrait' && styles.toggleOn]}
            onPress={() => updateConfig('orientation', 'portrait')}
          >
            <Text style={styles.toggleText}>Portrait</Text>
            <Text style={styles.priceHint}>8.3 × 11.7 in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, cfg.orientation === 'landscape' && styles.toggleOn]}
            onPress={() => updateConfig('orientation', 'landscape')}
          >
            <Text style={styles.toggleText}>Landscape</Text>
            <Text style={styles.priceHint}>11.7 × 8.3 in</Text>
          </TouchableOpacity>
        </View>

        {isImage(uploadedFiles[current]?.name) && (
          <>
            <Text style={styles.secTitle}>Image edits</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  (cfg.imageAdjustments?.rotation || 0) > 0 && styles.toggleOn,
                ]}
                onPress={() =>
                  updateImageAdjustments(
                    'rotation',
                    ((cfg.imageAdjustments?.rotation || 0) + 90) % 360
                  )
                }
              >
                <Feather name="rotate-cw" size={16} color={colors.textPrimary} />
                <Text style={styles.toggleText}>Rotate</Text>
                <Text style={styles.priceHint}>{cfg.imageAdjustments?.rotation || 0}°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, cfg.imageAdjustments?.bw && styles.toggleOn]}
                onPress={() =>
                  updateImageAdjustments('bw', !cfg.imageAdjustments?.bw)
                }
              >
                <Feather name="droplet" size={16} color={colors.textPrimary} />
                <Text style={styles.toggleText}>Black & White</Text>
                <Text style={styles.priceHint}>
                  {cfg.imageAdjustments?.bw ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  cfg.imageAdjustments?.cropMode === 'fit' && styles.toggleOn,
                ]}
                onPress={() => updateImageAdjustments('cropMode', 'fit')}
              >
                <Feather name="maximize" size={16} color={colors.textPrimary} />
                <Text style={styles.toggleText}>Crop to fit</Text>
                <Text style={styles.priceHint}>Trim edges if needed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  cfg.imageAdjustments?.cropMode === 'original' && styles.toggleOn,
                ]}
                onPress={() => updateImageAdjustments('cropMode', 'original')}
              >
                <Feather name="minimize" size={16} color={colors.textPrimary} />
                <Text style={styles.toggleText}>Keep original</Text>
                <Text style={styles.priceHint}>No auto-crop</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {uploadedFiles.length > 1 && (
          <View style={styles.applyRow}>
            <Text style={styles.applyText}>Apply this setting to all files</Text>
            <TouchableOpacity onPress={applyToAll}>
              <Text style={styles.applyBtn}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottom, embedded && styles.bottomEmbedded]}>
        <View>
          <Text style={styles.totalPages}>
            Total {totalPages} page{totalPages !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.totalPrice}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={styles.cartBtnText}>Add to cart</Text>
          <Feather name="chevron-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export async function uploadMorePrintFiles(uploadedFiles, newFileMetas, setUploading) {
  const remaining = MAX_FILES - uploadedFiles.length;
  if (remaining <= 0) {
    Toast.show({ type: 'error', text1: `Maximum ${MAX_FILES} files allowed` });
    return null;
  }
  const valid = [];
  for (const file of newFileMetas.slice(0, remaining)) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      Toast.show({ type: 'error', text1: `${file.name}: Unsupported type` });
      continue;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      Toast.show({ type: 'error', text1: `${file.name}: Exceeds ${MAX_SIZE_MB}MB` });
      continue;
    }
    valid.push(file);
  }
  if (valid.length === 0) return null;
  setUploading(true);
  try {
    const formData = new FormData();
    valid.forEach((f) => {
      formData.append('files', {
        uri: f.uri,
        name: f.name,
        type: f.mimeType || 'application/octet-stream',
      });
    });
    const { data } = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    Toast.show({ type: 'success', text1: `${data.files.length} more file(s) added!` });
    return [...uploadedFiles, ...data.files];
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: err.response?.data?.error || 'Upload failed',
    });
    return null;
  } finally {
    setUploading(false);
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgDark },
  pageEmbedded: {
    flex: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerEmbedded: {
    justifyContent: 'space-between',
  },
  addFiles: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addFilesText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderScroll: { flexGrow: 0 },
  slider: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  slide: {
    width: 62,
    height: 62,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
    backgroundColor: colors.bgCard,
  },
  slideActive: { borderColor: colors.primary },
  slideImg: { width: '100%', height: '100%' },
  slideIcon: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ext: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  counter: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  config: { flex: 1, paddingHorizontal: 16 },
  configEmbedded: {
    flex: 0,
    maxHeight: 620,
  },
  previewCard: {
    marginTop: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    minHeight: 220,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.bgSurface,
  },
  pdfPreviewWrap: {
    padding: 12,
    gap: 10,
  },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pdfTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  pdfViewerWrap: {
    width: '100%',
    height: 320,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  pdfViewer: { flex: 1, width: '100%', height: '100%', backgroundColor: colors.bgSurface },
  pdfFallback: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  pdfPageText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  pdfHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  openPdfBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  openPdfBtnText: { fontSize: 12, color: colors.primaryLight, fontWeight: '700' },
  genericPreviewWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: colors.bgSurface,
  },
  genericPreviewName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  fileList: {
    marginTop: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fileListScroll: { maxHeight: 260 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fileRowActive: { backgroundColor: colors.primary + '1a' },
  fileRowName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  fileRowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  secTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
  secSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  previewActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  previewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  previewActionText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  counterBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  toggle: {
    flex: 1,
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  toggleText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  priceHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  applyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.sm,
  },
  applyText: { color: colors.textSecondary, fontSize: 13 },
  applyBtn: { color: colors.primary, fontWeight: '700' },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomEmbedded: {
    paddingBottom: 16,
  },
  totalPages: { fontSize: 13, color: colors.textSecondary },
  totalPrice: { fontSize: 22, fontWeight: '800', color: colors.accent },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  cartBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
