import { View } from "react-native"

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppSymbol } from "@/components/ui/symbol"

export default function InsightsScreen() {
  return (
    <View className="bg-background flex-1 px-4">
      <Empty className="flex-1">
        <EmptyMedia>
          <AppSymbol name={{ ios: "chart.bar", android: "insights" }} size={22} />
        </EmptyMedia>
        <View className="items-center gap-2">
          <EmptyTitle>洞察正在积累</EmptyTitle>
          <EmptyDescription>持续记录后，这里会呈现值得回看的生活变化。</EmptyDescription>
        </View>
      </Empty>
    </View>
  )
}
