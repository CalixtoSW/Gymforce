import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import type { WorkoutSheet } from '@/types';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(true);

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

      {sheets.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.secondary}>Nenhuma ficha ativa no momento.</Text>
        </View>
      ) : (
        sheets.map((sheet) => (
          <Pressable
            key={sheet.id}
            onPress={() => router.push(`/workout/${sheet.id}`)}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>💪 {sheet.name}</Text>
            <Text style={styles.secondary}>{sheet.exercises.length} exercicios</Text>
            <Text style={styles.secondary}>Toque para abrir</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
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
  secondary: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
