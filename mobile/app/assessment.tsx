import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EvolutionChart } from '@/components/features/EvolutionChart';
import { MetricCard } from '@/components/features/MetricCard';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { Assessment, AssessmentEvolution } from '@/types';

const METRIC_OPTIONS = [
  { key: 'weight_kg', label: 'Peso', color: COLORS.info },
  { key: 'body_fat_pct', label: 'Gordura', color: COLORS.warning },
  { key: 'muscle_mass_kg', label: 'Massa', color: COLORS.success },
  { key: 'bmi', label: 'IMC', color: COLORS.primary },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]['key'];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

function getValue(assessment: Assessment, metric: MetricKey): number | null {
  const value = assessment[metric];
  return typeof value === 'number' ? value : null;
}

export default function AssessmentScreen() {
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight_kg');

  const historyQuery = useQuery({
    queryKey: ['assessment-history'],
    queryFn: () => api.get<Assessment[]>('/assessments/history').then((r) => r.data),
    staleTime: 30_000,
  });

  const evolutionQuery = useQuery({
    queryKey: ['assessment-evolution'],
    queryFn: () => api.get<AssessmentEvolution[]>('/assessments/evolution').then((r) => r.data),
    staleTime: 30_000,
  });

  if (historyQuery.isLoading || evolutionQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const assessments = historyQuery.data ?? [];
  const evolution = evolutionQuery.data ?? [];
  const latest = assessments[0];

  if (!latest) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyText}>Nenhuma avaliação registrada. Fale com seu personal.</Text>
      </View>
    );
  }

  const metricConfig = METRIC_OPTIONS.find((item) => item.key === selectedMetric)!;
  const chartData = assessments
    .slice()
    .reverse()
    .map((item) => ({
      date: item.assessment_date,
      value: getValue(item, selectedMetric) ?? 0,
    }))
    .filter((item) => item.value > 0);

  const getEvolutionChange = (metric: string): number | null => {
    const item = evolution.find((row) => row.metric === metric);
    return item?.change ?? null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Avaliação Física</Text>
      </View>

      <Text style={styles.subtitle}>Última avaliação: {formatDate(latest.assessment_date)}</Text>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Peso"
          value={`${latest.weight_kg?.toFixed(1) ?? '--'} kg`}
          change={getEvolutionChange('weight_kg')}
          invertColor
        />
        <MetricCard
          label="Gordura"
          value={`${latest.body_fat_pct?.toFixed(1) ?? '--'}%`}
          change={getEvolutionChange('body_fat_pct')}
          invertColor
        />
        <MetricCard
          label="Massa M."
          value={`${latest.muscle_mass_kg?.toFixed(1) ?? '--'} kg`}
          change={getEvolutionChange('muscle_mass_kg')}
        />
        <MetricCard
          label="IMC"
          value={`${latest.bmi?.toFixed(1) ?? '--'}`}
          change={getEvolutionChange('bmi')}
          invertColor
        />
      </View>

      <View style={styles.chipsRow}>
        {METRIC_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setSelectedMetric(option.key)}
            style={[styles.chip, selectedMetric === option.key && styles.chipActive]}
          >
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <EvolutionChart data={chartData} label={metricConfig.label} color={metricConfig.color} />

      <View style={styles.circCard}>
        <Text style={styles.sectionTitle}>Circunferências</Text>
        <Text style={styles.circText}>Peito: {latest.chest_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Cintura: {latest.waist_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Quadril: {latest.hips_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Braço D: {latest.right_arm_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Braço E: {latest.left_arm_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Coxa D: {latest.right_thigh_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Coxa E: {latest.left_thigh_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Pant. D: {latest.right_calf_cm?.toFixed(1) ?? '--'} cm</Text>
        <Text style={styles.circText}>Pant. E: {latest.left_calf_cm?.toFixed(1) ?? '--'} cm</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipActive: {
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  circCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  circText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricsGrid: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
