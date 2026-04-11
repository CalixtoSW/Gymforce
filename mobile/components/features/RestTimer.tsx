import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
} from '@/constants/theme';

type RestTimerProps = {
  visible: boolean;
  restSeconds: number;
  exerciseName?: string;
  onClose: () => void;
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
  restSeconds,
  exerciseName,
  onClose,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(restSeconds);

  useEffect(() => {
    if (visible) {
      setRemaining(restSeconds);
    }
  }, [restSeconds, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (remaining <= 0) {
      onClose();
      return;
    }

    const id = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [onClose, remaining, visible]);

  const progress = useMemo(() => {
    if (!restSeconds || restSeconds <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, 1 - remaining / restSeconds));
  }, [remaining, restSeconds]);

  const progressWidth = `${Math.round(progress * 100)}%` as `${number}%`;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Descanso</Text>
          <Text style={styles.time}>{formatTime(remaining)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <Text style={styles.context}>{exerciseName ?? 'Exercicio'}</Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setRemaining((prev) => prev + 15)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>+15s</Text>
            </Pressable>
            <Pressable
              onPress={() => setRemaining((prev) => Math.max(0, prev - 15))}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>-15s</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.skipButton}>
            <Text style={styles.skipText}>Pular Descanso</Text>
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
    marginTop: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    width: '85%',
  },
  context: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#00000088',
    flex: 1,
    justifyContent: 'center',
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    height: 8,
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
    minHeight: 40,
    justifyContent: 'center',
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
