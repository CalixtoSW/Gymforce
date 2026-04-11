import { StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import type { PointEvent } from '@/types';

type PointsHistoryProps = {
  events: PointEvent[];
};

function formatRelativeDate(isoDate: string): string {
  const target = new Date(isoDate).getTime();
  const diffMs = Date.now() - target;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'hoje';
  }
  if (diffDays === 1) {
    return 'ontem';
  }
  return `${diffDays}d`;
}

function eventIcon(actionType: string): string {
  if (actionType === 'checkin') {
    return '✅';
  }
  if (actionType === 'workout_complete') {
    return '🏋️';
  }
  if (actionType.startsWith('streak_bonus')) {
    return '🔥';
  }
  if (actionType === 'tier_promotion') {
    return '🏆';
  }
  return '⭐';
}

export function PointsHistory({ events }: PointsHistoryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>📊 Ultimas Atividades</Text>

      {events.length === 0 ? (
        <Text style={styles.emptyText}>Sem movimentacoes recentes de pontos.</Text>
      ) : (
        events.map((event) => {
          const positive = event.points >= 0;
          const pointsLabel = `${positive ? '+' : ''}${event.points}`;
          return (
            <View key={event.id} style={styles.row}>
              <Text numberOfLines={1} style={styles.description}>
                {eventIcon(event.action_type)} {event.description}
              </Text>
              <View style={styles.rightCol}>
                <Text style={[styles.points, { color: positive ? COLORS.success : COLORS.error }]}>
                  {pointsLabel}
                </Text>
                <Text style={styles.date}>{formatRelativeDate(event.created_at)}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  date: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  description: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingRight: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  points: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
