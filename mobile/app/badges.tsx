import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeCard } from '@/components/features/BadgeCard';
import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { Badge, BadgeListResponse } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  streak: 'STREAK',
  workout: 'TREINO',
  milestone: 'MARCOS',
  social: 'SOCIAL',
  general: 'GERAL',
};

export default function BadgesScreen() {
  const router = useRouter();

  const badgesQuery = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get<BadgeListResponse>('/badges').then((r) => r.data),
    staleTime: 30_000,
  });

  if (badgesQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const data = badgesQuery.data;
  const badges = data?.badges ?? [];
  const totalEarned = data?.total_earned ?? 0;
  const totalAvailable = data?.total_available ?? 0;
  const progress = totalAvailable > 0 ? totalEarned / totalAvailable : 0;

  const grouped = badges.reduce<Record<string, Badge[]>>((acc, badge) => {
    const category = badge.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {});

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Conquistas 🏆</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          Desbloqueados: {totalEarned} de {totalAvailable}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
      </View>

      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>-- {CATEGORY_LABELS[category] ?? category.toUpperCase()} --</Text>
          <View style={styles.grid}>
            {items.map((badge) => (
              <BadgeCard
                key={badge.id}
                icon={badge.icon}
                name={badge.name}
                description={badge.description}
                earned={badge.earned}
                earnedAt={badge.earned_at}
                pointsBonus={badge.points_bonus}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingVertical: SPACING.xs,
  },
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
  },
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    gap: SPACING.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  progressPercent: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  progressText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    height: 10,
    overflow: 'hidden',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
