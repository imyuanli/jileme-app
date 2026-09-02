import { DarkTheme, DefaultTheme, type Theme } from "expo-router/react-navigation"

export const THEME = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(210 14% 11%)",
    card: "hsl(180 3% 97%)",
    cardForeground: "hsl(210 14% 11%)",
    popover: "hsl(0 0% 100%)",
    popoverForeground: "hsl(210 14% 11%)",
    primary: "hsl(204 88% 53%)",
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(210 14% 11%)",
    secondaryForeground: "hsl(0 0% 100%)",
    muted: "hsl(240 3% 91%)",
    mutedForeground: "hsl(210 8% 38%)",
    accent: "hsl(206 31% 94%)",
    accentForeground: "hsl(204 88% 45%)",
    destructive: "hsl(0 77% 56%)",
    destructiveForeground: "hsl(0 0% 100%)",
    border: "hsl(0 0% 92%)",
    input: "hsl(0 0% 92%)",
    ring: "hsl(204 82% 54%)",
    radius: "1.3rem",
    chart1: "hsl(204 88% 53%)",
    chart2: "hsl(160 58% 44%)",
    chart3: "hsl(43 88% 56%)",
    chart4: "hsl(151 61% 46%)",
    chart5: "hsl(350 73% 53%)",
  },
  dark: {
    background: "hsl(0 0% 0%)",
    foreground: "hsl(210 7% 93%)",
    card: "hsl(240 5% 12%)",
    cardForeground: "hsl(0 0% 89%)",
    popover: "hsl(0 0% 0%)",
    popoverForeground: "hsl(210 7% 93%)",
    primary: "hsl(204 88% 53%)",
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(210 14% 96%)",
    secondaryForeground: "hsl(210 14% 11%)",
    muted: "hsl(0 0% 13%)",
    mutedForeground: "hsl(210 5% 50%)",
    accent: "hsl(204 33% 13%)",
    accentForeground: "hsl(204 88% 53%)",
    destructive: "hsl(0 77% 56%)",
    destructiveForeground: "hsl(0 0% 100%)",
    border: "hsl(0 0% 24%)",
    input: "hsl(0 0% 30%)",
    ring: "hsl(204 82% 54%)",
    radius: "1.3rem",
    chart1: "hsl(204 88% 53%)",
    chart2: "hsl(160 58% 44%)",
    chart3: "hsl(43 88% 56%)",
    chart4: "hsl(151 61% 46%)",
    chart5: "hsl(350 73% 53%)",
  },
}

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
}

export function getStackScreenOptions(colorScheme: "light" | "dark") {
  return {
    headerStyle: { backgroundColor: THEME[colorScheme].background },
    headerTintColor: THEME[colorScheme].foreground,
    headerShadowVisible: false,
    headerTitleAlign: "center" as const,
    headerBackButtonDisplayMode: "minimal" as const,
  }
}
