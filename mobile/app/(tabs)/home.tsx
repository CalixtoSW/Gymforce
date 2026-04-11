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
import { TierBadge } from '@/components/features/TierBadge';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { GamificationSummary, PointEvent, QRCodeData, WorkoutSheet } from '@/types';

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

  const summary = summaryQuery.data;
  const qrData = qrQuery.data;
  const sheet = sheetsQuery.data?.[0] ?? null;
  const refetchSummary = summaryQuery.refetch;
  const refetchHistory = historyQuery.refetch;
  const refetchQr = qrQuery.refetch;
  const refetchSheets = sheetsQuery.refetch;

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
    }, [refetchHistory, refetchQr, refetchSheets, refetchSummary, refreshUser]),
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
    sheetsQuery.isLoading
  ) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Ola, {greetingName}! 👋</Text>

      <TierBadge tier={summary?.tier ?? user?.tier ?? 'bronze'} totalPoints={summary?.total_points ?? 0} />

      <View style={styles.metricsRow}>
        <StatCard
          icon="🔥"
          value={summary?.streak.current_streak ?? user?.streak_count ?? 0}
          label="streak"
          color={COLORS.streak}
        />
        <StatCard
          icon="⭐"
          value={(summary?.current_points ?? user?.current_points ?? 0).toLocaleString('pt-BR')}
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
