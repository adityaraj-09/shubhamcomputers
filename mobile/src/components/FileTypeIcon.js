import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DEFAULT = { name: 'file-document-outline', color: '#8e8e93' };

const EXT_MAP = {
  pdf: { name: 'file-pdf-box', color: '#E53935' },
  jpg: { name: 'file-image-outline', color: '#525252' },
  jpeg: { name: 'file-image-outline', color: '#525252' },
  png: { name: 'file-image-outline', color: '#525252' },
  webp: { name: 'file-image-outline', color: '#525252' },
  gif: { name: 'file-image-outline', color: '#525252' },
  doc: { name: 'file-word-outline', color: '#404040' },
  docx: { name: 'file-word-outline', color: '#404040' },
  xls: { name: 'file-excel-outline', color: '#217346' },
  xlsx: { name: 'file-excel-outline', color: '#217346' },
  ppt: { name: 'file-powerpoint-outline', color: '#D24726' },
  pptx: { name: 'file-powerpoint-outline', color: '#D24726' },
  txt: { name: 'file-document-outline', color: '#8e8e93' },
};

export default function FileTypeIcon({ fileName, size = 22, style }) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const cfg = EXT_MAP[ext] || DEFAULT;
  return (
    <MaterialCommunityIcons name={cfg.name} size={size} color={cfg.color} style={style} />
  );
}
