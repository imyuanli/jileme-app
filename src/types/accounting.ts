export type AccountingType = "expense" | "income"
export type AccountingPeriod = "day" | "week" | "month"

export type AccountingLedgerAssignment = {
  id: string
  name: string
}

export type AccountingTransaction = {
  id: string
  type: AccountingType
  amountCents: number
  category: string
  note: string
  occurredOn: string
  createdAt: string
  ledgerAssignments: AccountingLedgerAssignment[]
}

export type AccountingLedgerSelection =
  { mode: "quick-defaults" } | { mode: "explicit"; ledgerIds: string[] }

export type AccountingBudgetStatus = {
  period: AccountingPeriod
  amountCents: number
  spentCents: number
}

export type AccountingOverview = {
  month: string
  incomeCents: number
  expenseCents: number
  transactions: AccountingTransaction[]
  budget: AccountingBudgetStatus | null
}

export type CreateAccountingTransactionRequest = {
  type: AccountingType
  amountCents: number
  category: string
  note: string
  occurredOn: string
  ledgerSelection: AccountingLedgerSelection
}

export type CreateAccountingTransactionResponse = AccountingTransaction

export type UpdateAccountingTransactionRequest = Omit<
  CreateAccountingTransactionRequest,
  "ledgerSelection"
> & {
  transactionId: string
  ledgerIds: string[]
}

export type UpdateAccountingTransactionResponse = AccountingTransaction

export type DeleteAccountingTransactionRequest = {
  transactionId: string
}

export type DeleteAccountingTransactionResponse = DeleteAccountingTransactionRequest

export type UpdateAccountingBudgetRequest = {
  period: AccountingPeriod
  amountCents: number
}

export type UpdateAccountingBudgetResponse = UpdateAccountingBudgetRequest

export type DeleteAccountingBudgetResponse = {
  deleted: true
}
