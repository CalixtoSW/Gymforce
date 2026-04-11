import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AxiosError } from 'axios';

import { RedeemConfirmModal } from '@/components/features/RedeemConfirmModal';
import { RewardCard } from '@/components/features/RewardCard';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Redemption, Reward } from '@/types';

export default function RewardsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const rewardsQuery = useQuery({
    queryKey: ['rewards'],
    queryFn: () => api.get<Reward[]>('/rewards').then((r) => r.data),
    staleTime: 30_000,
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) =>
      api.post<Redemption>(`/rewards/${rewardId}/redeem`).then((r) => r.data),
    onSuccess: async () => {
      setSuccessMessage('Resgate realizado! Retire na recepcao.');
      setErrorMessage(null);
      setConfirmVisible(false);
      setSelectedReward(null);
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      setErrorMessage(detail ?? 'Nao foi possivel concluir o resgate.');
    },
  });

  const rewards = rewardsQuery.data ?? [];
  const userPoints = user?.current_points ?? 0;

  const currentMonth = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
        new Date(),
      ),
    [],
  );

  const onOpenConfirm = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId) ?? null;
    setSelectedReward(reward);
    setSuccessMessage(null);
    setErrorMessage(null);
    setConfirmVisible(true);
  };

  const onConfirmRedeem = async () => {
    if (!selectedReward) {
      return;
    }
    await redeemMutation.mutateAsync(selectedReward.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        rewardsQuery.refetch(),
        refreshUser(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (rewardsQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>🎁 Premios</Text>
        <Text style={styles.subtitle}>{currentMonth}</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Seu saldo</Text>
          <Text style={styles.balanceValue}>⭐ {userPoints.toLocaleString('pt-BR')} pts</Text>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        {rewards.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma recompensa disponivel no momento.</Text>
          </View>
        ) : (
          rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              isRedeeming={
                redeemMutation.isPending && redeemMutation.variables === reward.id
              }
              onRedeem={onOpenConfirm}
              reward={reward}
              userPoints={userPoints}
            />
          ))
        )}

        <View style={styles.redemptionsLinkCard}>
          <Pressable onPress={() => router.push('/redemptions')}>
            <Text style={styles.redemptionsLinkText}>📋 Meus Resgates ▶</Text>
          </Pressable>
        </View>
      </ScrollView>

      <RedeemConfirmModal
        isSubmitting={redeemMutation.isPending}
        onCancel={() => {
          if (!redeemMutation.isPending) {
            setConfirmVisible(false);
          }
        }}
        onConfirm={onConfirmRedeem}
        reward={selectedReward}
        userPoints={userPoints}
        visible={confirmVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.xp,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  balanceValue: {
    color: COLORS.xp,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  redemptionsLinkCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  redemptionsLinkText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textTransform: 'capitalize',
  },
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
