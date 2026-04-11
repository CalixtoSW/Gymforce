import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
} from '@/constants/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { QRCodeData, WorkoutSheet } from '@/types';

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sheet, setSheet] = useState<WorkoutSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);

  const loadQr = useCallback(async () => {
    setQrLoading(true);
    try {
      const { data } = await api.get<QRCodeData>('/checkins/qr');
      setQrData(data);
      setSecondsLeft(data.expires_in_seconds);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      await loadQr();
      const { data } = await api.get<WorkoutSheet[]>('/workouts/sheets');
      setSheet(data[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, [loadQr]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!qrData) {
      return;
    }
    const refreshId = setTimeout(() => {
      loadQr();
    }, 4 * 60 * 1000);

    return () => clearTimeout(refreshId);
  }, [qrData, loadQr]);

  useEffect(() => {
    if (secondsLeft === 60) {
      loadQr();
    }
  }, [secondsLeft, loadQr]);

  const greetingName = useMemo(() => {
    return user?.name?.split(' ')[0] ?? 'Aluno';
  }, [user?.name]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Ola, {greetingName}! 👋</Text>

      <View style={styles.qrCard}>
        <View style={styles.qrBox}>
          {qrData?.qr_token ? (
            <QRCode
              value={qrData.qr_token}
              size={190}
              color={COLORS.background}
              backgroundColor={COLORS.textPrimary}
            />
          ) : (
            <Text style={styles.secondaryText}>QR indisponivel</Text>
          )}
        </View>
        <Text style={styles.secondaryText}>Mostre na recepcao</Text>
        <Text style={styles.expireText}>Expira em: {formatCountdown(secondsLeft)}</Text>
        <Pressable onPress={loadQr} style={styles.primaryButton}>
          {qrLoading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Atualizar QR</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>🔥 {user?.streak_count ?? 0}</Text>
          <Text style={styles.metricLabel}>streak</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>⭐ {user?.current_points ?? 0}</Text>
          <Text style={styles.metricLabel}>pontos</Text>
        </View>
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
  metricCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
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
    minHeight: 44,
    justifyContent: 'center',
    marginTop: SPACING.sm,
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
