import "@/global.css"
import { Stack, ThemeProvider } from "expo-router"
import { PortalHost } from "@rn-primitives/portal"
import { useColorScheme } from "react-native"
import { NAV_THEME } from "@/lib/theme"
import { StatusBar } from "expo-status-bar"

export default function RootLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack />
      <PortalHost />
    </ThemeProvider>
  )
}
