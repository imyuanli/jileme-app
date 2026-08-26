import { useRouter } from "expo-router"
import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useColorScheme } from "react-native"

import { THEME } from "@/lib/theme"

export default function AccountingTabsLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const router = useRouter()

  return (
    <>
      <NativeTabs tintColor={THEME[colorScheme].primary}>
        <NativeTabs.Trigger name="index" accessibilityLabel="记账明细">
          <NativeTabs.Trigger.Icon
            sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }}
            md="receipt_long"
          />
          <NativeTabs.Trigger.Label>明细</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger
          name="quick-add"
          accessibilityLabel="快速记账"
          disabled
          listeners={{ tabPress: () => router.push("/accounting/entry") }}
        >
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
          <NativeTabs.Trigger.Label hidden>记一笔</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="ledgers" accessibilityLabel="账本">
          <NativeTabs.Trigger.Icon
            sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
            md="library_books"
          />
          <NativeTabs.Trigger.Label>账本</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  )
}
