import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { api } from '@/services/api';
import type { ReferralStats } from '@/types';

export default function ReferralScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => api.get<ReferralStats>('/referrals/my-stats').then((r) => r.data),
    staleTime: 30_000,
  });

  if (statsQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const stats = statsQuery.data;
  if (!stats) {
    return null;
  }

  const handleCopy = async () => {
    await Clipboard.setStringAsync(stats.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    const text = `Treine na GymForce! Use meu código ${stats.referral_code} no cadastro e ganhe benefícios. 💪`;
    await Share.share({ message: text });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Indicar Amigos 👥</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Seu código:</Text>
        <Text style={styles.codeValue}>{stats.referral_code}</Text>
        <View style={styles.actionsRow}>
          <Pressable onPress={handleCopy} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{copied ? 'Copiado ✅' : '📋 Copiar'}</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📤 Compartilhar</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Como funciona:</Text>
        <Text style={styles.infoText}>1. Compartilhe seu código com um amigo.</Text>
        <Text style={styles.infoText}>2. Amigo se cadastra com seu código → +100 pts.</Text>
        <Text style={styles.infoText}>3. Amigo faz primeiro check-in → +100 pts.</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Suas indicações:</Text>
        <Text style={styles.infoText}>👥 Indicados: {stats.total_referred}</Text>
        <Text style={styles.infoText}>✅ Ativados: {stats.total_activated}</Text>
        <Text style={styles.infoText}>⭐ Pontos ganhos: {stats.points_earned}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  codeCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  codeLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  codeValue: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    letterSpacing: 1,
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
  infoCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
});
