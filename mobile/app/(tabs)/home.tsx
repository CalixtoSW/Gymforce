import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { PointsHistory } from '@/components/features/PointsHistory';
import { StatCard } from '@/components/features/StatCard';
import { StreakRiskAlert } from '@/components/features/StreakRiskAlert';
import { TierBadge } from '@/components/features/TierBadge';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  Assessment,
  BadgeListResponse,
  GamificationSummary,
  PointEvent,
  QRCodeData,
  WorkoutSheet,
} from '@/types';

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: () => api.get<GamificationSummary>('/gamification/summary').then((r) => r.data),
    staleTime: 30_000,
  });

  const historyQuery = useQuery({
    queryKey: ['gamification-history'],
    queryFn: () =>
      api
        .get<PointEvent[]>('/gamification/points/history?limit=5')
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const qrQuery = useQuery({
    queryKey: ['checkin-qr'],
    queryFn: () => api.get<QRCodeData>('/checkins/qr').then((r) => r.data),
    staleTime: 0,
  });

  const sheetsQuery = useQuery({
    queryKey: ['workout-sheets'],
    queryFn: () => api.get<WorkoutSheet[]>('/workouts/sheets').then((r) => r.data),
    staleTime: 30_000,
  });

  const badgesQuery = useQuery({
    queryKey: ['badges-summary'],
    queryFn: () => api.get<BadgeListResponse>('/badges').then((r) => r.data),
    staleTime: 30_000,
  });

  const myChallengesQuery = useQuery({
    queryKey: ['my-challenges-home'],
    queryFn: () => api.get('/challenges/my').then((r) => r.data as unknown[]),
    staleTime: 30_000,
  });

  const assessmentQuery = useQuery({
    queryKey: ['assessment-home'],
    queryFn: () => api.get<Assessment[]>('/assessments/history').then((r) => r.data),
    staleTime: 30_000,
  });

  const summary = summaryQuery.data;
  const qrData = qrQuery.data;
  const sheet = sheetsQuery.data?.[0] ?? null;
  const refetchSummary = summaryQuery.refetch;
  const refetchHistory = historyQuery.refetch;
  const refetchQr = qrQuery.refetch;
  const refetchSheets = sheetsQuery.refetch;
  const refetchBadges = badgesQuery.refetch;
  const refetchChallenges = myChallengesQuery.refetch;
  const refetchAssessments = assessmentQuery.refetch;

  useEffect(() => {
    if (qrData) {
      setSecondsLeft(qrData.expires_in_seconds);
    }
  }, [qrData]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 60) {
      refetchQr();
    }
  }, [refetchQr, secondsLeft]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      refetchSummary();
      refetchHistory();
      refetchQr();
      refetchSheets();
      refetchBadges();
      refetchChallenges();
      refetchAssessments();
    }, [
      refetchAssessments,
      refetchBadges,
      refetchChallenges,
      refetchHistory,
      refetchQr,
      refetchSheets,
      refetchSummary,
      refreshUser,
    ]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gamification-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['gamification-history'] }),
        queryClient.invalidateQueries({ queryKey: ['checkin-qr'] }),
        queryClient.invalidateQueries({ queryKey: ['workout-sheets'] }),
        queryClient.invalidateQueries({ queryKey: ['badges-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['my-challenges-home'] }),
        queryClient.invalidateQueries({ queryKey: ['assessment-home'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refreshUser]);

  const greetingName = useMemo(() => user?.name?.split(' ')[0] ?? 'Aluno', [user?.name]);

  if (
    summaryQuery.isLoading ||
    historyQuery.isLoading ||
    qrQuery.isLoading ||
    sheetsQuery.isLoading ||
    badgesQuery.isLoading ||
    myChallengesQuery.isLoading ||
    assessmentQuery.isLoading
  ) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const currentStreak = summary?.streak.current_streak ?? 0;
  const isStreakAtRisk =
    currentStreak > 0 && summary?.streak.last_activity_date !== today;
  const badgesEarned = badgesQuery.data?.total_earned ?? 0;
  const badgesAvailable = badgesQuery.data?.total_available ?? 0;
  const myChallengesCount = (myChallengesQuery.data ?? []).filter(
    (item: unknown) => !(item as { completed?: boolean }).completed,
  ).length;
  const latestAssessment = assessmentQuery.data?.[0] ?? null;
  const latestWeightValue =
    latestAssessment?.weight_kg !== null && latestAssessment?.weight_kg !== undefined
      ? Number(latestAssessment.weight_kg)
      : null;
  const latestWeightLabel =
    latestWeightValue !== null && Number.isFinite(latestWeightValue)
      ? `${latestWeightValue.toFixed(1)} kg`
      : 'Sem dados';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Ola, {greetingName}! 👋</Text>

      <TierBadge
        tier={summary?.tier ?? user?.tier ?? 'bronze'}
        totalPoints={summary?.total_points ?? 0}
      />

      {isStreakAtRisk && (
        <StreakRiskAlert
          streakCount={currentStreak}
          freezeAvailable={summary?.streak.freeze_available ?? false}
        />
      )}

      <View style={styles.metricsRow}>
        <StatCard
          icon="🔥"
          value={summary?.streak.current_streak ?? user?.streak_count ?? 0}
          label="streak"
          color={COLORS.streak}
        />
        <StatCard
          icon="⭐"
          value={(summary?.current_points ?? user?.current_points ?? 0).toLocaleString(
            'pt-BR',
          )}
          label="pontos"
          color={COLORS.xp}
        />
        <StatCard
          icon="🏆"
          value={summary?.rank ? `#${summary.rank.rank}` : '--'}
          label="rank"
          color={COLORS.reward}
        />
      </View>

      <Pressable onPress={() => router.push('/badges')} style={styles.badgesCard}>
        <View>
          <Text style={styles.badgesTitle}>🏆 Conquistas</Text>
          <Text style={styles.badgesSubtitle}>
            {badgesEarned} desbloqueadas de {badgesAvailable}
          </Text>
        </View>
        <Text style={styles.badgesArrow}>▶</Text>
      </Pressable>

      <View style={styles.quickCardsRow}>
        <Pressable onPress={() => router.push('/challenges')} style={styles.quickCard}>
          <Text style={styles.quickCardTitle}>🎯 Desafios</Text>
          <Text style={styles.quickCardValue}>{myChallengesCount} ativos</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/assessment')} style={styles.quickCard}>
          <Text style={styles.quickCardTitle}>📊 Avaliação</Text>
          <Text style={styles.quickCardValue}>{latestWeightLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.qrBox}>
          {qrData?.qr_token ? (
            <QRCode
              value={qrData.qr_token}
              size={180}
              color={COLORS.background}
              backgroundColor={COLORS.textPrimary}
            />
          ) : (
            <Text style={styles.secondaryText}>QR indisponivel</Text>
          )}
        </View>
        <Text style={styles.secondaryText}>Mostre na recepcao</Text>
        <Text style={styles.expireText}>Expira em: {formatCountdown(secondsLeft)}</Text>
        <Pressable onPress={() => refetchQr()} style={styles.primaryButton}>
          {qrQuery.isFetching ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Atualizar QR</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>🏋️ Treino de Hoje</Text>
        {sheet ? (
          <>
            <Text style={styles.workoutSubtitle}>
              {sheet.name} - {sheet.exercises.length} exercicios
            </Text>
            <Pressable
              onPress={() => router.push(`/workout/${sheet.id}`)}
              style={styles.successButton}
            >
              <Text style={styles.primaryButtonText}>Iniciar Treino</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.workoutSubtitle}>
            Nenhuma ficha ativa. Fale com seu personal.
          </Text>
        )}
      </View>

      <PointsHistory events={historyQuery.data ?? []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badgesArrow: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  badgesCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  badgesSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  badgesTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
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
  expireText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  qrBox: {
    alignItems: 'center',
    backgroundColor: COLORS.textPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  quickCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    padding: SPACING.md,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickCardTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  quickCardValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  successButton: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 44,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  workoutSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
  workoutTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
