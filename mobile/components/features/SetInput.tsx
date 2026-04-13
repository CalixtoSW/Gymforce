import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type SetInputProps = {
  weight: number;
  reps: number;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
};

function formatWeight(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export function SetInput({
  weight,
  reps,
  onWeightChange,
  onRepsChange,
}: SetInputProps) {
  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <Text style={styles.label}>Carga (kg)</Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => onWeightChange(Math.max(0, weight - 2.5))}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text style={styles.value}>{formatWeight(weight)}</Text>
          <Pressable
            onPress={() => onWeightChange(weight + 2.5)}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.column}>
        <Text style={styles.label}>Reps</Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => onRepsChange(Math.max(0, reps - 1))}
            style={styles.stepperBtn}
          >
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text style={styles.value}>{reps}</Text>
          <Pressable onPress={() => onRepsChange(reps + 1)} style={styles.stepperBtn}>
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  column: {
    flex: 1,
    gap: SPACING.sm,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  stepperBtn: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
