import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { ExerciseNavigator } from '@/components/features/ExerciseNavigator';
import { FinishSessionModal } from '@/components/features/FinishSessionModal';
import { RestTimer } from '@/components/features/RestTimer';
import { SessionProgressBar } from '@/components/features/SessionProgressBar';
import { SetInput } from '@/components/features/SetInput';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';
import type { ExerciseProgress, PartialReason } from '@/types';

function parseDefaultReps(value: string): number {
  const direct = Number(value);
  if (Number.isFinite(direct) && direct >= 0) {
    return Math.round(direct);
  }

  const matched = value.match(/\d+/);
  if (matched) {
    return Number(matched[0]);
  }
  return 10;
}

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

function describeNextSet(exercise: ExerciseProgress | null): {
  exerciseName: string;
  setLabel: string;
  weightLabel: string;
} | null {
  if (!exercise) {
    return null;
  }
  const nextSet = Math.min(exercise.planned_sets, exercise.sets_completed + 1);
  const weight = exercise.suggested_weight_kg;
  return {
    exerciseName: exercise.exercise_name,
    setLabel: `Serie ${nextSet} de ${exercise.planned_sets}`,
    weightLabel: weight !== null ? `${weight.toFixed(1)}kg` : 'sem carga sugerida',
  };
}

export default function ActiveSessionScreen() {
  useKeepAwake();
  const router = useRouter();

  const {
    session,
    isLoading,
    currentExerciseIndex,
    isTimerActive,
    timerSeconds,
    loadActiveSession,
    pauseSession,
    resumeSession,
    logSet,
    finishSession,
    refreshSession,
    setCurrentExercise,
    startTimer,
    tickTimer,
    stopTimer,
  } = useSessionStore();

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);
  const [finishVisible, setFinishVisible] = useState(false);
  const [elapsedNow, setElapsedNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      loadActiveSession().catch(() => null);
    }, [loadActiveSession]),
  );

  useEffect(() => {
    if (!session && !isLoading) {
      router.replace('/(tabs)/workouts');
    }
  }, [isLoading, router, session]);

  useEffect(() => {
    if (!isTimerActive) {
      return;
    }

    const id = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(id);
  }, [isTimerActive, tickTimer]);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isTimerActive || timerSeconds !== 0) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
  }, [isTimerActive, timerSeconds]);

  const exercises = session?.exercises_progress ?? [];
  const currentExercise = exercises[currentExerciseIndex] ?? null;
  const nextExercise = exercises[currentExerciseIndex + 1] ?? null;

  useEffect(() => {
    if (!currentExercise) {
      return;
    }

    const lastSet = currentExercise.set_logs[currentExercise.set_logs.length - 1];
    setWeight(
      lastSet?.actual_weight_kg ??
        currentExercise.suggested_weight_kg ??
        0,
    );
    setReps(lastSet?.actual_reps ?? parseDefaultReps(currentExercise.planned_reps));
  }, [currentExercise?.exercise_id, currentExercise]);

  const elapsedSeconds = useMemo(() => {
    if (!session) {
      return 0;
    }

    const started = new Date(session.started_at).getTime();
    const now = elapsedNow;
    const raw = Math.floor((now - started) / 1000) - (session.total_pause_seconds ?? 0);
    return Math.max(0, raw);
  }, [elapsedNow, session]);

  const currentSetNumber = currentExercise
    ? Math.min(currentExercise.planned_sets, currentExercise.sets_completed + 1)
    : 1;

  const handleLog = async (status: 'completed' | 'skipped' | 'failed') => {
    if (!session || !currentExercise) {
      return;
    }

    await logSet({
      exercise_id: currentExercise.exercise_id,
      set_number: currentSetNumber,
      actual_reps: status === 'skipped' ? undefined : reps,
      actual_weight_kg: status === 'skipped' ? undefined : weight,
      status,
    });

    if (status === 'completed') {
      startTimer(currentExercise.rest_seconds);
    } else {
      stopTimer();
    }

    await refreshSession();
  };

  const isPaused = session?.status === 'paused';

  if (isLoading || !session || !currentExercise) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.headerRow}>
        <Pressable onPress={pauseSession} style={styles.iconButton}>
          <Text style={styles.iconText}>⏸️</Text>
        </Pressable>
        <Text style={styles.elapsedText}>⏱ {formatElapsed(elapsedSeconds)}</Text>
      </View>

      <SessionProgressBar
        completed={session.total_sets_completed}
        completionPct={session.completion_pct}
        planned={session.total_sets_planned}
      />

      {isTimerActive ? (
        <RestTimer
          nextInfo={describeNextSet(nextExercise ?? currentExercise)}
          onAdd15={() => startTimer(timerSeconds + 15)}
          onMinus15={() => startTimer(Math.max(0, timerSeconds - 15))}
          onSkip={stopTimer}
          timerSeconds={timerSeconds}
          visible
        />
      ) : null}

      <View style={styles.exerciseSection}>
        <Text style={styles.exerciseName}>{currentExercise.exercise_name}</Text>
        <Text style={styles.exerciseSubtitle}>
          Serie {currentSetNumber} de {currentExercise.planned_sets}
        </Text>

        <SetInput
          onRepsChange={setReps}
          onWeightChange={setWeight}
          reps={reps}
          weight={weight}
        />

        <Pressable onPress={() => handleLog('completed')} style={styles.completeSetButton}>
          <Text style={styles.completeSetText}>✓ CONCLUIR SERIE</Text>
        </Pressable>

        <View style={styles.secondaryActions}>
          <Pressable onPress={() => handleLog('skipped')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Pular serie</Text>
          </Pressable>
          <Pressable onPress={() => handleLog('failed')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Falhou</Text>
          </Pressable>
        </View>

        <ExerciseNavigator
          currentIndex={currentExerciseIndex}
          onNext={() => setCurrentExercise(Math.min(currentExerciseIndex + 1, exercises.length - 1))}
          onPrev={() => setCurrentExercise(Math.max(currentExerciseIndex - 1, 0))}
          total={exercises.length}
        />

        <Pressable onPress={() => setFinishVisible(true)} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>Encerrar Treino</Text>
        </Pressable>
      </View>

      {isPaused ? (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>⏸️ PAUSADO</Text>
          <Text style={styles.pauseSubtitle}>
            Tempo pausado: {formatElapsed(session.total_pause_seconds)}
          </Text>
          <Pressable onPress={resumeSession} style={styles.resumeBtn}>
            <Text style={styles.resumeText}>▶ RETOMAR TREINO</Text>
          </Pressable>
          <Pressable onPress={() => setFinishVisible(true)} style={styles.pauseFinishBtn}>
            <Text style={styles.pauseFinishText}>Encerrar Treino</Text>
          </Pressable>
        </View>
      ) : null}

      <FinishSessionModal
        completionPct={session.completion_pct}
        onClose={() => setFinishVisible(false)}
        onConfirmComplete={async () => {
          await finishSession('complete');
          setFinishVisible(false);
          router.replace('/session/summary');
        }}
        onConfirmPartial={async (reason: PartialReason, notes?: string) => {
          await finishSession('partial', reason, notes);
          setFinishVisible(false);
          router.replace('/session/summary');
        }}
        totalSetsCompleted={session.total_sets_completed}
        totalSetsPlanned={session.total_sets_planned}
        visible={finishVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  completeSetButton: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minHeight: 80,
  },
  completeSetText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  elapsedText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  exerciseName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  exerciseSection: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  exerciseSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  finishBtn: {
    alignItems: 'center',
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  finishBtnText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconText: {
    fontSize: FONT_SIZE.md,
  },
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  pauseFinishBtn: {
    alignItems: 'center',
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 44,
    width: '80%',
  },
  pauseFinishText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  pauseOverlay: {
    alignItems: 'center',
    backgroundColor: '#000000CC',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pauseSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
  pauseTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  resumeBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: SPACING.lg,
    minHeight: 48,
    width: '80%',
  },
  resumeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
