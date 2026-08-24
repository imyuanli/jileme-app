export type AccountingLedgerRole = "owner" | "editor"

export type AccountingLedgerOption = {
  id: string
  name: string
  role: AccountingLedgerRole
  writable: boolean
  isQuickDefault: boolean
}
