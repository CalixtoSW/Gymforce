import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

const tierColorMap = {
  bronze: COLORS.tierBronze,
  prata: COLORS.tierSilver,
  ouro: COLORS.tierGold,
  diamante: COLORS.tierDiamond,
  lenda: COLORS.tierLegend,
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const tierColor = useMemo(() => {
    if (!user) {
      return COLORS.primary;
    }
    return tierColorMap[user.tier] ?? COLORS.primary;
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.[0] ?? 'G'}</Text>
      </View>

      <Text style={styles.name}>{user?.name ?? 'GymForce User'}</Text>
      <Text style={styles.email}>{user?.email ?? '-'}</Text>

      <View style={[styles.tierCard, { borderColor: tierColor }]}> 
        <Text style={[styles.tierText, { color: tierColor }]}>Tier: {user?.tier ?? '-'}</Text>
        <Text style={styles.metric}>Pontos: {user?.total_points ?? 0}</Text>
        <Text style={styles.metric}>Streak: {user?.streak_count ?? 0} dias</Text>
      </View>

      <View style={styles.menuCard}>
        <Pressable onPress={() => router.push('/badges')} style={styles.menuAction}>
          <Text style={styles.menuItem}>Conquistas ▶</Text>
        </Pressable>
        <Text style={styles.menuItem}>Editar Perfil - Em breve</Text>
        <Text style={styles.menuItem}>Notificacoes - Em breve</Text>
        <Text style={styles.menuItem}>Sobre o App - Em breve</Text>
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    height: 96,
    justifyContent: 'center',
    marginTop: SPACING.xl,
    width: 96,
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flexGrow: 1,
    padding: SPACING.lg,
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
  },
  logoutText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    padding: SPACING.md,
    width: '100%',
  },
  menuAction: {
    paddingVertical: SPACING.xs,
  },
  menuItem: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.xs,
  },
  metric: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  tierCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    width: '100%',
  },
  tierText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
