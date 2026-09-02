import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { View } from "react-native"
import useSWR, { useSWRConfig } from "swr"

import { AccountingEntryForm } from "@/components/accounting/accounting-entry-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Text } from "@/components/ui/text"
import { getCurrentMonthKey } from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import type { AccountingOverview, AccountingTransaction } from "@/types/accounting"
import type { AccountingLedgerDetail } from "@/types/accounting-ledgers"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function EntryPageSkeleton() {
  return (
    <View className="gap-4 p-4" accessibilityRole="progressbar" accessibilityLabel="正在读取账单">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-2xl" />
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-[23%] rounded-xl" />
        ))}
      </View>
      <Skeleton className="h-24 w-full rounded-2xl" />
    </View>
  )
}

export default function AccountingEntryScreen() {
  const params = useLocalSearchParams<{
    ledgerId?: string | string[]
    transactionId?: string | string[]
    month?: string | string[]
  }>()
  const ledgerId = Array.isArray(params.ledgerId) ? params.ledgerId[0] : params.ledgerId
  const transactionId = Array.isArray(params.transactionId)
    ? params.transactionId[0]
    : params.transactionId
  const monthParam = Array.isArray(params.month) ? params.month[0] : params.month
  const month = monthParam || getCurrentMonthKey()
  const router = useRouter()
  const { mutate: mutateCache } = useSWRConfig()
  const isEditing = Boolean(transactionId)
  const detailKey =
    ledgerId && transactionId
      ? `/api/accounting/ledgers/detail?ledgerId=${ledgerId}&month=${month}`
      : null
  const overviewKey = !ledgerId && transactionId ? `/api/accounting/overview?month=${month}` : null
  const {
    data: ledgerDetail,
    error: ledgerDetailError,
    isLoading: isLedgerDetailLoading,
    isValidating: isLedgerDetailValidating,
    mutate: mutateLedgerDetail,
  } = useSWR<AccountingLedgerDetail>(detailKey, fetcher.get, {
    shouldRetryOnError: (error) => !(error instanceof RequestError && error.isAuthError),
  })
  const {
    data: overview,
    error: overviewError,
    isLoading: isOverviewLoading,
    isValidating: isOverviewValidating,
    mutate: mutateOverview,
  } = useSWR<AccountingOverview>(overviewKey, fetcher.get, {
    shouldRetryOnError: (error) => !(error instanceof RequestError && error.isAuthError),
  })

  useEffect(() => {
    const error = ledgerDetailError ?? overviewError
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [ledgerDetailError, mutateCache, overviewError])

  const transaction: AccountingTransaction | null =
    ledgerDetail?.transactions.find((item) => item.id === transactionId) ??
    overview?.transactions.find((item) => item.id === transactionId) ??
    null
  const loadError = ledgerDetailError ?? overviewError
  const isRetrying = ledgerId ? isLedgerDetailValidating : isOverviewValidating
  const isResolvingTransaction =
    isEditing &&
    !loadError &&
    (ledgerId ? isLedgerDetailLoading || !ledgerDetail : isOverviewLoading || !overview)

  function retryTransaction() {
    if (ledgerId) {
      void mutateLedgerDetail()
    } else {
      void mutateOverview()
    }
  }

  if (isResolvingTransaction) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ title: "编辑账单" }} />
        <EntryPageSkeleton />
      </View>
    )
  }

  if (isEditing && (loadError || !transaction)) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 p-4">
        <Stack.Screen options={{ title: "编辑账单" }} />
        <Text className="text-destructive text-center text-sm leading-6">
          {getErrorMessage(loadError, "这笔账暂时无法打开")}
        </Text>
        <Button variant="outline" onPress={retryTransaction} disabled={isRetrying}>
          {isRetrying ? <Spinner tone="mutedForeground" /> : null}
          <Text>{isRetrying ? "读取中" : "重新尝试"}</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: isEditing ? "编辑账单" : "记一笔" }} />
      <AccountingEntryForm
        initialLedgerIds={ledgerId ? [ledgerId] : undefined}
        initialTransaction={transaction}
        lockedLedgerId={ledgerId}
        onCompleted={() => router.back()}
      />
    </View>
  )
}
