import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

function FieldGroup({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("gap-5", className)} {...props} />
}

function Field({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("gap-2", className)} {...props} />
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-sm font-medium", className)} {...props} />
}

function FieldDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-muted-foreground text-xs leading-5", className)} {...props} />
}

function FieldError({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn("text-destructive text-sm leading-5", className)}
      accessibilityRole="alert"
      {...props}
    />
  )
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={cn("flex-row items-center gap-3", className)} {...props}>
      <View className="bg-border h-px flex-1" />
      <Text className="text-muted-foreground text-xs">{children}</Text>
      <View className="bg-border h-px flex-1" />
    </View>
  )
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator }
