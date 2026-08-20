import "@/global.css"
import { Stack, ThemeProvider } from "expo-router"
import { PortalHost } from "@rn-primitives/portal"
import * as SplashScreen from "expo-splash-screen"
import { useColorScheme } from "react-native"
import { NAV_THEME } from "@/lib/theme"
import { StatusBar } from "expo-status-bar"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme: "light" | "dark" | "unspecified" = useColorScheme() || "light"

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack />
      <PortalHost />
    </ThemeProvider>
  )
}
