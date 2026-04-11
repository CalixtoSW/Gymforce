import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { BORDER_RADIUS, COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: ReactNode;
};

export function Button({ title, onPress, icon }: ButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      {icon}
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
