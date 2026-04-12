import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type Point = {
  date: string;
  value: number;
};

type EvolutionChartProps = {
  data: Point[];
  label: string;
  color: string;
};

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('pt-BR').slice(0, 5);
}

export function EvolutionChart({ data, label, color }: EvolutionChartProps) {
  if (!data.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Sem dados suficientes para o gráfico.</Text>
      </View>
    );
  }

  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{label}</Text>
      <View style={styles.chartBody}>
        {data.map((item) => {
          const normalized = ((item.value - min) / range) * 100;
          return (
            <View key={`${item.date}-${item.value}`} style={styles.barRow}>
              <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(normalized, 4)}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.valueLabel}>{item.value.toFixed(1)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.minmax}>Mín: {min.toFixed(1)} | Máx: {max.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  chartBody: {
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  dateLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    width: 38,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  fill: {
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  minmax: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  track: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  valueLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    width: 34,
  },
});
