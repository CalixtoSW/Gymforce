import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types';

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function rankMedal(rank: number): string {
  if (rank === 1) {
    return '🥇';
  }
  if (rank === 2) {
    return '🥈';
  }
  if (rank === 3) {
    return '🥉';
  }
  return `#${rank}`;
}

function Avatar({
  avatarUrl,
  name,
  large = false,
}: {
  avatarUrl?: string | null;
  name: string;
  large?: boolean;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, large ? styles.avatarLarge : null]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        large ? styles.avatarLarge : null,
      ]}
    >
      <Text style={[styles.avatarText, large ? styles.avatarTextLarge : null]}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

function PodiumCard({ entry, large = false }: { entry: LeaderboardEntry; large?: boolean }) {
  const rankColor = RANK_COLORS[entry.rank] ?? COLORS.textPrimary;
  return (
    <View style={[styles.podiumCard, large ? styles.podiumCardLarge : null]}>
      <Text style={[styles.podiumMedal, { color: rankColor }]}>{rankMedal(entry.rank)}</Text>
      <Avatar avatarUrl={entry.avatar_url} large={large} name={entry.name} />
      <Text numberOfLines={1} style={styles.podiumName}>
        {entry.name}
      </Text>
      <Text style={styles.podiumPoints}>{entry.points.toLocaleString('pt-BR')} pts</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const leaderboardQuery = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () =>
      api
        .get<LeaderboardResponse>('/gamification/leaderboard?limit=10')
        .then((r) => r.data),
    staleTime: 15_000,
  });

  const data = leaderboardQuery.data;
  const top3 = useMemo(() => (data?.leaderboard ?? []).slice(0, 3), [data?.leaderboard]);
  const rest = useMemo(() => (data?.leaderboard ?? []).slice(3), [data?.leaderboard]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const top10Cut = data?.leaderboard?.[9];
  const myRank = data?.my_rank;
  const missingForTop10 =
    myRank && myRank.rank > 10 && top10Cut
      ? Math.max(0, top10Cut.points - myRank.points)
      : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await leaderboardQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (leaderboardQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>🏆 Ranking</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>

        {top3[0] ? <PodiumCard entry={top3[0]} large /> : null}

        <View style={styles.podiumRow}>
          {top3[1] ? <PodiumCard entry={top3[1]} /> : <View style={styles.podiumPlaceholder} />}
          {top3[2] ? <PodiumCard entry={top3[2]} /> : <View style={styles.podiumPlaceholder} />}
        </View>

        <View style={styles.listCard}>
          {rest.length === 0 ? (
            <Text style={styles.emptyText}>Leaderboard ainda sem dados.</Text>
          ) : (
            rest.map((entry) => (
              <View key={entry.user_id} style={styles.listRow}>
                <Text style={styles.listRank}>{entry.rank}</Text>
                <Text numberOfLines={1} style={styles.listName}>
                  {entry.name}
                </Text>
                <Text style={styles.listPoints}>{entry.points.toLocaleString('pt-BR')}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.myRankCard}>
        <Text style={styles.myRankTitle}>📍 Sua posição: {myRank ? `#${myRank.rank}` : '--'}</Text>
        <Text style={styles.myRankPoints}>{myRank ? `${myRank.points.toLocaleString('pt-BR')} pts` : 'Sem pontos no ranking atual'}</Text>
        {missingForTop10 > 0 ? (
          <Text style={styles.myRankHint}>
            Faltam {missingForTop10.toLocaleString('pt-BR')} pts p/ #10
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    height: 44,
    justifyContent: 'center',
    marginVertical: SPACING.xs,
    width: 44,
  },
  avatarLarge: {
    height: 56,
    width: 56,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  avatarTextLarge: {
    fontSize: FONT_SIZE.md,
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
    paddingBottom: 150,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  listName: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: FONT_SIZE.md,
    marginHorizontal: SPACING.sm,
  },
  listPoints: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  listRank: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    width: 20,
  },
  listRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  myRankCard: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    bottom: 0,
    gap: SPACING.xs,
    left: 0,
    padding: SPACING.md,
    position: 'absolute',
    right: 0,
  },
  myRankHint: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
  myRankPoints: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  myRankTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  podiumCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 132,
    padding: SPACING.sm,
  },
  podiumCardLarge: {
    minHeight: 164,
    padding: SPACING.md,
  },
  podiumMedal: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  podiumName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    maxWidth: '100%',
  },
  podiumPlaceholder: {
    flex: 1,
  },
  podiumPoints: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    textTransform: 'capitalize',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
