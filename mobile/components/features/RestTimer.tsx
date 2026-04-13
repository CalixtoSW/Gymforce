import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type NextInfo = {
  exerciseName: string;
  setLabel: string;
  weightLabel: string;
};

type RestTimerProps = {
  visible: boolean;
  timerSeconds: number;
  onAdd15: () => void;
  onMinus15: () => void;
  onSkip: () => void;
  nextInfo?: NextInfo | null;
};

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(1, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function RestTimer({
  visible,
  timerSeconds,
  onAdd15,
  onMinus15,
  onSkip,
  nextInfo,
}: RestTimerProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>DESCANSO</Text>
          <Text style={styles.time}>{formatTime(timerSeconds)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, timerSeconds * 3))}%` }]} />
          </View>

          {nextInfo ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Proximo: {nextInfo.exerciseName}</Text>
              <Text style={styles.previewSubtitle}>
                {nextInfo.setLabel} - {nextInfo.weightLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={onAdd15} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>+15s</Text>
            </Pressable>
            <Pressable onPress={onMinus15} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>-15s</Text>
            </Pressable>
          </View>

          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>PULAR DESCANSO</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    width: '88%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#00000088',
    flex: 1,
    justifyContent: 'center',
  },
  previewCard: {
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  previewSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    height: 8,
    marginTop: SPACING.md,
    overflow: 'hidden',
    width: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    minHeight: 42,
    justifyContent: 'center',
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  time: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.hero,
    fontWeight: '800',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
});
