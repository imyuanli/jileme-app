import { useRouter } from "expo-router"
import { Pressable, ScrollView, View } from "react-native"

import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { RECORD_MODULES, type RecordModule } from "@/lib/constants/record-modules"

export default function ModulesScreen() {
  const router = useRouter()

  function openModule(module: RecordModule) {
    if (module.id === "accounting") {
      router.push("/accounting")
      return
    }

    router.push({ pathname: "/modules/[moduleId]", params: { moduleId: module.id } })
  }

  return (
    <ScrollView
      className="bg-background flex-1"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4"
    >
      <View className="gap-1">
        <Text className="text-2xl font-semibold">记录模块</Text>
        <Text className="text-muted-foreground text-sm leading-6">
          选择一个模块，进入它的记录空间。
        </Text>
      </View>

      <View className="gap-4">
        {RECORD_MODULES.map((module) => (
          <Pressable
            key={module.id}
            className="rounded-2xl active:opacity-70"
            onPress={() => openModule(module)}
            accessibilityRole="button"
            accessibilityLabel={`打开${module.name}模块`}
          >
            <Item>
              <ItemMedia>
                <AppSymbol name={module.icon} size={20} tone="primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{module.name}</ItemTitle>
                <ItemDescription>{module.summary}</ItemDescription>
              </ItemContent>
              <ItemActions className="flex-row items-center gap-2">
                <Badge variant={module.status === "可进入" ? "default" : "outline"}>
                  <Text>{module.status}</Text>
                </Badge>
                <AppSymbol
                  name={{ ios: "chevron.right", android: "chevron_right" }}
                  size={16}
                  tone="mutedForeground"
                />
              </ItemActions>
            </Item>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
