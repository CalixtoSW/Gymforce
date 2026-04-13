import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return '0 min';
  }
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

function buildWeights(values: number[]): string {
  if (!values.length) {
    return 'sem cargas registradas';
  }
  return values.map((item) => `${item.toFixed(1)}kg`).join(' -> ');
}

export default function SessionSummaryScreen() {
  const router = useRouter();
  const { session, reset } = useSessionStore();

  if (!session) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.subtitle}>Nenhuma sessao finalizada para resumir.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/workouts')} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const title = session.status === 'completed' ? '🎉 Treino Concluido!' : '⚠️ Treino Parcial';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryName}>{session.sheet_name}</Text>
        <Text style={styles.summaryLine}>⏱ Duracao: {formatDuration(session.active_duration_seconds)}</Text>
        <Text style={styles.summaryLine}>
          📊 Series: {session.total_sets_completed}/{session.total_sets_planned} ({session.completion_pct}%)
        </Text>
        <Text style={styles.summaryLine}>⭐ Pontos: +{session.points_earned}</Text>
      </View>

      <Text style={styles.sectionTitle}>Exercicios</Text>
      {session.exercises_progress.map((exercise) => {
        const weights = exercise.set_logs
          .map((log) => log.actual_weight_kg)
          .filter((w): w is number => w !== null);
        const isComplete = exercise.sets_completed >= exercise.planned_sets;
        const isPartial = exercise.sets_completed > 0 && !isComplete;
        const statusIcon = isComplete ? '✅' : isPartial ? '⚠️' : '⏭️';

        return (
          <View key={exercise.exercise_id} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>
              {statusIcon} {exercise.exercise_name} {exercise.sets_completed}/{exercise.planned_sets}
            </Text>
            <Text style={styles.exerciseWeights}>{buildWeights(weights)}</Text>
          </View>
        );
      })}

      <Pressable
        onPress={() => {
          reset();
          router.replace('/(tabs)/home');
        }}
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryText}>Voltar para Home</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    gap: SPACING.md,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  exerciseTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  exerciseWeights: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minHeight: 44,
    marginTop: SPACING.sm,
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  summaryLine: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  summaryName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
});
