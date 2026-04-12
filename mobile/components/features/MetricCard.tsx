import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type MetricCardProps = {
  label: string;
  value: string;
  change: number | null;
  invertColor?: boolean;
};

function getIndicator(change: number | null): string {
  if (change === null) {
    return '─';
  }
  if (change > 0) {
    return `▲${Math.abs(change).toFixed(1)}`;
  }
  if (change < 0) {
    return `▼${Math.abs(change).toFixed(1)}`;
  }
  return '─';
}

function getColor(change: number | null, invertColor?: boolean): string {
  if (change === null || change === 0) {
    return COLORS.textMuted;
  }
  if (invertColor) {
    return change < 0 ? COLORS.success : COLORS.error;
  }
  return change > 0 ? COLORS.success : COLORS.error;
}

export function MetricCard({ label, value, change, invertColor = false }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.change, { color: getColor(change, invertColor) }]}>
          {getIndicator(change)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.sm,
  },
  change: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
