import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { BottomSheetModal, BottomSheetScrollView } from "@expo/ui/community/bottom-sheet"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Alert, Platform, Pressable, useColorScheme, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ACCOUNTING_CATEGORIES, ACCOUNTING_CATEGORY_CODES } from "@/lib/constants/accounting"
import { formatDateKey, getTodayDateKey, parseDateKey } from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { AccountingLedgerOption } from "@/types/accounting-ledgers"
import type {
  AccountingTransaction,
  AccountingType,
  CreateAccountingTransactionRequest,
  CreateAccountingTransactionResponse,
  DeleteAccountingTransactionRequest,
  DeleteAccountingTransactionResponse,
  UpdateAccountingTransactionRequest,
  UpdateAccountingTransactionResponse,
} from "@/types/accounting"

export type AccountingEntrySheetMethods = {
  present: (transaction?: AccountingTransaction) => void
  dismiss: () => void
}

type AccountingEntrySheetProps = {
  onChanged?: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export const AccountingEntrySheet = forwardRef<
  AccountingEntrySheetMethods,
  AccountingEntrySheetProps
>(function AccountingEntrySheet({ onChanged }, ref) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const { mutate } = useSWRConfig()
  const [transaction, setTransaction] = useState<AccountingTransaction | null>(null)
  const [type, setType] = useState<AccountingType>("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(ACCOUNTING_CATEGORIES.expense[0].code)
  const [note, setNote] = useState("")
  const [occurredOn, setOccurredOn] = useState(getTodayDateKey)
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([])
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: ledgerOptions,
    error: ledgerError,
    isLoading: ledgerOptionsLoading,
    mutate: mutateLedgers,
  } = useSWR<AccountingLedgerOption[]>("/api/accounting/ledgers/options", fetcher.get, {
    shouldRetryOnError: (error) => !(error instanceof RequestError && error.isAuthError),
  })

  const { trigger: createTransaction, isMutating: isCreating } = useSWRMutation<
    CreateAccountingTransactionResponse,
    RequestError,
    string,
    CreateAccountingTransactionRequest
  >("/api/accounting/transactions/create", fetcher.post)
  const { trigger: updateTransaction, isMutating: isUpdating } = useSWRMutation<
    UpdateAccountingTransactionResponse,
    RequestError,
    string,
    UpdateAccountingTransactionRequest
  >("/api/accounting/transactions/update", fetcher.post)
  const { trigger: deleteTransaction, isMutating: isDeleting } = useSWRMutation<
    DeleteAccountingTransactionResponse,
    RequestError,
    string,
    DeleteAccountingTransactionRequest
  >("/api/accounting/transactions/delete", fetcher.post)

  const isSaving = isCreating || isUpdating
  const isBusy = isSaving || isDeleting
  const writableLedgers = ledgerOptions?.filter((ledger) => ledger.writable) ?? []

  async function refreshAccountingData() {
    await Promise.allSettled([
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/overview?"),
        undefined,
        { revalidate: true }
      ),
      mutate((key) => typeof key === "string" && key.startsWith("/api/home/day?"), undefined, {
        revalidate: true,
      }),
    ])
    onChanged?.()
  }

  async function refreshSessionIfNeeded(error: unknown) {
    if (error instanceof RequestError && error.isAuthError) {
      await mutate("/api/me")
    }
  }

  useEffect(() => {
    if (ledgerError instanceof RequestError && ledgerError.isAuthError) {
      void mutate("/api/me")
    }
  }, [ledgerError, mutate])

  function resetForm(nextTransaction: AccountingTransaction | null) {
    const nextType = nextTransaction?.type ?? "expense"

    setTransaction(nextTransaction)
    setType(nextType)
    setAmount(nextTransaction ? (nextTransaction.amountCents / 100).toFixed(2) : "")
    setCategory(nextTransaction?.category ?? ACCOUNTING_CATEGORIES[nextType][0].code)
    setNote(nextTransaction?.note ?? "")
    setOccurredOn(nextTransaction?.occurredOn ?? getTodayDateKey())
    setSelectedLedgerIds(nextTransaction?.ledgerAssignments.map((ledger) => ledger.id) ?? [])
    setShowAndroidDatePicker(false)
    setErrorMessage(null)
  }

  useImperativeHandle(ref, () => ({
    present(nextTransaction) {
      resetForm(nextTransaction ?? null)
      bottomSheetRef.current?.present()
    },
    dismiss() {
      bottomSheetRef.current?.dismiss()
    },
  }))

  function selectType(nextType: AccountingType) {
    setType(nextType)
    setCategory(ACCOUNTING_CATEGORIES[nextType][0].code)
    setErrorMessage(null)
  }

  function toggleLedger(ledgerId: string) {
    setSelectedLedgerIds((current) =>
      current.includes(ledgerId)
        ? current.filter((currentId) => currentId !== ledgerId)
        : [...current, ledgerId]
    )
  }

  function validateInput(): CreateAccountingTransactionRequest {
    const normalizedAmount = amount.trim()
    if (!normalizedAmount) {
      throw new Error("请输入金额")
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      throw new Error("金额最多保留两位小数")
    }

    const amountCents = Math.round(Number(normalizedAmount) * 100)
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error("金额必须大于 0")
    }
    if (amountCents >= 100000000000) {
      throw new Error("金额超出可记录范围")
    }
    if (!ACCOUNTING_CATEGORY_CODES[type].has(category)) {
      throw new Error("请选择正确的收支分类")
    }

    const normalizedNote = note.trim()
    if (normalizedNote.length > 200) {
      throw new Error("备注最多 200 个字")
    }

    parseDateKey(occurredOn)

    return {
      type,
      amountCents,
      category,
      note: normalizedNote,
      occurredOn,
      ledgerSelection: { mode: "explicit", ledgerIds: selectedLedgerIds },
    }
  }

  async function handleSave() {
    setErrorMessage(null)

    try {
      const input = validateInput()

      if (transaction && input.ledgerSelection.mode === "explicit") {
        await updateTransaction({
          transactionId: transaction.id,
          type: input.type,
          amountCents: input.amountCents,
          category: input.category,
          note: input.note,
          occurredOn: input.occurredOn,
          ledgerIds: input.ledgerSelection.ledgerIds,
        })
      } else {
        await createTransaction(input)
      }

      await refreshAccountingData()
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      await refreshSessionIfNeeded(error)
      setErrorMessage(getErrorMessage(error, "保存失败，请稍后再试"))
    }
  }

  async function handleDelete() {
    if (!transaction) return

    setErrorMessage(null)
    try {
      await deleteTransaction({ transactionId: transaction.id })
      await refreshAccountingData()
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      await refreshSessionIfNeeded(error)
      setErrorMessage(getErrorMessage(error, "删除失败，请稍后再试"))
    }
  }

  function confirmDelete() {
    Alert.alert("删除这笔账？", "删除后无法恢复。", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => void handleDelete() },
    ])
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["92%"]}
      enablePanDownToClose
      keyboardBehavior="interactive"
      backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
      onDismiss={() => {
        setShowAndroidDatePicker(false)
        setErrorMessage(null)
      }}
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 px-5 pb-10 pt-2">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xl font-semibold">{transaction ? "编辑账单" : "记一笔"}</Text>
              <Text className="text-muted-foreground text-sm">
                输入金额、选择分类，备注可以留空。
              </Text>
            </View>
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={() => bottomSheetRef.current?.dismiss()}
              accessibilityLabel="关闭记账"
              disabled={isBusy}
            >
              <AppSymbol name={{ ios: "xmark", android: "close" }} size={17} />
            </Button>
          </View>

          <Field>
            <FieldLabel>金额（元）</FieldLabel>
            <Input
              value={amount}
              onChangeText={setAmount}
              inputMode="decimal"
              keyboardType="decimal-pad"
              placeholder="0.00"
              maxLength={12}
              editable={!isBusy}
              accessibilityLabel="交易金额"
            />
          </Field>

          <Field>
            <FieldLabel>收支类型</FieldLabel>
            <ToggleGroup
              type="single"
              value={type}
              onValueChange={(nextType) => {
                if (nextType === "expense" || nextType === "income") selectType(nextType)
              }}
              variant="outline"
              className="w-full"
              disabled={isBusy}
            >
              <ToggleGroupItem value="expense" isFirst className="flex-1">
                <Text>支出</Text>
              </ToggleGroupItem>
              <ToggleGroupItem value="income" isLast className="flex-1">
                <Text>收入</Text>
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel>分类</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNTING_CATEGORIES[type].map((item) => {
                const selected = category === item.code

                return (
                  <Pressable
                    key={item.code}
                    className={cn(
                      "border-border bg-background min-h-10 w-[23%] items-center justify-center rounded-xl border px-1 py-2",
                      selected && "border-primary bg-accent",
                      isBusy && "opacity-50"
                    )}
                    onPress={() => setCategory(item.code)}
                    disabled={isBusy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: isBusy }}
                    accessibilityLabel={`${item.label}分类`}
                  >
                    <Text
                      className={cn(
                        "text-center text-xs",
                        selected && "text-accent-foreground font-medium"
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Field>

          <Field>
            <FieldLabel>备注</FieldLabel>
            <Textarea
              value={note}
              onChangeText={setNote}
              placeholder="写点什么，也可以留空"
              maxLength={200}
              numberOfLines={3}
              editable={!isBusy}
              accessibilityLabel="账单备注"
            />
            <FieldDescription>{note.length}/200</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>日期</FieldLabel>
            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={parseDateKey(occurredOn)}
                onValueChange={(_, date) => setOccurredOn(formatDateKey(date))}
                mode="date"
                display="compact"
                locale="zh_CN"
                disabled={isBusy}
                accentColor={THEME[colorScheme].primary}
              />
            ) : (
              <>
                <Button
                  variant="outline"
                  onPress={() => setShowAndroidDatePicker(true)}
                  disabled={isBusy}
                  accessibilityLabel={`选择记账日期，当前为${occurredOn}`}
                >
                  <AppSymbol name={{ ios: "calendar", android: "calendar_month" }} size={17} />
                  <Text>{occurredOn}</Text>
                </Button>
                {showAndroidDatePicker ? (
                  <DateTimePicker
                    value={parseDateKey(occurredOn)}
                    onValueChange={(_, date) => {
                      setOccurredOn(formatDateKey(date))
                      setShowAndroidDatePicker(false)
                    }}
                    onDismiss={() => setShowAndroidDatePicker(false)}
                    mode="date"
                    presentation="dialog"
                    positiveButton={{ label: "确定" }}
                    negativeButton={{ label: "取消" }}
                    accentColor={THEME[colorScheme].primary}
                  />
                ) : null}
              </>
            )}
          </Field>

          <Field>
            <FieldLabel>账本</FieldLabel>
            {ledgerOptionsLoading ? (
              <View className="border-border min-h-14 flex-row items-center gap-3 rounded-2xl border px-4">
                <Spinner />
                <Text className="text-muted-foreground text-sm">正在读取账本...</Text>
              </View>
            ) : ledgerError ? (
              <View className="border-destructive/40 gap-3 rounded-2xl border p-4">
                <Text className="text-destructive text-sm">
                  {getErrorMessage(ledgerError, "账本读取失败")}
                </Text>
                <Button variant="outline" size="sm" onPress={() => void mutateLedgers()}>
                  <Text>重新读取</Text>
                </Button>
              </View>
            ) : writableLedgers.length === 0 ? (
              <View className="border-border min-h-14 flex-row items-center gap-3 rounded-2xl border border-dashed px-4">
                <AppSymbol name={{ ios: "books.vertical", android: "library_books" }} size={18} />
                <Text className="text-muted-foreground min-w-0 flex-1 text-sm leading-5">
                  还没有可加入的账本，这笔账会保留在个人明细里。
                </Text>
              </View>
            ) : (
              <View className="border-border overflow-hidden rounded-2xl border">
                {writableLedgers.map((ledger, index) => {
                  const selected = selectedLedgerIds.includes(ledger.id)

                  return (
                    <Pressable
                      key={ledger.id}
                      className={cn(
                        "min-h-12 flex-row items-center gap-3 px-4",
                        index > 0 && "border-border border-t",
                        isBusy && "opacity-50"
                      )}
                      onPress={() => toggleLedger(ledger.id)}
                      disabled={isBusy}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected, disabled: isBusy }}
                      accessibilityLabel={ledger.name}
                    >
                      <AppSymbol
                        name={{
                          ios: selected ? "checkmark.circle.fill" : "circle",
                          android: selected ? "check_circle" : "radio_button_unchecked",
                        }}
                        size={20}
                        tone={selected ? "primary" : "mutedForeground"}
                      />
                      <Text className="min-w-0 flex-1" numberOfLines={1}>
                        {ledger.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
            <FieldDescription>可同时加入多个账本；不选择时只保留在个人明细中。</FieldDescription>
          </Field>

          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

          <View className="flex-row gap-3">
            {transaction ? (
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onPress={confirmDelete}
                disabled={isBusy}
                accessibilityLabel="删除这笔账"
              >
                {isDeleting ? <Spinner tone="primaryForeground" /> : null}
                <Text>{isDeleting ? "删除中" : "删除"}</Text>
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1"
              onPress={() => void handleSave()}
              disabled={isBusy}
              accessibilityLabel={transaction ? "保存账单修改" : "保存账单"}
            >
              {isSaving ? <Spinner tone="primaryForeground" /> : null}
              <Text>{isSaving ? "保存中" : transaction ? "保存修改" : "保存"}</Text>
            </Button>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})
