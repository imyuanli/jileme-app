import { View } from "react-native"

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppSymbol } from "@/components/ui/symbol"

export default function ModulesScreen() {
  return (
    <View className="bg-background flex-1">
      <Empty className="flex-1">
        <EmptyMedia>
          <AppSymbol name={{ ios: "square.grid.2x2", android: "grid_view" }} size={22} />
        </EmptyMedia>
        <View className="items-center gap-2">
          <EmptyTitle>你的记录模块</EmptyTitle>
          <EmptyDescription>日记、目标、笔记和更多生活记录会汇集在这里。</EmptyDescription>
        </View>
      </Empty>
    </View>
  )
}
