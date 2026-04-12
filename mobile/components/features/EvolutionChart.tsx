import { StyleSheet, Text, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryScatter, VictoryTheme } from 'victory-native';

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

export function EvolutionChart({ data, label, color }: EvolutionChartProps) {
  if (!data.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Sem dados suficientes para o gráfico.</Text>
      </View>
    );
  }

  const chartData = data.map((item, index) => ({
    x: index + 1,
    y: item.value,
    label: new Date(item.date).toLocaleDateString('pt-BR'),
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{label}</Text>
      <VictoryChart theme={VictoryTheme.material} height={220} padding={{ top: 20, bottom: 40, left: 50, right: 20 }}>
        <VictoryAxis
          tickValues={chartData.map((item) => item.x)}
          tickFormat={(value) => chartData[value - 1]?.label?.slice(0, 5) ?? ''}
          style={{
            axis: { stroke: COLORS.border },
            tickLabels: { fill: COLORS.textSecondary, fontSize: 10 },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: COLORS.border },
            tickLabels: { fill: COLORS.textSecondary, fontSize: 10 },
            grid: { stroke: COLORS.border, opacity: 0.2 },
          }}
        />
        <VictoryLine data={chartData} style={{ data: { stroke: color, strokeWidth: 2 } }} />
        <VictoryScatter data={chartData} size={3} style={{ data: { fill: color } }} />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
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
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
