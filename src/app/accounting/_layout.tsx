import { Stack, useRouter } from "expo-router"
import { useColorScheme } from "react-native"

import { Button } from "@/components/ui/button"
import { AppSymbol } from "@/components/ui/symbol"
import { THEME } from "@/lib/theme"

export const unstable_settings = {
  initialRouteName: "(tabs)",
}

export default function AccountingLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const router = useRouter()

  function goBackToPreviousPage() {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/")
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: THEME[colorScheme].background },
        headerTintColor: THEME[colorScheme].foreground,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "记账",
          headerLeft: () => (
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={goBackToPreviousPage}
              accessibilityLabel="返回记了么控制台"
            >
              <AppSymbol name={{ ios: "chevron.left", android: "arrow_back" }} size={19} />
            </Button>
          ),
        }}
      />
      <Stack.Screen
        name="entry"
        options={{
          title: "记一笔",
          headerBackButtonMenuEnabled: false,
          headerLeft: () => (
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={goBackToPreviousPage}
              accessibilityLabel="返回上一页"
            >
              <AppSymbol name={{ ios: "chevron.left", android: "arrow_back" }} size={19} />
            </Button>
          ),
        }}
      />
      <Stack.Screen name="ledgers/[id]/index" options={{ title: "账本详情" }} />
      <Stack.Screen name="ledgers/[id]/settings" options={{ title: "账本设置" }} />
      <Stack.Screen
        name="ledgers/[id]/name"
        options={{ title: "修改账本名称", headerBackButtonMenuEnabled: false }}
      />
    </Stack>
  )
}
