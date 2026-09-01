import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("items-center justify-center gap-5 py-14", className)} {...props} />
}

function EmptyMedia({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn("bg-muted size-12 items-center justify-center rounded-2xl", className)}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-center text-lg font-semibold", className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn("text-muted-foreground text-center text-sm leading-6", className)}
      {...props}
    />
  )
}

export { Empty, EmptyDescription, EmptyMedia, EmptyTitle }
