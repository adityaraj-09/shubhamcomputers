import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPrice } from '../utils/constants';
import { href } from '../utils/routes';
import { colors, radius, shadows, typography } from '../theme/colors';

export default function ServiceGrid({ services }) {
  const router = useRouter();
  if (!services?.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.titleIconWrap}>
          <MaterialCommunityIcons name="printer-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Print Services</Text>
          <Text style={styles.sub}>Documents printed and delivered within 30 minutes</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {services.map((service) => (
          <TouchableOpacity
            key={service._id}
            style={styles.card}
            onPress={() => router.push(href.printService(service._id))}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconBg}>
              <MaterialCommunityIcons name="file-document-outline" size={26} color={colors.primaryLight} />
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {service.name}
            </Text>
            <View style={styles.priceRow}>
              <Feather name="tag" size={12} color={colors.accent} />
              <Text style={styles.price}>From {formatPrice(service.basePrice)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  titleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.card,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '700',
  },
});
