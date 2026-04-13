import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import { api } from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';
import type { WorkoutSheet } from '@/types';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSheetId, setStartingSheetId] = useState<string | null>(null);
  const { session, loadActiveSession, startSession } = useSessionStore();

  const loadSheets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<WorkoutSheet[]>('/workouts/sheets');
      setSheets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveSession().catch(() => null);
    }, [loadActiveSession]),
  );

  const handleStart = async (sheetId: string) => {
    setStartingSheetId(sheetId);
    try {
      await startSession(sheetId);
      router.push('/session/active');
    } catch {
      router.push(`/workout/${sheetId}`);
    } finally {
      setStartingSheetId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meus Treinos</Text>

      {session && (session.status === 'active' || session.status === 'paused') ? (
        <View style={styles.activeSessionCard}>
          <Text style={styles.activeSessionTitle}>🏋️ TREINO EM ANDAMENTO</Text>
          <Text style={styles.secondary}>
            {session.sheet_name} - {session.completion_pct}% concluido
          </Text>
          <Pressable onPress={() => router.push('/session/active')} style={styles.resumeButton}>
            <Text style={styles.resumeButtonText}>Continuar</Text>
          </Pressable>
        </View>
      ) : null}

      {sheets.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.secondary}>Nenhuma ficha ativa no momento.</Text>
        </View>
      ) : (
        sheets.map((sheet) => (
          <View key={sheet.id} style={styles.card}>
            <Text style={styles.cardTitle}>💪 {sheet.name}</Text>
            <Text style={styles.secondary}>{sheet.exercises.length} exercicios</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => handleStart(sheet.id)}
                style={[styles.startButton, startingSheetId === sheet.id && styles.disabled]}
              >
                {startingSheetId === sheet.id ? (
                  <ActivityIndicator color={COLORS.textPrimary} />
                ) : (
                  <Text style={styles.startButtonText}>Iniciar Treino</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push(`/workout/${sheet.id}`)}
                style={styles.openFallbackButton}
              >
                <Text style={styles.openFallbackButtonText}>Abrir fallback</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activeSessionCard: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  activeSessionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  cardTitle: {
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
  },
  disabled: {
    opacity: 0.6,
  },
  openFallbackButton: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  openFallbackButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  resumeButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minHeight: 42,
  },
  resumeButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  secondary: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  startButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
