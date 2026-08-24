import "@/global.css"
import { PortalHost } from "@rn-primitives/portal"
import { Stack, ThemeProvider, usePathname } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme, View } from "react-native"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Text } from "@/components/ui/text"
import { fetcher, RequestError } from "@/lib/request"
import { NAV_THEME, THEME } from "@/lib/theme"
import type { CurrentUser } from "@/types/user"

type SessionGateProps = {
  children: (isAuthenticated: boolean) => React.ReactNode
}

const TAB_TITLES: Record<string, string> = {
  "/": "首页",
  "/modules": "模块",
  "/insights": "洞察",
  "/profile": "我的",
}

function SessionGate({ children }: SessionGateProps) {
  const { data, error, isLoading, mutate } = useSWR<CurrentUser>("/api/me", fetcher.get, {
    shouldRetryOnError: (requestError) =>
      !(requestError instanceof RequestError && requestError.isAuthError),
  })

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 px-8">
        <Spinner size="large" />
        <Text className="text-muted-foreground text-sm">正在打开你的记录...</Text>
      </View>
    )
  }

  if (error && !(error instanceof RequestError && error.isAuthError)) {
    const message = error instanceof Error ? error.message : "暂时无法确认登录状态。"

    return (
      <View className="bg-background flex-1 items-center justify-center gap-5 px-8">
        <View className="max-w-sm items-center gap-2">
          <Text className="text-center text-xl font-semibold">连接没有成功</Text>
          <Text className="text-muted-foreground text-center text-sm leading-6">{message}</Text>
        </View>
        <Button onPress={() => void mutate()} accessibilityLabel="重新检查登录状态">
          <Text>重新尝试</Text>
        </Button>
      </View>
    )
  }

  return children(Boolean(data))
}

export default function RootLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const pathname = usePathname()

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SessionGate>
        {(isAuthenticated) => (
          <Stack>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen
                name="(tabs)"
                options={{
                  title: TAB_TITLES[pathname] ?? "首页",
                  headerStyle: { backgroundColor: THEME[colorScheme].background },
                  headerTintColor: THEME[colorScheme].foreground,
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="accounting"
                options={{
                  title: "记账",
                  headerBackTitle: "返回",
                  headerStyle: { backgroundColor: THEME[colorScheme].background },
                  headerTintColor: THEME[colorScheme].foreground,
                  headerShadowVisible: false,
                }}
              />
            </Stack.Protected>
          </Stack>
        )}
      </SessionGate>
      <PortalHost />
    </ThemeProvider>
  )
}
