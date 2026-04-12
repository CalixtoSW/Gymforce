import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { MembershipInfo, PaymentHistory } from '@/types';

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('pt-BR');
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MembershipScreen() {
  const router = useRouter();

  const membershipQuery = useQuery({
    queryKey: ['membership-info'],
    queryFn: () => api.get<MembershipInfo | null>('/payments/my-membership').then((r) => r.data),
    staleTime: 30_000,
  });

  const historyQuery = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get<PaymentHistory[]>('/payments/history').then((r) => r.data),
    staleTime: 30_000,
  });

  if (membershipQuery.isLoading || historyQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const membership = membershipQuery.data;
  const payments = historyQuery.data ?? [];
  const daysRemaining = membership?.days_remaining ?? 0;
  const durationDays =
    membership && membership.start_date && membership.end_date
      ? Math.max(
          1,
          Math.ceil(
            (new Date(membership.end_date).getTime() - new Date(membership.start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 1;
  const progress = membership ? Math.min(1, Math.max(0, daysRemaining / durationDays)) : 0;
  const isActive = Boolean(membership && membership.status === 'active' && daysRemaining >= 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Minha Matrícula</Text>
      </View>

      {isActive && membership ? (
        <View style={[styles.statusCard, styles.activeCard]}>
          <Text style={styles.activeTitle}>✅ Matrícula Ativa</Text>
          <Text style={styles.infoText}>Plano: {membership.plan_name ?? '-'}</Text>
          <Text style={styles.infoText}>Início: {formatDate(membership.start_date)}</Text>
          <Text style={styles.infoText}>Vencimento: {formatDate(membership.end_date)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.infoText}>Restam {daysRemaining} dias</Text>

          <Pressable onPress={() => router.push('/plans')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Renovar Matrícula</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.statusCard, styles.warningCard]}>
          <Text style={styles.warningTitle}>⚠️ Sem Matrícula Ativa</Text>
          <Text style={styles.warningText}>
            Ative ou renove sua matrícula para acessar a academia.
          </Text>
          <Pressable onPress={() => router.push('/plans')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Escolher Plano</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>📋 Histórico de Pagamentos</Text>
        {payments.length === 0 ? (
          <Text style={styles.historyItem}>Nenhum pagamento encontrado.</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.historyRow}>
              <Text style={styles.historyItem}>
                {payment.status === 'approved' ? '✅' : '⏳'} {formatMoney(payment.final_amount)}
              </Text>
              <Text style={styles.historyDate}>{formatDate(payment.created_at)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activeCard: {
    borderColor: COLORS.success,
  },
  activeTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
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
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  historyItem: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  progressFill: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    height: 10,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  warningCard: {
    borderColor: COLORS.warning,
  },
  warningText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  warningTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
