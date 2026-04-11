import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import type { UserTier } from '@/types';

type TierBadgeProps = {
  tier: UserTier;
  totalPoints: number;
};

type TierConfig = {
  min: number;
  next: number;
  label: string;
  color: string;
};

const TIER_THRESHOLDS: Record<UserTier, TierConfig> = {
  bronze: { min: 0, next: 1000, label: 'Bronze', color: COLORS.tierBronze },
  prata: { min: 1000, next: 5000, label: 'Prata', color: COLORS.tierSilver },
  ouro: { min: 5000, next: 15000, label: 'Ouro', color: COLORS.tierGold },
  diamante: { min: 15000, next: 50000, label: 'Diamante', color: COLORS.tierDiamond },
  lenda: { min: 50000, next: 99999, label: 'Lenda', color: COLORS.tierLegend },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function TierBadge({ tier, totalPoints }: TierBadgeProps) {
  const config = TIER_THRESHOLDS[tier];
  const denominator = Math.max(1, config.next - config.min);
  const progress = clamp((totalPoints - config.min) / denominator, 0, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.tierText, { color: config.color }]}>🏅 {config.label}</Text>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: config.color, width: `${progressPercent}%` }]} />
      </View>

      <Text style={styles.pointsText}>
        {totalPoints.toLocaleString('pt-BR')} / {config.next.toLocaleString('pt-BR')} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  pointsText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  progressFill: {
    borderRadius: BORDER_RADIUS.full,
    height: 8,
  },
  progressTrack: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    height: 8,
    overflow: 'hidden',
  },
  tierText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
