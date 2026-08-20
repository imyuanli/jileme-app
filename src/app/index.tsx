import { Text, View, StyleSheet } from "react-native"
import { Button } from "@/components/ui/button"

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
      <Button>
        <Text className={"text-red-500"}>Press Cmd+R to reload, </Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
