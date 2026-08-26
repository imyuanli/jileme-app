import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet"
import { useRouter } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useRef } from "react"
import { Pressable, useColorScheme, View } from "react-native"

import { Button } from "@/components/ui/button"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"

const QUICK_RECORD_ACTIONS = [
  {
    name: "记账",
    enabled: true,
    icon: { ios: "yensign.circle", android: "payments" },
  },
  {
    name: "日记",
    enabled: false,
    icon: { ios: "book.closed", android: "book" },
  },
  {
    name: "心情",
    enabled: false,
    icon: { ios: "heart", android: "favorite" },
  },
  {
    name: "随笔",
    enabled: false,
    icon: { ios: "square.and.pencil", android: "edit_note" },
  },
  {
    name: "打卡",
    enabled: false,
    icon: { ios: "checkmark.circle", android: "task_alt" },
  },
  {
    name: "日程",
    enabled: false,
    icon: { ios: "calendar", android: "calendar_month" },
  },
  {
    name: "目标",
    enabled: false,
    icon: { ios: "target", android: "flag" },
  },
  {
    name: "笔记",
    enabled: false,
    icon: { ios: "note.text", android: "note" },
  },
] as const

export default function TabsLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const router = useRouter()
  const quickAddSheetRef = useRef<BottomSheetModal>(null)
  const pendingRouteRef = useRef<"/accounting/entry" | null>(null)

  function presentQuickAdd() {
    quickAddSheetRef.current?.present()
  }

  function dismissQuickAdd() {
    quickAddSheetRef.current?.dismiss()
  }

  function openAccounting() {
    pendingRouteRef.current = "/accounting/entry"
    quickAddSheetRef.current?.dismiss()
  }

  function handleQuickAddDismiss() {
    const pendingRoute = pendingRouteRef.current
    pendingRouteRef.current = null

    if (pendingRoute) router.push(pendingRoute)
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
          <NativeTabs.Trigger.Label hidden>添加</NativeTabs.Trigger.Label>
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

      <BottomSheetModal
        ref={quickAddSheetRef}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
        onDismiss={handleQuickAddDismiss}
      >
        <BottomSheetView>
          <View className="gap-5 px-5 pb-8 pt-2">
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-xl font-semibold">记一下</Text>
                <Text className="text-muted-foreground text-sm">选择这次想记录的内容</Text>
              </View>
              <Button
                variant="ghost"
                size="icon-sm"
                onPress={dismissQuickAdd}
                accessibilityLabel="关闭快速添加"
              >
                <AppSymbol name={{ ios: "xmark", android: "close" }} size={17} />
              </Button>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {QUICK_RECORD_ACTIONS.map((action) => (
                <Pressable
                  key={action.name}
                  className="border-border bg-card min-h-16 w-[48%] flex-row items-center gap-3 rounded-2xl border px-3 py-3 disabled:opacity-50"
                  onPress={action.enabled ? openAccounting : undefined}
                  disabled={!action.enabled}
                  accessibilityRole="button"
                  accessibilityLabel={action.enabled ? action.name : `${action.name}，待开放`}
                  accessibilityState={{ disabled: !action.enabled }}
                >
                  <View className="bg-muted size-9 items-center justify-center rounded-xl">
                    <AppSymbol
                      name={action.icon}
                      size={19}
                      tone={action.enabled ? "primary" : "mutedForeground"}
                    />
                  </View>
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-sm font-medium">{action.name}</Text>
                    {!action.enabled ? (
                      <Text className="text-muted-foreground text-xs">待开放</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
