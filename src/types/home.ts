import type { AccountingType } from "@/types/accounting"

export type HomeSlot = "focus" | "records"

export type HomeModuleId =
  "accounting" | "diary" | "mood" | "essay" | "habit" | "schedule" | "goals" | "notes"

type HomeBlockBase = {
  id: string
  moduleId: HomeModuleId
  slot: HomeSlot
  order: number
}

export type AccountingHomeTransaction = {
  id: string
  type: AccountingType
  amountCents: number
  category: string
  note: string
}

export type AccountingHomeBlock = HomeBlockBase & {
  kind: "accounting-summary"
  moduleId: "accounting"
  slot: "records"
  incomeCents: number
  expenseCents: number
  transactionCount: number
  transactions: AccountingHomeTransaction[]
}

export type HomeModuleErrorBlock = HomeBlockBase & {
  kind: "module-error"
  label: string
  message: string
}

export type HomeBlock = AccountingHomeBlock | HomeModuleErrorBlock

export type HomeDayData = {
  dateKey: string
  blocks: HomeBlock[]
}
