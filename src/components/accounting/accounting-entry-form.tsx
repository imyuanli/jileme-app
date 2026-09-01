import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useNavigation } from "expo-router"
import { type NavigationAction, usePreventRemove } from "expo-router/react-navigation"
import { useEffect, useRef, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, useColorScheme, View, } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { AccountingCategoryIcon } from "@/components/accounting/accounting-category-icon"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
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

type AccountingEntryFormProps = {
  initialLedgerIds?: string[]
  initialTransaction?: AccountingTransaction | null
  lockedLedgerId?: string
  onCompleted?: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function haveSameLedgerIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false

  const rightIds = new Set(right)
  return left.every((ledgerId) => rightIds.has(ledgerId))
}

function formatEntryDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  const todayKey = getTodayDateKey()
  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`

  if (dateKey === todayKey) return `今天${dateLabel}`

  const today = parseDateKey(todayKey)
  return date.getFullYear() === today.getFullYear()
    ? dateLabel
    : `${date.getFullYear()}年${dateLabel}`
}

const ENTRY_CATEGORY_CODES: Record<AccountingType, string[]> = {
  expense: [
    "food",
    "transport",
    "cash_gift",
    "housing",
    "entertainment",
    "medical",
    "communication",
    "shopping",
    "study",
  ],
  income: ["salary", "part_time", "investment", "cash_gift", "other"],
}

const ENTRY_CATEGORY_LABELS: Record<string, string> = {
  food: "餐饮",
  transport: "出行",
  cash_gift: "红包",
  housing: "房租房贷",
  entertainment: "休闲娱乐",
  medical: "医疗保健",
  communication: "充值缴费",
  shopping: "购物",
  study: "文体教育",
}

export function AccountingEntryForm({
  initialLedgerIds = [],
  initialTransaction = null,
  lockedLedgerId,
  onCompleted,
}: AccountingEntryFormProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { mutate } = useSWRConfig()
  const [initialValues] = useState(() => {
    const initialType = initialTransaction?.type ?? "expense"
    const transactionLedgerIds =
      initialTransaction?.ledgerAssignments.map((ledger) => ledger.id) ?? []
    const ledgerIds = lockedLedgerId
      ? initialTransaction
        ? [...new Set([...transactionLedgerIds, lockedLedgerId])]
        : [lockedLedgerId]
      : initialTransaction
        ? transactionLedgerIds
        : [...initialLedgerIds]

    return {
      type: initialType,
      amount: initialTransaction ? (initialTransaction.amountCents / 100).toFixed(2) : "",
      category: initialTransaction?.category ?? ACCOUNTING_CATEGORIES[initialType][0].code,
      note: initialTransaction?.note ?? "",
      occurredOn: initialTransaction?.occurredOn ?? getTodayDateKey(),
      ledgerIds,
    }
  })
  const [transaction] = useState<AccountingTransaction | null>(initialTransaction)
  const [type, setType] = useState<AccountingType>(initialValues.type)
  const [amount, setAmount] = useState(initialValues.amount)
  const [category, setCategory] = useState(initialValues.category)
  const [note, setNote] = useState(initialValues.note)
  const [occurredOn, setOccurredOn] = useState(initialValues.occurredOn)
  const [draftOccurredOn, setDraftOccurredOn] = useState(initialValues.occurredOn)
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>(initialValues.ledgerIds)
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [canLeave, setCanLeave] = useState(false)
  const datePickerSheetRef = useRef<BottomSheetModal>(null)
  const ledgerPickerSheetRef = useRef<BottomSheetModal>(null)
  const pendingNavigationActionRef = useRef<NavigationAction | null>(null)
  const didCompleteRef = useRef(false)

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
  const isDirty =
    type !== initialValues.type ||
    amount !== initialValues.amount ||
    category !== initialValues.category ||
    note !== initialValues.note ||
    occurredOn !== initialValues.occurredOn ||
    !haveSameLedgerIds(selectedLedgerIds, initialValues.ledgerIds)
  const writableLedgers = ledgerOptions?.filter((ledger) => ledger.writable) ?? []
  const lockedLedger = lockedLedgerId
    ? writableLedgers.find((ledger) => ledger.id === lockedLedgerId)
    : undefined
  const ledgerSelectionUnavailable = Boolean(lockedLedgerId && ledgerOptions && !lockedLedger)
  const visibleCategories = showAllCategories
    ? ACCOUNTING_CATEGORIES[type]
    : ENTRY_CATEGORY_CODES[type]
        .map((code) => ACCOUNTING_CATEGORIES[type].find((item) => item.code === code))
        .filter((item): item is (typeof ACCOUNTING_CATEGORIES)[AccountingType][number] =>
          Boolean(item)
        )

  usePreventRemove(isDirty && !canLeave, ({ data }) => {
    if (isBusy) {
      Alert.alert("请稍候", "当前操作完成后会自动返回。")
      return
    }

    Alert.alert(transaction ? "放弃这次修改？" : "放弃这次记账？", "当前填写的内容还没有保存。", [
      { text: "继续填写", style: "cancel" },
      {
        text: "放弃",
        style: "destructive",
        onPress: () => {
          pendingNavigationActionRef.current = data.action
          setCanLeave(true)
        },
      },
    ])
  })

  useEffect(() => {
    if (!canLeave) return

    const pendingAction = pendingNavigationActionRef.current
    if (pendingAction) {
      pendingNavigationActionRef.current = null
      navigation.dispatch(pendingAction)
      return
    }

    if (!didCompleteRef.current) {
      didCompleteRef.current = true
      onCompleted?.()
    }
  }, [canLeave, navigation, onCompleted])

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
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?"),
        undefined,
        { revalidate: true }
      ),
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/detail?"),
        undefined,
        { revalidate: true }
      ),
    ])
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

  function selectType(nextType: AccountingType) {
    setType(nextType)
    setCategory(ACCOUNTING_CATEGORIES[nextType][0].code)
    setShowAllCategories(false)
    setErrorMessage(null)
  }

  function resetEntry() {
    setAmount("")
    setCategory(ACCOUNTING_CATEGORIES[type][0].code)
    setNote("")
    setOccurredOn(getTodayDateKey())
    setDraftOccurredOn(getTodayDateKey())
    setSelectedLedgerIds(initialValues.ledgerIds)
    setErrorMessage(null)
  }

  function openDatePicker() {
    if (Platform.OS === "android") {
      setShowAndroidDatePicker(true)
      return
    }

    setDraftOccurredOn(occurredOn)
    datePickerSheetRef.current?.present()
  }

  function confirmDateSelection() {
    setOccurredOn(draftOccurredOn)
    datePickerSheetRef.current?.dismiss()
  }

  function toggleLedger(ledgerId: string) {
    if (lockedLedgerId) return

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
      setCanLeave(true)
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
      setCanLeave(true)
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
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-6"
      >
        <View className="bg-background px-5 pb-6 pt-5">
          <Text className="text-muted-foreground text-base">交易金额</Text>
          <View className="flex-row items-center pt-3">
            <Text className="mr-5 text-5xl font-medium leading-[72px]">¥</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              inputMode="decimal"
              keyboardType="decimal-pad"
              placeholder="0.00"
              size="lg"
              maxLength={12}
              editable={!isBusy}
              accessibilityLabel="交易金额"
              className="h-[72px] flex-1 border-0 bg-transparent p-0 text-5xl font-medium leading-[72px] shadow-none"
              style={{
                backgroundColor: "transparent",
                borderWidth: 0,
                paddingHorizontal: 0,
                shadowOpacity: 0,
              }}
            />
          </View>
        </View>

        <View className="bg-muted/30 px-5 py-5">
          <View className="flex-row gap-2">
            {(["expense", "income"] as const).map((entryType) => {
              const selected = type === entryType

              return (
                <Pressable
                  key={entryType}
                  className={cn(
                    "min-w-24 items-center rounded-full px-7 py-3",
                    selected ? "bg-primary" : "bg-background",
                    isBusy && "opacity-50"
                  )}
                  onPress={() => selectType(entryType)}
                  disabled={isBusy}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: isBusy }}
                  accessibilityLabel={entryType === "expense" ? "支出" : "收入"}
                >
                  <Text
                    className={cn(
                      "text-base",
                      selected ? "text-primary-foreground font-medium" : "text-foreground"
                    )}
                  >
                    {entryType === "expense" ? "支出" : "收入"}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View className="mt-6 flex-row flex-wrap justify-between gap-y-5">
            {visibleCategories.map((item) => {
              const selected = category === item.code
              const label = ENTRY_CATEGORY_LABELS[item.code] ?? item.label

              return (
                <Pressable
                  key={item.code}
                  className={cn("w-[18%] items-center gap-2", isBusy && "opacity-50")}
                  onPress={() => setCategory(item.code)}
                  disabled={isBusy}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: isBusy }}
                  accessibilityLabel={`${label}分类`}
                >
                  <View
                    className={cn(
                      "bg-background h-12 w-12 items-center justify-center rounded-full",
                      selected && "bg-primary"
                    )}
                  >
                    <AccountingCategoryIcon
                      category={item.code}
                      type={type}
                      size={23}
                      color={
                        selected
                          ? THEME[colorScheme].primaryForeground
                          : THEME[colorScheme].foreground
                      }
                    />
                  </View>
                  <Text className="text-center text-xs" numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
            {!showAllCategories ? (
              <Pressable
                className="w-[18%] items-center gap-2"
                onPress={() => setShowAllCategories(true)}
                accessibilityRole="button"
                accessibilityLabel="查看更多分类"
              >
                <View className="bg-background h-12 w-12 items-center justify-center rounded-full">
                  <AppSymbol name={{ ios: "ellipsis", android: "more_horiz" }} size={23} />
                </View>
                <Text className="text-center text-xs">更多</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="gap-7 px-5 py-6">
          <View>
            <Text className="mb-3 text-base">备注</Text>
            <View className="border-border flex-row items-center border-b pb-2">
              <Input
                value={note}
                onChangeText={setNote}
                placeholder="记录点什么…"
                maxLength={200}
                editable={!isBusy}
                accessibilityLabel="账单备注"
                className="h-11 flex-1 border-0 bg-transparent px-0 shadow-none"
                style={{
                  backgroundColor: "transparent",
                  borderWidth: 0,
                  paddingHorizontal: 0,
                  shadowOpacity: 0,
                }}
              />
              <AppSymbol name={{ ios: "camera", android: "photo_camera" }} size={23} />
            </View>
          </View>

          <View className="bg-muted/30 -mx-5 flex-row flex-wrap gap-3 px-5 py-4">
            <Pressable
              className={cn(
                "bg-background h-11 items-center justify-center rounded-full px-5",
                isBusy && "opacity-50"
              )}
              onPress={openDatePicker}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`选择记账日期，当前为${formatEntryDateLabel(occurredOn)}`}
            >
              <Text className="text-primary">{formatEntryDateLabel(occurredOn)}</Text>
            </Pressable>
            <Pressable
              className={cn(
                "bg-background h-11 items-center justify-center rounded-full px-5",
                (isBusy || Boolean(lockedLedgerId)) && "opacity-50"
              )}
              onPress={() => ledgerPickerSheetRef.current?.present()}
              disabled={isBusy || Boolean(lockedLedgerId)}
              accessibilityRole="button"
              accessibilityLabel="选择账本"
            >
              <Text className="text-primary">
                {lockedLedgerId
                  ? (lockedLedger?.name ?? "账本不可用")
                  : `已选择${selectedLedgerIds.length}个账本`}
              </Text>
            </Pressable>
          </View>

          {showAndroidDatePicker ? (
            <DateTimePicker
              value={parseDateKey(occurredOn)}
              onValueChange={(_, date) => {
                setOccurredOn(formatDateKey(date))
                setShowAndroidDatePicker(false)
              }}
              onDismiss={() => setShowAndroidDatePicker(false)}
              mode="date"
              display="default"
              locale="zh-CN"
              positiveButton={{ label: "确定" }}
              negativeButton={{ label: "取消" }}
            />
          ) : null}

          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={datePickerSheetRef}
        enablePanDownToClose
        snapPoints={[330]}
        backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
        onDismiss={() => setDraftOccurredOn(occurredOn)}
      >
        <BottomSheetView>
          <View className="pb-2 pt-1">
            <View className="flex-row items-center justify-between px-5">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => datePickerSheetRef.current?.dismiss()}
                accessibilityLabel="取消选择日期"
              >
                <Text className="text-primary">取消</Text>
              </Button>
              <Text className="text-lg font-semibold">选择日期</Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={confirmDateSelection}
                accessibilityLabel="确定选择日期"
              >
                <Text className="text-primary">确定</Text>
              </Button>
            </View>
            <View className="items-center justify-center overflow-hidden">
              <DateTimePicker
                value={parseDateKey(draftOccurredOn)}
                onValueChange={(_, date) => setDraftOccurredOn(formatDateKey(date))}
                mode="date"
                display="spinner"
                locale="zh-CN"
                disabled={isBusy}
                accentColor={THEME[colorScheme].primary}
                themeVariant={colorScheme}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {!lockedLedgerId ? (
        <BottomSheetModal
          ref={ledgerPickerSheetRef}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
        >
          <BottomSheetView>
            <View className="pb-8 pt-1">
              <View className="flex-row items-center justify-between px-5 pb-3">
                <View className="w-16" />
                <Text className="text-lg font-semibold">选择账本</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => ledgerPickerSheetRef.current?.dismiss()}
                  accessibilityLabel="完成账本选择"
                >
                  <Text className="text-primary">确定</Text>
                </Button>
              </View>

              {ledgerOptionsLoading ? (
                <View className="min-h-20 flex-row items-center justify-center gap-3 px-5">
                  <Spinner />
                  <Text className="text-muted-foreground text-sm">正在读取账本...</Text>
                </View>
              ) : ledgerError ? (
                <View className="items-center gap-3 px-5 py-5">
                  <Text className="text-destructive text-sm">
                    {getErrorMessage(ledgerError, "账本读取失败")}
                  </Text>
                  <Button variant="outline" size="sm" onPress={() => void mutateLedgers()}>
                    <Text>重新读取</Text>
                  </Button>
                </View>
              ) : writableLedgers.length === 0 ? (
                <View className="min-h-20 justify-center px-5">
                  <Text className="text-muted-foreground text-center text-sm">
                    还没有可加入的账本，这笔账会保留在个人明细里。
                  </Text>
                </View>
              ) : (
                writableLedgers.map((ledger, index) => {
                  const selected = selectedLedgerIds.includes(ledger.id)

                  return (
                    <Pressable
                      key={ledger.id}
                      className={cn(
                        "border-border min-h-16 flex-row items-center gap-3 border-t px-5",
                        index === writableLedgers.length - 1 && "border-b",
                        isBusy && "opacity-50"
                      )}
                      onPress={() => toggleLedger(ledger.id)}
                      disabled={isBusy}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected, disabled: isBusy }}
                      accessibilityLabel={ledger.name}
                    >
                      <Text className="min-w-0 flex-1 text-base" numberOfLines={1}>
                        {ledger.name}
                      </Text>
                      <AppSymbol
                        name={{
                          ios: selected ? "checkmark.circle.fill" : "circle",
                          android: selected ? "check_circle" : "radio_button_unchecked",
                        }}
                        size={24}
                        tone={selected ? "primary" : "mutedForeground"}
                      />
                    </Pressable>
                  )
                })
              )}
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      ) : null}

      <View
        className="border-border bg-background flex-row items-center gap-4 border-t px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
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
        {!transaction ? (
          <Pressable
            className="h-11 w-28 items-start justify-center"
            onPress={resetEntry}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="再记一笔"
          >
            <Text className="text-muted-foreground text-base">再记一笔</Text>
          </Pressable>
        ) : null}
        <Button
          size="lg"
          className="bg-primary flex-1 rounded-full"
          onPress={() => void handleSave()}
          disabled={isBusy || ledgerSelectionUnavailable}
          accessibilityLabel={transaction ? "保存账单修改" : "保存账单"}
        >
          {isSaving ? <Spinner tone="primaryForeground" /> : null}
          <Text className="text-primary-foreground">
            {isSaving ? "保存中" : transaction ? "保存修改" : "确定添加"}
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}
