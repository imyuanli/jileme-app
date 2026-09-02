import { View } from "react-native"

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppSymbol } from "@/components/ui/symbol"

export default function ProfileScreen() {
  return (
    <View className="bg-background flex-1 p-4">
      <Empty className="flex-1">
        <EmptyMedia>
          <AppSymbol name={{ ios: "person", android: "person" }} size={22} />
        </EmptyMedia>
        <View className="items-center gap-2">
          <EmptyTitle>我的</EmptyTitle>
          <EmptyDescription>账户信息和个人偏好会放在这里。</EmptyDescription>
        </View>
      </Empty>
    </View>
  )
}
