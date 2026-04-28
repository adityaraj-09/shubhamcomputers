import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import API from '../api/client';
import { colors, radius } from '../theme/colors';
import FileTypeIcon from './FileTypeIcon';
import ImageEditModal from './ImageEditModal';
import FilePreviewModal from './FilePreviewModal';

const MAX_FILES = 15;
const MAX_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = [
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

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toFileMeta = (asset) => ({
  uri: asset.uri,
  name: asset.name || asset.fileName || 'file',
  size: asset.size || asset.fileSize || 0,
  mimeType: asset.mimeType || 'application/octet-stream',
});

export default function FileUpload({ onFilesUploaded }) {
  const [pending, setPending] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorAsset, setEditorAsset] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewPendingIndex, setPreviewPendingIndex] = useState(null);

  const appendPickedFiles = (selected) => {
    const totalCount = pending.length + uploadedFiles.length + selected.length;
    if (totalCount > MAX_FILES) {
      Toast.show({ type: 'error', text1: `Maximum ${MAX_FILES} files allowed` });
      return;
    }
    const valid = [];
    for (const asset of selected) {
      const name = asset.name || 'file';
      const ext = '.' + name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        Toast.show({ type: 'error', text1: `${name}: Unsupported file type` });
        continue;
      }
      const size = asset.size || 0;
      if (size > MAX_SIZE_MB * 1024 * 1024) {
        Toast.show({ type: 'error', text1: `${name}: Exceeds ${MAX_SIZE_MB}MB limit` });
        continue;
      }
      valid.push(asset);
    }
    setPending((p) => [...p, ...valid]);
  };

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const assets = result.assets || [];
      appendPickedFiles(assets.map(toFileMeta));
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick files' });
    }
  };

  const pickFromGallery = async () => {
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
      appendPickedFiles([toFileMeta(first)]);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not pick images' });
    }
  };

  const removePending = (index) => {
    setPending((p) => p.filter((_, i) => i !== index));
  };

  const removeUploaded = (index) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onFilesUploaded?.(updated);
      return updated;
    });
  };

  const openPreview = (file, pendingIndex = null) => {
    setPreviewFile(file);
    setPreviewPendingIndex(pendingIndex);
    setPreviewVisible(true);
  };

  const startEditFromPreview = () => {
    if (!previewFile?.uri) return;
    setPreviewVisible(false);
    setEditorAsset({
      ...previewFile,
      width: previewFile.width,
      height: previewFile.height,
    });
    setEditorVisible(true);
  };

  const handleUpload = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    pending.forEach((f) => {
      formData.append('files', {
        uri: f.uri,
        name: f.name,
        type: f.mimeType,
      });
    });
    try {
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUploaded = [...uploadedFiles, ...data.files];
      setUploadedFiles(newUploaded);
      setPending([]);
      onFilesUploaded?.(newUploaded);
      Toast.show({ type: 'success', text1: `${data.files.length} file(s) uploaded!` });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.error || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
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
          const editedFile = {
            uri: edited.uri,
            name: edited.name || 'image.jpg',
            size: edited.size || 0,
            mimeType: edited.mimeType || 'image/jpeg',
          };
          if (typeof previewPendingIndex === 'number') {
            setPending((prev) => prev.map((f, idx) => (idx === previewPendingIndex ? editedFile : f)));
            setPreviewPendingIndex(null);
          } else {
            appendPickedFiles([editedFile]);
          }
          if (edited.isBlackWhite) {
            Toast.show({ type: 'info', text1: 'B/W preference noted for this image' });
          }
        }}
      />
      <FilePreviewModal
        visible={previewVisible}
        file={previewFile}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewFile(null);
          setPreviewPendingIndex(null);
        }}
        onEditImage={typeof previewPendingIndex === 'number' ? startEditFromPreview : null}
      />
      <View style={styles.dropzone}>
        <Feather name="upload-cloud" size={40} color={colors.primary} />
        <Text style={styles.dzTitle}>Upload your files</Text>
        <Text style={styles.dzDesc}>PDF, JPG, PNG, DOCX, XLSX, PPTX</Text>
        <Text style={styles.dzLimits}>
          Max {MAX_SIZE_MB}MB per file • Max {MAX_FILES} files
        </Text>
        <View style={styles.pickBtns}>
          <TouchableOpacity style={styles.pickBtn} onPress={pickDocuments} activeOpacity={0.9}>
            <Feather name="folder" size={16} color={colors.textPrimary} />
            <Text style={styles.pickBtnText}>Files / Folder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickBtn} onPress={pickFromGallery} activeOpacity={0.9}>
            <Feather name="image" size={16} color={colors.textPrimary} />
            <Text style={styles.pickBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {uploadedFiles.length > 0 && (
        <View style={styles.list}>
          <View style={styles.listHeaderRow}>
            <Feather name="check-circle" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={styles.listHeader}>Uploaded ({uploadedFiles.length})</Text>
          </View>
          {uploadedFiles.map((f, i) => (
            <View key={`up-${i}`} style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <FileTypeIcon fileName={f.originalName || f.name} size={24} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {f.originalName || f.name}
                </Text>
                <Text style={styles.fileMeta}>Uploaded to Drive</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => openPreview(f)} hitSlop={8}>
                  <Feather name="eye" size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeUploaded(i)} hitSlop={8}>
                  <Feather name="x" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {pending.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.listHeader}>Selected ({pending.length})</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {pending.map((file, i) => (
              <View key={`p-${i}`} style={styles.fileRow}>
                <View style={styles.fileIcon}>
                  <FileTypeIcon fileName={file.name} size={24} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileMeta}>{formatSize(file.size)}</Text>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => openPreview(file, i)} disabled={uploading}>
                    <Feather name="eye" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePending(i)} disabled={uploading}>
                    <Feather name="x" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDis]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="upload-cloud" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Upload {pending.length} file(s)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  dropzone: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  dzTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  dzDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  dzLimits: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  pickBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
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
  pickBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  list: {
    marginTop: 16,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  fileMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.sm,
    marginTop: 12,
  },
  uploadBtnDis: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
