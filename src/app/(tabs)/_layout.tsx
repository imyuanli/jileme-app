import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useRef } from "react"
import { useColorScheme, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"

export default function TabsLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const quickAddSheetRef = useRef<BottomSheetModal>(null)

  function presentQuickAdd() {
    quickAddSheetRef.current?.present()
  }

  function dismissQuickAdd() {
    quickAddSheetRef.current?.dismiss()
  }

  return (
    <>
      <NativeTabs tintColor={THEME[colorScheme].primary}>
        <NativeTabs.Trigger name="index" accessibilityLabel="首页">
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
          <NativeTabs.Trigger.Label>首页</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="modules" accessibilityLabel="模块" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon
            sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
            md="grid_view"
          />
          <NativeTabs.Trigger.Label>模块</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger
          name="quick-add"
          accessibilityLabel="快速添加"
          disabled
          listeners={{ tabPress: presentQuickAdd }}
        >
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
          <NativeTabs.Trigger.Label>添加</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger
          name="insights"
          accessibilityLabel="洞察"
          disableTransparentOnScrollEdge
        >
          <NativeTabs.Trigger.Icon
            sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
            md="insights"
          />
          <NativeTabs.Trigger.Label>洞察</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile" accessibilityLabel="我的" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon
            sf={{ default: "person", selected: "person.fill" }}
            md="person"
          />
          <NativeTabs.Trigger.Label>我的</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>

      <BottomSheetModal ref={quickAddSheetRef} enablePanDownToClose>
        <BottomSheetView>
          <View className="gap-6 px-6 pb-8 pt-2">
            <View className="gap-2">
              <Text className="text-xl font-semibold">快速添加</Text>
              <Text className="text-muted-foreground text-sm leading-6">
                常用的记录入口会放在这里。
              </Text>
            </View>
            <Button variant="outline" onPress={dismissQuickAdd} accessibilityLabel="关闭快速添加">
              <Text>关闭</Text>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
