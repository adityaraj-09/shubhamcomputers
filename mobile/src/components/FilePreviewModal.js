import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';
import FileTypeIcon from './FileTypeIcon';

const isImageName = (name = '') => ['jpg', 'jpeg', 'png', 'webp'].includes(name.split('.').pop()?.toLowerCase());

export default function FilePreviewModal({
  visible,
  file,
  onClose,
  onEditImage,
}) {
  const fileName = file?.name || file?.originalName || 'file';
  const fileUri = file?.uri || file?.viewLink || file?.thumbnailLink || null;
  const canPreviewImage = Boolean(fileUri && isImageName(fileName));

  const openInBrowser = async () => {
    if (!fileUri) return;
    try {
      await Linking.openURL(fileUri);
    } catch {
      // no-op: modal already shows available file details
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              File Preview
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.previewCard}>
              {canPreviewImage ? (
                <Image source={{ uri: fileUri }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={styles.docWrap}>
                  <FileTypeIcon fileName={fileName} size={42} />
                  <Text style={styles.docName} numberOfLines={2}>
                    {fileName}
                  </Text>
                  <Text style={styles.docSub}>Document preview is limited in-app.</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Name</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {fileName}
              </Text>
            </View>
            {!!file?.mimeType && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Type</Text>
                <Text style={styles.metaValue}>{file.mimeType}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionBtn} onPress={openInBrowser} disabled={!fileUri}>
              <Feather name="external-link" size={16} color={colors.textPrimary} />
              <Text style={styles.actionText}>Open full file</Text>
            </TouchableOpacity>

            {canPreviewImage && !!onEditImage && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={onEditImage}>
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.actionPrimaryText}>Edit image</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgDark,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1, marginRight: 12 },
  body: { padding: 16, gap: 12 },
  previewCard: {
    minHeight: 220,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 260, backgroundColor: colors.bgSurface },
  docWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: colors.bgSurface,
  },
  docName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  docSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  metaRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  metaLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    paddingVertical: 12,
  },
  actionText: { color: colors.textPrimary, fontWeight: '700' },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionPrimaryText: { color: '#fff', fontWeight: '800' },
});
