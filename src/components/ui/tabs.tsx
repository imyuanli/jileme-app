import { TextClassContext } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import * as TabsPrimitive from "@rn-primitives/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { Platform } from "react-native"

const tabsListVariants = cva(
  "bg-muted flex flex-row items-center justify-center rounded-lg p-[3px]",
  {
    variants: {
      size: {
        xs: "h-8",
        sm: "h-9",
        default: "h-10",
        lg: "h-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type TabsSize = NonNullable<VariantProps<typeof tabsListVariants>["size"]>

const TabsSizeContext = React.createContext<TabsSize>("default")

const tabsTriggerHitSlop = {
  xs: { top: 6, bottom: 6, left: 0, right: 0 },
  sm: { top: 4, bottom: 4, left: 0, right: 0 },
  default: { top: 2, bottom: 2, left: 0, right: 0 },
  lg: 0,
} as const

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({
  className,
  size,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const resolvedSize = size ?? "default"

  return (
    <TabsSizeContext.Provider value={resolvedSize}>
      <TabsPrimitive.List
        className={cn(
          tabsListVariants({ size: resolvedSize }),
          Platform.select({ web: "inline-flex w-fit", native: "mr-auto" }),
          className
        )}
        {...props}
      />
    </TabsSizeContext.Provider>
  )
}

function TabsTrigger({
  className,
  hitSlop,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value } = TabsPrimitive.useRootContext()
  const size = React.useContext(TabsSizeContext)

  return (
    <TextClassContext.Provider
      value={cn(
        "text-foreground dark:text-muted-foreground text-sm font-medium",
        value === props.value && "dark:text-foreground"
      )}
    >
      <TabsPrimitive.Trigger
        className={cn(
          "flex self-stretch flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-black/5",
          Platform.select({
            web: "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex cursor-default whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
          }),
          props.disabled && "opacity-50",
          props.value === value && "bg-background dark:border-foreground/10 dark:bg-input/30",
          className
        )}
        hitSlop={hitSlop ?? tabsTriggerHitSlop[size]}
        {...props}
      />
    </TextClassContext.Provider>
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(Platform.select({ web: "flex-1 outline-none" }), className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants }
