import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Ionicons color={COLORS.textPrimary} name="person" size={52} />
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Em desenvolvimento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    gap: SPACING.md,
    justifyContent: 'center',
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
