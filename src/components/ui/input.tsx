import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Platform, TextInput } from "react-native"

const inputVariants = cva("", {
  variants: {
    size: {
      xs: "h-8 px-2 py-1 text-sm",
      sm: "h-9 px-2.5 py-1 text-sm",
      default: "h-10 px-3 py-1 text-base",
      lg: "h-11 px-3.5 py-2 text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

type InputProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> &
  VariantProps<typeof inputVariants>

const inputHitSlop = {
  xs: 6,
  sm: 4,
  default: 2,
  lg: 0,
} as const

function Input({ className, size, hitSlop, ...props }: InputProps) {
  const resolvedSize = size ?? "default"

  return (
    <TextInput
      className={cn(
        "dark:bg-input/30 border-input bg-background text-foreground flex w-full min-w-0 flex-row items-center rounded-md border leading-5 shadow-sm shadow-black/5",
        inputVariants({ size: resolvedSize }),
        props.editable === false &&
          cn(
            "opacity-50",
            Platform.select({ web: "disabled:pointer-events-none disabled:cursor-not-allowed" })
          ),
        Platform.select({
          web: cn(
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          ),
          native: "placeholder:text-muted-foreground/50",
        }),
        className
      )}
      hitSlop={hitSlop ?? inputHitSlop[resolvedSize]}
      {...props}
    />
  )
}

export { Input, inputVariants }
export type { InputProps }
