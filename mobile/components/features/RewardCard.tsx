import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import type { Reward } from '@/types';

type RewardCardProps = {
  reward: Reward;
  userPoints: number;
  onRedeem: (rewardId: string) => void;
  isRedeeming: boolean;
};

function buttonState(reward: Reward, userPoints: number) {
  if (reward.stock === 0) {
    return {
      disabled: true,
      label: 'ESGOTADO',
      bg: COLORS.error,
    };
  }

  if (userPoints < reward.cost_points) {
    return {
      disabled: true,
      label: 'PONTOS INSUFICIENTES',
      bg: COLORS.textMuted,
    };
  }

  return {
    disabled: false,
    label: 'RESGATAR',
    bg: COLORS.primary,
  };
}

export function RewardCard({ reward, userPoints, onRedeem, isRedeeming }: RewardCardProps) {
  const state = buttonState(reward, userPoints);

  return (
    <View style={styles.card}>
      {reward.image_url ? (
        <Image source={{ uri: reward.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>🎁</Text>
        </View>
      )}

      <Text style={styles.name}>{reward.name}</Text>
      {reward.description ? <Text style={styles.description}>{reward.description}</Text> : null}

      <Text style={styles.cost}>⭐ {reward.cost_points.toLocaleString('pt-BR')} pts</Text>
      <Text style={styles.stock}>
        📦 {reward.stock === null ? 'Ilimitado' : `${reward.stock} disponiveis`}
      </Text>

      <Pressable
        disabled={state.disabled || isRedeeming}
        onPress={() => onRedeem(reward.id)}
        style={[styles.button, { backgroundColor: state.bg }]}
      >
        {isRedeeming ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>{state.label}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 44,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  cost: {
    color: COLORS.xp,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  image: {
    borderRadius: BORDER_RADIUS.md,
    height: 140,
    marginBottom: SPACING.sm,
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    height: 140,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    width: '100%',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  placeholderIcon: {
    fontSize: 44,
  },
  stock: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
});
