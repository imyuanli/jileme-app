import { Stack } from "expo-router"
import { PortalHost } from "@rn-primitives/portal"
import { View } from "react-native"
import "@/global.css"

export default function RootLayout() {
  return (
    <View>
      <Stack />
      <PortalHost />
    </View>
  )
}
