import React, { useEffect, useState } from 'react';
import { ImageEditor } from 'expo-dynamic-image-crop';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { colors, radius } from '../theme/colors';

export default function ImageEditModal({ visible, asset, onCancel, onDone }) {
  const [workingImage, setWorkingImage] = useState(null);
  const [bw, setBw] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    if (visible && asset?.uri) {
      setWorkingImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setBw(false);
    }
  }, [visible, asset?.uri, asset?.width, asset?.height]);

  const rotateImage = async (deg) => {
    if (!workingImage?.uri || rotating) return;
    setRotating(true);
    try {
      const rotated = await manipulateAsync(
        workingImage.uri,
        [{ rotate: deg }],
        { compress: 0.95, format: SaveFormat.JPEG }
      );
      setWorkingImage({
        uri: rotated.uri,
        width: rotated.width,
        height: rotated.height,
      });
    } finally {
      setRotating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.root}>
        <ImageEditor
          useModal={false}
          imageUri={workingImage?.uri || null}
          dynamicCrop
          onEditingCancel={onCancel}
          customControlBar={(actions) => (
            <View style={styles.toolbar}>
              <View style={styles.leftTools}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => rotateImage(-90)} disabled={rotating}>
                  <Feather name="rotate-ccw" size={16} color={colors.textPrimary} />
                  <Text style={styles.toolText}>Left</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => rotateImage(90)} disabled={rotating}>
                  <Feather name="rotate-cw" size={16} color={colors.textPrimary} />
                  <Text style={styles.toolText}>Right</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toolBtn, bw && styles.toolBtnOn]}
                  onPress={() => setBw((v) => !v)}
                >
                  <Feather name="droplet" size={16} color={colors.textPrimary} />
                  <Text style={styles.toolText}>B/W</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.rightActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={actions.isEdit ? actions.onBack : actions.onCancel}
                >
                  <Text style={styles.actionText}>{actions.isEdit ? 'Back' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionPrimary]}
                  onPress={actions.isEdit ? actions.onSave : actions.onCrop}
                >
                  <Text style={styles.actionPrimaryText}>{actions.isEdit ? 'Save' : 'Crop'}</Text>
                </TouchableOpacity>
              </View>
              {rotating && <ActivityIndicator style={styles.spinner} color={colors.primary} />}
            </View>
          )}
          onEditingComplete={(edited) => {
            if (!edited?.uri) {
              onCancel?.();
              return;
            }
            onDone?.({
              ...asset,
              uri: edited.uri,
              width: edited.width,
              height: edited.height,
              mimeType: 'image/jpeg',
              isBlackWhite: bw,
            });
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  toolbar: {
    paddingTop: 40,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  leftTools: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  toolBtnOn: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  toolText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  rightActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { color: colors.textSecondary, fontWeight: '700' },
  actionPrimaryText: { color: '#fff', fontWeight: '800' },
  spinner: { position: 'absolute', right: 12, top: 46 },
});
