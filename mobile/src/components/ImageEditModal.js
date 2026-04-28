import React, { useEffect, useRef, useState } from 'react';
import { ImageEditor } from 'expo-dynamic-image-crop';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { colors, radius } from '../theme/colors';

export default function ImageEditModal({ visible, asset, onCancel, onDone }) {
  const insets = useSafeAreaInsets();
  const [workingImage, setWorkingImage] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [bw, setBw] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const [showBrightness, setShowBrightness] = useState(false);
  const [rotating, setRotating] = useState(false);

  const sliderWidth = useRef(200);
  // normalized 0-1 position for brightness (1.0 brightness = ~0.412)
  const sliderPos = useSharedValue((1.0 - 0.3) / 1.7);

  useEffect(() => {
    if (visible && asset?.uri) {
      setWorkingImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setCropMode(false);
      setBw(false);
      setBrightness(1.0);
      setShowBrightness(false);
      sliderPos.value = (1.0 - 0.3) / 1.7;
    }
  }, [visible, asset?.uri, asset?.width, asset?.height, sliderPos]);

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

  const rotateImage = async (deg) => {
    if (!workingImage?.uri || rotating) return;
    if (!String(workingImage.uri).startsWith('file:')) {
      Toast.show({ type: 'error', text1: 'This image can only be edited before upload' });
      return;
    }
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

  const handleDone = () => {
    if (!workingImage?.uri) {
      onCancel?.();
      return;
    }
    onDone?.({
      ...asset,
      uri: workingImage.uri,
      width: workingImage.width,
      height: workingImage.height,
      mimeType: 'image/jpeg',
      isBlackWhite: bw,
      brightness,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.root}>
        {workingImage?.uri ? (
          <ImageEditor
            isVisible={cropMode}
            imageUri={workingImage.uri}
            onEditingComplete={(data) => {
              if (!data?.uri) {
                setCropMode(false);
                return;
              }
              setWorkingImage((prev) => ({
                ...(prev || {}),
                uri: data.uri,
                width: data.width,
                height: data.height,
              }));
              setCropMode(false);
            }}
            onEditingCancel={() => setCropMode(false)}
            dynamicCrop={true}
          />
        ) : null}

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={onCancel} hitSlop={12}>
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit image</Text>
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnPrimary]}
            onPress={handleDone}
            hitSlop={12}
            disabled={!workingImage?.uri}
          >
            <Text style={[styles.headerBtnText, styles.headerBtnPrimaryText]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.previewCard}>
            <View style={styles.toolStrip}>
              <TouchableOpacity
                style={[styles.toolBtn, cropMode && styles.toolBtnActive]}
                onPress={() => {
                  if (!workingImage?.uri) return;
                  if (!String(workingImage.uri).startsWith('file:')) {
                    Toast.show({ type: 'error', text1: 'This image can only be edited before upload' });
                    return;
                  }
                  setCropMode(true);
                }}
              >
                <Feather name="crop" size={20} color={cropMode ? '#fff' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => rotateImage(-90)} disabled={rotating}>
                <Feather name="rotate-ccw" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => rotateImage(90)} disabled={rotating}>
                <Feather name="rotate-cw" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolBtn, bw && styles.toolBtnActive]}
                onPress={() => setBw((v) => !v)}
              >
                <MaterialCommunityIcons
                  name="circle-half-full"
                  size={20}
                  color={bw ? '#fff' : colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolBtn, showBrightness && styles.toolBtnActive]}
                onPress={() => setShowBrightness((v) => !v)}
              >
                <Feather name="sun" size={20} color={showBrightness ? '#fff' : colors.primary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.previewImgWrap,
                { filter: `grayscale(${bw ? 1 : 0}) brightness(${brightness})` },
              ]}
            >
              <Image
                source={{ uri: workingImage?.uri || null }}
                style={styles.previewImg}
                resizeMode="contain"
              />
              {rotating && (
                <View style={styles.overlaySpinner}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>
          </View>

          {showBrightness && (
            <View style={styles.brightnessPanel}>
              <Feather name="moon" size={14} color={colors.textMuted} />
              <GestureDetector gesture={panGesture}>
                <View
                  style={styles.sliderTrack}
                  onLayout={(e) => {
                    sliderWidth.current = e.nativeEvent.layout.width;
                  }}
                >
                  <Animated.View style={[styles.sliderFill, fillAnimStyle]} />
                  <Animated.View style={[styles.sliderThumb, thumbAnimStyle]} />
                </View>
              </GestureDetector>
              <Feather name="sun" size={18} color={colors.textMuted} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    minWidth: 78,
    alignItems: 'center',
  },
  headerBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  headerBtnText: { color: colors.textSecondary, fontWeight: '800' },
  headerBtnPrimaryText: { color: '#fff' },

  body: { flex: 1, padding: 16 },

  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toolStrip: {
    width: 56,
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  previewImgWrap: {
    flex: 1,
    height: 360,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImg: { width: '100%', height: '100%' },
  overlaySpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brightnessPanel: {
    marginTop: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.bgSurface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.primary,
    marginLeft: -11,
  },
});
