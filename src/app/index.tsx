import { Text, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Index() {
  return (
    <View className="flex-1 w-full">
      <Text>Edit src/app/index.tsx to edit this screen. 12312321</Text>
      <Button variant="destructive">
        <Text>Press Cmd+R to reload, </Text>
      </Button>
      <Button variant="outline">
        <Text>Cmd+D or shake for dev menu</Text>
      </Button>
      <Input placeholder="Input" />
    </View>
  )
}
