import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type SessionProgressBarProps = {
  completionPct: number;
  completed: number;
  planned: number;
};

export function SessionProgressBar({
  completionPct,
  completed,
  planned,
}: SessionProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.floor(completionPct)));

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.caption}>
        {completed} de {planned} series ({pct}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  fill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  track: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  wrapper: {
    width: '100%',
  },
});
