import { useColorScheme as useNativeColorScheme } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

export function useColorScheme(): AppColorScheme {
  return useNativeColorScheme() ?? 'dark';
}
