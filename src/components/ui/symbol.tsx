import { SymbolView, type SymbolViewProps } from "expo-symbols"
import { useColorScheme } from "react-native"

import { THEME } from "@/lib/theme"

type SymbolTone = "foreground" | "primary" | "primaryForeground" | "mutedForeground" | "destructive"

type AppSymbolProps = Omit<SymbolViewProps, "tintColor"> & {
  tone?: SymbolTone
}

export function AppSymbol({ tone = "foreground", size = 20, ...props }: AppSymbolProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"

  return <SymbolView tintColor={THEME[colorScheme][tone]} size={size} {...props} />
}
