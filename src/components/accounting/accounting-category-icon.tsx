import {
  Apple,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Car,
  Cat,
  Cherry,
  Cigarette,
  CircleDollarSign,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Home,
  HousePlug,
  Laptop,
  Package,
  Palette,
  Plane,
  ReceiptText,
  Salad,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Stethoscope,
  Ticket,
  TrainFront,
  Utensils,
  WalletCards,
  Wrench,
} from "lucide-react-native"
import type { LucideIcon } from "lucide-react-native"

import { useColorScheme } from "react-native"

import { THEME } from "@/lib/theme"
import type { AccountingType } from "@/types/accounting"

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  shopping: ShoppingBag,
  daily: ReceiptText,
  transport: TrainFront,
  vegetables: Salad,
  fruit: Cherry,
  snacks: Apple,
  sports: Dumbbell,
  entertainment: Gamepad2,
  communication: Smartphone,
  clothing: Shirt,
  beauty: Sparkles,
  housing: Home,
  home: HousePlug,
  children: Baby,
  elders: HeartHandshake,
  social: HandCoins,
  travel: Plane,
  tobacco_alcohol: Cigarette,
  digital: Laptop,
  car: Car,
  medical: Stethoscope,
  books: BookOpen,
  study: GraduationCap,
  pets: Cat,
  cash_gift: WalletCards,
  gift: Gift,
  office: BriefcaseBusiness,
  repair: Wrench,
  donation: HeartHandshake,
  lottery: Ticket,
  family_friends: HandCoins,
  delivery: Package,
  salary: CircleDollarSign,
  part_time: BriefcaseBusiness,
  investment: HandCoins,
  other: Palette,
}

type AccountingCategoryIconProps = {
  category: string
  type?: AccountingType
  size?: number
  color?: string
  strokeWidth?: number
}

export function AccountingCategoryIcon({
  category,
  type,
  size = 20,
  color,
  strokeWidth = 2,
}: AccountingCategoryIconProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const Icon = type === "income" && category === "cash_gift" ? Gift : CATEGORY_ICONS[category]
  const ResolvedIcon = Icon ?? CircleDollarSign
  return (
    <ResolvedIcon
      size={size}
      color={color ?? THEME[colorScheme].foreground}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  )
}
