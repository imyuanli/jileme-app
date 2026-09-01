import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet"
import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { Alert, useColorScheme, View } from "react-native"
import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ACCOUNTING_PERIODS } from "@/lib/constants/accounting"
import { fetcher, RequestError } from "@/lib/request"
import { THEME } from "@/lib/theme"
import type {
  AccountingBudgetStatus,
  AccountingPeriod,
  DeleteAccountingBudgetResponse,
  UpdateAccountingBudgetRequest,
  UpdateAccountingBudgetResponse,
} from "@/types/accounting"
import type {
  DeleteLedgerBudgetRequest,
  DeleteLedgerBudgetResponse,
  UpdateLedgerBudgetRequest,
  UpdateLedgerBudgetResponse,
} from "@/types/accounting-ledgers"

export type AccountingBudgetSheetMethods = {
  present: (budget: AccountingBudgetStatus | null) => void
  dismiss: () => void
}

type AccountingBudgetSheetProps = {
  ledgerId?: string
  onChanged?: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export const AccountingBudgetSheet = forwardRef<
  AccountingBudgetSheetMethods,
  AccountingBudgetSheetProps
>(function AccountingBudgetSheet({ ledgerId, onChanged }, ref) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const { mutate } = useSWRConfig()
  const [budget, setBudget] = useState<AccountingBudgetStatus | null>(null)
  const [period, setPeriod] = useState<AccountingPeriod>("month")
  const [amount, setAmount] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { trigger: updateBudget, isMutating: isUpdating } = useSWRMutation<
    UpdateAccountingBudgetResponse,
    RequestError,
    string,
    UpdateAccountingBudgetRequest
  >("/api/accounting/budget/update", fetcher.post)
  const { trigger: deleteBudget, isMutating: isDeleting } = useSWRMutation<
    DeleteAccountingBudgetResponse,
    RequestError,
    string,
    undefined
  >("/api/accounting/budget/delete", fetcher.post)
  const { trigger: updateLedgerBudget, isMutating: isUpdatingLedger } = useSWRMutation<
    UpdateLedgerBudgetResponse,
    RequestError,
    string,
    UpdateLedgerBudgetRequest
  >("/api/accounting/ledgers/budget/update", fetcher.post)
  const { trigger: deleteLedgerBudget, isMutating: isDeletingLedger } = useSWRMutation<
    DeleteLedgerBudgetResponse,
    RequestError,
    string,
    DeleteLedgerBudgetRequest
  >("/api/accounting/ledgers/budget/delete", fetcher.post)

  const isBusy = isUpdating || isDeleting || isUpdatingLedger || isDeletingLedger

  async function refreshBudgetData() {
    await Promise.allSettled([
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/overview?"),
        undefined,
        { revalidate: true }
      ),
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/detail?"),
        undefined,
        { revalidate: true }
      ),
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/settings?"),
        undefined,
        { revalidate: true }
      ),
    ])
    onChanged?.()
  }

  async function refreshSessionIfNeeded(error: unknown) {
    if (error instanceof RequestError && error.isAuthError) {
      await mutate("/api/me")
    }
  }

  useImperativeHandle(ref, () => ({
    present(nextBudget) {
      setBudget(nextBudget)
      setPeriod(nextBudget?.period ?? "month")
      setAmount(nextBudget ? (nextBudget.amountCents / 100).toFixed(2) : "")
      setErrorMessage(null)
      bottomSheetRef.current?.present()
    },
    dismiss() {
      bottomSheetRef.current?.dismiss()
    },
  }))

  function validateAmount() {
    const normalizedAmount = amount.trim()
    if (!normalizedAmount) {
      throw new Error("请输入预算金额")
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      throw new Error("预算金额最多保留两位小数")
    }

    const amountCents = Math.round(Number(normalizedAmount) * 100)
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error("请输入正确的预算金额")
    }
    if (amountCents >= 100000000000) {
      throw new Error("预算金额超出可设置范围")
    }

    return amountCents
  }

  async function handleSave() {
    setErrorMessage(null)
    try {
      const amountCents = validateAmount()

      if (ledgerId) {
        await updateLedgerBudget({ ledgerId, period, amountCents })
      } else {
        await updateBudget({ period, amountCents })
      }
      await refreshBudgetData()
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      await refreshSessionIfNeeded(error)
      setErrorMessage(getErrorMessage(error, "预算保存失败，请稍后再试"))
    }
  }

  async function handleDelete() {
    setErrorMessage(null)
    try {
      if (ledgerId) {
        await deleteLedgerBudget({ ledgerId })
      } else {
        await deleteBudget()
      }
      await refreshBudgetData()
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      await refreshSessionIfNeeded(error)
      setErrorMessage(getErrorMessage(error, "预算关闭失败，请稍后再试"))
    }
  }

  function confirmDelete() {
    Alert.alert("关闭当前预算？", "已有账单不会受到影响，之后也可以重新设置。", [
      { text: "取消", style: "cancel" },
      { text: "关闭预算", style: "destructive", onPress: () => void handleDelete() },
    ])
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
      onDismiss={() => setErrorMessage(null)}
    >
      <BottomSheetView>
        <View className="gap-6 px-4 pb-10 pt-2">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xl font-semibold">{budget ? "修改预算" : "设置预算"}</Text>
              <Text className="text-muted-foreground text-sm">
                选择预算周期，随时掌握支出进度。
              </Text>
            </View>
            <Button
              variant="ghost"
              size="icon-sm"
              onPress={() => bottomSheetRef.current?.dismiss()}
              accessibilityLabel="关闭预算设置"
              disabled={isBusy}
            >
              <AppSymbol name={{ ios: "xmark", android: "close" }} size={17} />
            </Button>
          </View>

          <Field>
            <FieldLabel>预算周期</FieldLabel>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(nextPeriod) => {
                if (nextPeriod === "day" || nextPeriod === "week" || nextPeriod === "month") {
                  setPeriod(nextPeriod)
                  setErrorMessage(null)
                }
              }}
              variant="outline"
              className="w-full"
              disabled={isBusy}
            >
              {ACCOUNTING_PERIODS.map((item, index) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  isFirst={index === 0}
                  isLast={index === ACCOUNTING_PERIODS.length - 1}
                  className="flex-1"
                >
                  <Text>{item.label}</Text>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel>预算金额（元）</FieldLabel>
            <Input
              value={amount}
              onChangeText={setAmount}
              inputMode="decimal"
              keyboardType="decimal-pad"
              placeholder="0.00"
              maxLength={12}
              editable={!isBusy}
              accessibilityLabel="预算金额"
            />
            <FieldDescription>金额必须大于 0，最多保留两位小数。</FieldDescription>
          </Field>

          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

          <View className="flex-row gap-3">
            {budget ? (
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onPress={confirmDelete}
                disabled={isBusy}
                accessibilityLabel="关闭当前预算"
              >
                {isDeleting || isDeletingLedger ? <Spinner tone="primaryForeground" /> : null}
                <Text>{isDeleting || isDeletingLedger ? "关闭中" : "关闭预算"}</Text>
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1"
              onPress={() => void handleSave()}
              disabled={isBusy}
              accessibilityLabel={budget ? "保存预算修改" : "保存预算"}
            >
              {isUpdating || isUpdatingLedger ? <Spinner tone="primaryForeground" /> : null}
              <Text>
                {isUpdating || isUpdatingLedger ? "保存中" : budget ? "保存修改" : "保存"}
              </Text>
            </Button>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
})
