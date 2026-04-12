import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import type { Challenge } from '@/types';

type ChallengeCardProps = {
  challenge: Challenge;
  progress?: number;
  goalValue: number;
  completed?: boolean;
  daysRemaining?: number;
  rewardPoints: number;
  onJoin?: () => void;
  isJoining?: boolean;
};

export function ChallengeCard({
  challenge,
  progress,
  goalValue,
  completed = false,
  daysRemaining,
  rewardPoints,
  onJoin,
  isJoining = false,
}: ChallengeCardProps) {
  const currentProgress = progress ?? 0;
  const progressPct = goalValue > 0 ? Math.min((currentProgress / goalValue) * 100, 100) : 0;

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <Text style={styles.title}>
        {completed ? '✅' : challenge.icon} {challenge.title}
      </Text>
      <Text style={styles.description}>{challenge.description ?? 'Sem descrição'}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentProgress}/{goalValue} {completed ? '— Concluído!' : ''}
      </Text>

      {typeof daysRemaining === 'number' ? (
        <Text style={styles.meta}>Termina em: {Math.max(0, daysRemaining)} dias</Text>
      ) : (
        <Text style={styles.meta}>👥 {challenge.total_participants} participantes</Text>
      )}

      <Text style={styles.reward}>🏆 +{rewardPoints} pts</Text>

      {onJoin ? (
        <Pressable onPress={onJoin} style={styles.joinButton} disabled={isJoining}>
          {isJoining ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.joinButtonText}>PARTICIPAR</Text>
          )}
        </Pressable>
      ) : null}
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
    padding: SPACING.md,
  },
  completedCard: {
    borderColor: COLORS.success,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    marginTop: SPACING.xs,
    minHeight: 40,
  },
  joinButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  progressText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    height: 8,
    overflow: 'hidden',
  },
  reward: {
    color: COLORS.reward,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
