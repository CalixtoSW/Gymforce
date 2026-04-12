import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { PlanWithDiscount, PixPayment } from '@/types';

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PlansScreen() {
  const router = useRouter();
  const [usePointsDiscount, setUsePointsDiscount] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ['plans-with-discount'],
    queryFn: () => api.get<PlanWithDiscount[]>('/payments/plans').then((r) => r.data),
    staleTime: 30_000,
  });

  const plans = plansQuery.data ?? [];
  const userPoints = plans[0]?.user_points ?? 0;

  const handlePayPix = async (planId: string) => {
    try {
      setLoadingPlanId(planId);
      const { data } = await api.post<PixPayment>('/payments/create-pix', {
        plan_id: planId,
        use_points_discount: usePointsDiscount,
      });

      router.push({
        pathname: '/payment/[id]',
        params: {
          id: data.payment_id,
          plan_name: data.plan_name,
          amount: String(data.amount),
          discount_points: String(data.discount_points),
          discount_amount: String(data.discount_amount),
          final_amount: String(data.final_amount),
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          expires_at: data.expires_at ?? '',
        },
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  if (plansQuery.isLoading) {
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
        <Text style={styles.title}>Escolher Plano</Text>
      </View>

      <View style={styles.discountCard}>
        <Text style={styles.pointsText}>Seu saldo: ⭐ {userPoints.toLocaleString('pt-BR')} pts</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Usar pontos como desconto</Text>
          <Switch
            value={usePointsDiscount}
            onValueChange={setUsePointsDiscount}
            trackColor={{ false: COLORS.border, true: COLORS.primaryDark }}
            thumbColor={usePointsDiscount ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
      </View>

      {plans.map((plan) => {
        const finalPrice = usePointsDiscount ? plan.final_price_with_discount : plan.price;
        const discountAmount = usePointsDiscount ? plan.discount_available : 0;
        const discountPoints = usePointsDiscount ? plan.discount_points : 0;

        return (
          <View key={plan.id} style={styles.planCard}>
            <Text style={styles.planTitle}>📅 {plan.name}</Text>
            <Text style={styles.planPrice}>{formatMoney(plan.price)}</Text>
            {plan.description ? <Text style={styles.planDescription}>{plan.description}</Text> : null}

            {usePointsDiscount && discountAmount > 0 ? (
              <>
                <Text style={styles.discountText}>Desconto: -{formatMoney(discountAmount)}</Text>
                <Text style={styles.pointsUsedText}>
                  Pontos usados: {discountPoints.toLocaleString('pt-BR')}
                </Text>
              </>
            ) : null}

            <Text style={styles.finalText}>Total: {formatMoney(finalPrice)}</Text>

            <Pressable
              onPress={() => handlePayPix(plan.id)}
              style={styles.payButton}
              disabled={loadingPlanId === plan.id}
            >
              {loadingPlanId === plan.id ? (
                <ActivityIndicator color={COLORS.textPrimary} />
              ) : (
                <Text style={styles.payButtonText}>Pagar com PIX</Text>
              )}
            </Pressable>
          </View>
        );
      })}
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
  discountCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  discountText: {
    color: COLORS.xp,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  finalText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 44,
  },
  payButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  planDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  planPrice: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  pointsText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  pointsUsedText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
});
