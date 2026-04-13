import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type ExerciseNavigatorProps = {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

export function ExerciseNavigator({
  currentIndex,
  total,
  onPrev,
  onNext,
}: ExerciseNavigatorProps) {
  return (
    <View style={styles.container}>
      <Pressable
        disabled={currentIndex <= 0}
        onPress={onPrev}
        style={[styles.button, currentIndex <= 0 && styles.disabled]}
      >
        <Text style={styles.text}>◀ Anterior</Text>
      </Pressable>

      <Text style={styles.centerLabel}>
        {Math.min(currentIndex + 1, total)}/{total}
      </Text>

      <Pressable
        disabled={currentIndex >= total - 1}
        onPress={onNext}
        style={[styles.button, currentIndex >= total - 1 && styles.disabled]}
      >
        <Text style={styles.text}>Proximo ▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  centerLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
