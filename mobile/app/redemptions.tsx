import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { Redemption } from '@/types';

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));
}

function statusMeta(status: Redemption['status']) {
  if (status === 'delivered') {
    return { icon: '✅', label: 'Entregue', color: COLORS.success };
  }
  if (status === 'cancelled') {
    return { icon: '❌', label: 'Cancelado', color: COLORS.error };
  }
  return { icon: '⏳', label: 'Pendente', color: COLORS.warning };
}

export default function RedemptionsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const redemptionsQuery = useQuery({
    queryKey: ['my-redemptions'],
    queryFn: () => api.get<Redemption[]>('/rewards/my-redemptions').then((r) => r.data),
    staleTime: 30_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await redemptionsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (redemptionsQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const redemptions = redemptionsQuery.data ?? [];

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Meus Resgates</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {redemptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum resgate realizado ainda.</Text>
          </View>
        ) : (
          redemptions.map((redemption) => {
            const status = statusMeta(redemption.status);
            return (
              <View key={redemption.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={[styles.statusBadge, { color: status.color }]}>
                    {status.icon} {status.label}
                  </Text>
                </View>
                <Text style={styles.rewardName}>{redemption.reward.name}</Text>
                <Text style={styles.detailText}>
                  {redemption.points_spent.toLocaleString('pt-BR')} pts - {formatDate(redemption.created_at)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 70,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  detailText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  headerRow: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  rewardName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statusBadge: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
