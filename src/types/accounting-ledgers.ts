import type { AccountingBudgetStatus, AccountingTransaction } from "@/types/accounting"

export type AccountingLedgerRole = "owner" | "editor"
export type AccountingLedgerMemberRole = Exclude<AccountingLedgerRole, "owner">

export type AccountingLedgerSummary = {
  id: string
  name: string
  role: AccountingLedgerRole
  month: string
  incomeCents: number
  expenseCents: number
  transactionCount: number
  memberCount: number
  isQuickDefault: boolean
}

export type AccountingLedgerOption = {
  id: string
  name: string
  role: AccountingLedgerRole
  writable: boolean
  isQuickDefault: boolean
}

export type AccountingLedgerTransaction = AccountingTransaction & {
  createdByCurrentUser: boolean
  canRemoveFromLedger: boolean
}

export type AccountingLedgerMemberPreview = {
  userId: string
  displayName: string
}

export type AccountingLedgerDetail = {
  id: string
  name: string
  role: AccountingLedgerRole
  month: string
  incomeCents: number
  expenseCents: number
  memberCount: number
  members: AccountingLedgerMemberPreview[]
  isQuickDefault: boolean
  transactions: AccountingLedgerTransaction[]
  budget: AccountingBudgetStatus | null
}

export type AccountingLedgerMember = {
  userId: string
  displayName: string
  role: AccountingLedgerRole
  isCurrentUser: boolean
}

export type AccountingLedgerSettingsData = {
  ledger: Pick<AccountingLedgerDetail, "id" | "name" | "role" | "isQuickDefault">
  budget: AccountingBudgetStatus | null
  members: AccountingLedgerMember[]
  invitePath: string
}

export type CreateLedgerRequest = {
  name: string
}

export type CreateLedgerResponse = {
  ledgerId: string
  name: string
}

export type UpdateLedgerRequest = {
  ledgerId: string
  name: string
}

export type UpdateLedgerResponse = CreateLedgerResponse

export type DeleteLedgerRequest = {
  ledgerId: string
}

export type DeleteLedgerResponse = DeleteLedgerRequest

export type RemoveLedgerTransactionRequest = {
  ledgerId: string
  transactionId: string
}

export type RemoveLedgerTransactionResponse = RemoveLedgerTransactionRequest

export type UpdateLedgerBudgetRequest = {
  ledgerId: string
  period: AccountingBudgetStatus["period"]
  amountCents: number
}

export type UpdateLedgerBudgetResponse = UpdateLedgerBudgetRequest

export type DeleteLedgerBudgetRequest = {
  ledgerId: string
}

export type DeleteLedgerBudgetResponse = DeleteLedgerBudgetRequest

export type RemoveLedgerMemberRequest = {
  ledgerId: string
  userId?: string
}

export type RemoveLedgerMemberResponse = {
  ledgerId: string
  userId: string
}
