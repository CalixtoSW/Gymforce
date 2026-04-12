import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChallengeCard } from '@/components/features/ChallengeCard';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { Challenge, UserChallenge } from '@/types';

function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const diff = end.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ChallengesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const myChallengesQuery = useQuery({
    queryKey: ['my-challenges'],
    queryFn: () => api.get<UserChallenge[]>('/challenges/my').then((r) => r.data),
    staleTime: 20_000,
  });

  const activeChallengesQuery = useQuery({
    queryKey: ['active-challenges'],
    queryFn: () => api.get<Challenge[]>('/challenges/').then((r) => r.data),
    staleTime: 20_000,
  });

  const myChallenges = useMemo(() => myChallengesQuery.data ?? [], [myChallengesQuery.data]);
  const activeChallenges = activeChallengesQuery.data ?? [];

  const myIds = useMemo(() => new Set(myChallenges.map((item) => item.challenge.id)), [myChallenges]);
  const available = activeChallenges.filter((challenge) => !myIds.has(challenge.id));

  const handleJoin = async (challengeId: string) => {
    try {
      setJoiningId(challengeId);
      await api.post(`/challenges/${challengeId}/join`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['active-challenges'] }),
      ]);
    } finally {
      setJoiningId(null);
    }
  };

  if (myChallengesQuery.isLoading || activeChallengesQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Desafios 🎯</Text>
      </View>

      <Text style={styles.sectionTitle}>Meus Desafios</Text>
      {myChallenges.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não participa de desafios.</Text>
      ) : (
        myChallenges.map((item) => (
          <ChallengeCard
            key={item.id}
            challenge={item.challenge}
            progress={item.progress}
            goalValue={item.challenge.goal_value}
            completed={item.completed}
            daysRemaining={daysRemaining(item.challenge.end_date)}
            rewardPoints={item.challenge.reward_points}
          />
        ))
      )}

      <Text style={styles.sectionTitle}>Desafios Disponíveis</Text>
      {available.length === 0 ? (
        <Text style={styles.emptyText}>Sem desafios disponíveis no momento.</Text>
      ) : (
        available.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            goalValue={challenge.goal_value}
            rewardPoints={challenge.reward_points}
            onJoin={() => handleJoin(challenge.id)}
            isJoining={joiningId === challenge.id}
          />
        ))
      )}
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
    fontSize: FONT_SIZE.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
