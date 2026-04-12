import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type StreakRiskAlertProps = {
  streakCount: number;
  freezeAvailable: boolean;
};

export function StreakRiskAlert({ streakCount, freezeAvailable }: StreakRiskAlertProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ Seu streak de {streakCount} dias esta em risco!</Text>
      <Text style={styles.text}>Faca check-in hoje para nao perder seu progresso.</Text>
      <Text style={styles.freeze}>Freeze disponivel: {freezeAvailable ? '✅' : '❌'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  freeze: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  title: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
