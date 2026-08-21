import { ActivityIndicator, type ActivityIndicatorProps, useColorScheme } from "react-native"

import { THEME } from "@/lib/theme"

type SpinnerTone = "primary" | "primaryForeground" | "mutedForeground"

type SpinnerProps = Omit<ActivityIndicatorProps, "color"> & {
  tone?: SpinnerTone
}

export function Spinner({ tone = "primary", size = "small", ...props }: SpinnerProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"

  return <ActivityIndicator color={THEME[colorScheme][tone]} size={size} {...props} />
}
