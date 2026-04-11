import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RestTimer } from '@/components/features/RestTimer';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
} from '@/constants/theme';
import { api } from '@/services/api';
import type { Exercise, WorkoutSheet } from '@/types';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sheet, setSheet] = useState<WorkoutSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  const loadSheet = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get<WorkoutSheet>(`/workouts/sheets/${id}`);
      setSheet(data);
      startedAtRef.current = Date.now();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const openTimer = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setTimerVisible(true);
  };

  const closeTimer = () => {
    setTimerVisible(false);
  };

  const concludeWorkout = async () => {
    if (!sheet) {
      return;
    }

    setSubmitting(true);
    try {
      const durationMinutes = Math.max(
        1,
        Math.floor((Date.now() - startedAtRef.current) / 60000),
      );

      await api.post('/workouts/complete', {
        sheet_id: sheet.id,
        duration_minutes: durationMinutes,
      });

      setSuccessMessage('Treino concluido! +25 pontos');
      setTimeout(() => {
        router.replace('/(tabs)/workouts');
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!sheet) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.secondaryText}>Ficha nao encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{sheet.name}</Text>

        {sheet.exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>
              {index + 1}. {exercise.name}
            </Text>
            <Text style={styles.secondaryText}>
              {exercise.sets}x{exercise.reps} - Descanso: {exercise.rest_seconds}s
            </Text>
            <Pressable
              onPress={() => openTimer(exercise)}
              style={styles.timerButton}
            >
              <Text style={styles.timerButtonText}>▶ Timer</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <Pressable
        disabled={submitting}
        onPress={concludeWorkout}
        style={styles.completeButton}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.completeButtonText}>Concluir Treino</Text>
        )}
      </Pressable>

      <RestTimer
        visible={timerVisible}
        restSeconds={activeExercise?.rest_seconds ?? 60}
        exerciseName={activeExercise?.name}
        onClose={closeTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    margin: SPACING.lg,
    minHeight: 48,
  },
  completeButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
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
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginHorizontal: SPACING.lg,
  },
  timerButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  timerButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
