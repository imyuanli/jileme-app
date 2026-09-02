import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { View } from "react-native"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getRecordModule } from "@/lib/constants/record-modules"

export default function ModuleHomeScreen() {
  const params = useLocalSearchParams<{ moduleId?: string | string[] }>()
  const router = useRouter()
  const moduleId = Array.isArray(params.moduleId) ? params.moduleId[0] : params.moduleId
  const module = getRecordModule(moduleId)

  useEffect(() => {
    if (!module) {
      router.replace("/modules")
    }
  }, [module, router])

  if (!module) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-4">
        <Stack.Screen options={{ title: "模块" }} />
        <Empty>
          <EmptyTitle>模块不存在</EmptyTitle>
          <EmptyDescription>这个记录模块暂时无法打开。</EmptyDescription>
          <Button variant="outline" onPress={() => router.replace("/modules")}>
            <Text>返回模块列表</Text>
          </Button>
        </Empty>
      </View>
    )
  }

  return (
    <View className="bg-background flex-1 p-4">
      <Stack.Screen options={{ title: module.name }} />
      <Empty className="flex-1">
        <EmptyMedia>
          <AppSymbol name={module.icon} size={22} tone="primary" />
        </EmptyMedia>
        <View className="items-center gap-2">
          <EmptyTitle>{module.name}</EmptyTitle>
          <EmptyDescription>{module.summary}</EmptyDescription>
          <Text className="text-muted-foreground text-sm">这个模块正在准备中，敬请期待。</Text>
        </View>
      </Empty>
    </View>
  )
}
