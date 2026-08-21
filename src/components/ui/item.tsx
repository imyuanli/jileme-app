import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

function ItemGroup({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("gap-1", className)} {...props} />
}

function Item({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn("min-h-14 flex-row items-center gap-3 rounded-2xl px-3 py-2", className)}
      {...props}
    />
  )
}

function ItemMedia({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn("bg-muted size-9 shrink-0 items-center justify-center rounded-xl", className)}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("min-w-0 flex-1 gap-0.5", className)} {...props} />
}

function ItemTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-sm font-medium", className)} numberOfLines={1} {...props} />
}

function ItemDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text className={cn("text-muted-foreground text-xs", className)} numberOfLines={1} {...props} />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("shrink-0 items-end", className)} {...props} />
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle }
