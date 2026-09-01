import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { Alert, Pressable, SectionList, useColorScheme, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { AccountingCategoryIcon } from "@/components/accounting/accounting-category-icon"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getAccountingCategoryLabel } from "@/lib/constants/accounting"
import {
  formatAccountingDateTitle,
  formatMonthTitle,
  getCurrentMonthKey,
  moveMonthKey,
} from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { AccountingPeriod } from "@/types/accounting"
import type {
  AccountingLedgerDetail,
  AccountingLedgerTransaction,
  RemoveLedgerMemberRequest,
  RemoveLedgerMemberResponse,
  RemoveLedgerTransactionRequest,
  RemoveLedgerTransactionResponse,
} from "@/types/accounting-ledgers"

type TransactionSection = {
  title: string
  dailyExpenseCents: number
  data: AccountingLedgerTransaction[]
}

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const budgetLabels: Record<AccountingPeriod, string> = {
  day: "今日预算",
  week: "本周预算",
  month: "本月预算",
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function LedgerDetailSkeleton() {
  return (
    <View
      className="gap-5 px-4 py-4"
      accessibilityRole="progressbar"
      accessibilityLabel="正在读取账本详情"
    >
      <View className="flex-row gap-2">
        <Skeleton className="h-16 flex-1 rounded-2xl" />
        <Skeleton className="h-16 flex-1 rounded-2xl" />
        <Skeleton className="h-16 flex-1 rounded-2xl" />
      </View>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </View>
  )
}

export default function AccountingLedgerDetailScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const ledgerId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { mutate: mutateCache } = useSWRConfig()
  const [month, setMonth] = useState(getCurrentMonthKey)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const detailKey = ledgerId
    ? `/api/accounting/ledgers/detail?ledgerId=${ledgerId}&month=${month}`
    : null
  const { data, error, isLoading, isValidating, mutate } = useSWR<AccountingLedgerDetail>(
    detailKey,
    fetcher.get,
    {
      shouldRetryOnError: (requestError) =>
        !(requestError instanceof RequestError && requestError.isAuthError),
    }
  )
  const { trigger: removeTransaction, isMutating: isRemoving } = useSWRMutation<
    RemoveLedgerTransactionResponse,
    RequestError,
    string,
    RemoveLedgerTransactionRequest
  >("/api/accounting/ledgers/transactions/remove", fetcher.post)
  const { trigger: exitLedger, isMutating: isExiting } = useSWRMutation<
    RemoveLedgerMemberResponse,
    RequestError,
    string,
    RemoveLedgerMemberRequest
  >("/api/accounting/ledgers/members/remove", fetcher.post)

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  const sections = useMemo<TransactionSection[]>(() => {
    const groups = new Map<string, AccountingLedgerTransaction[]>()

    for (const transaction of data?.transactions ?? []) {
      const transactions = groups.get(transaction.occurredOn) ?? []
      transactions.push(transaction)
      groups.set(transaction.occurredOn, transactions)
    }

    return [...groups.entries()].map(([title, transactions]) => ({
      title,
      dailyExpenseCents: transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amountCents, 0),
      data: transactions,
    }))
  }, [data?.transactions])

  async function refreshRelatedData() {
    await Promise.allSettled([
      mutate(),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?")
      ),
      mutateCache((key) => typeof key === "string" && key.startsWith("/api/accounting/overview?")),
    ])
  }

  async function handleRemove(transactionId: string) {
    if (!ledgerId) return
    setRemovingId(transactionId)
    try {
      await removeTransaction({ ledgerId, transactionId })
      await refreshRelatedData()
    } catch (removeError) {
      if (removeError instanceof RequestError && removeError.isAuthError) {
        await mutateCache("/api/me")
      }
      Alert.alert("暂时无法移出", getErrorMessage(removeError, "请稍后再试"))
    } finally {
      setRemovingId(null)
    }
  }

  function confirmRemove(transaction: AccountingLedgerTransaction) {
    Alert.alert(
      "从账本移除这笔账？",
      `只会移除与“${data?.name ?? "当前账本"}”的关联，原始账单仍然保留。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认移出",
          style: "destructive",
          onPress: () => void handleRemove(transaction.id),
        },
      ]
    )
  }

  async function handleExit() {
    if (!ledgerId) return
    try {
      await exitLedger({ ledgerId })
      await Promise.allSettled([
        mutateCache(
          (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?")
        ),
        mutateCache("/api/accounting/ledgers/options"),
        mutateCache(
          (key) => typeof key === "string" && key.startsWith("/api/accounting/overview?")
        ),
      ])
      router.replace("/accounting/ledgers")
    } catch (exitError) {
      if (exitError instanceof RequestError && exitError.isAuthError) {
        await mutateCache("/api/me")
      }
      Alert.alert("暂时无法退出", getErrorMessage(exitError, "请稍后再试"))
    }
  }

  function confirmExit() {
    Alert.alert(
      `退出“${data?.name ?? "当前账本"}”？`,
      "退出后将无法继续查看这个账本；你创建的原始账单仍然保留。",
      [
        { text: "取消", style: "cancel" },
        { text: "确认退出", style: "destructive", onPress: () => void handleExit() },
      ]
    )
  }

  const listHeader = data ? (
    <View className="gap-5 pb-5 pt-3">
      <View className="flex-row gap-2">
        {[
          { label: "结余", value: data.incomeCents - data.expenseCents, primary: false },
          { label: "支出", value: data.expenseCents, primary: false },
          { label: "收入", value: data.incomeCents, primary: true },
        ].map((item) => (
          <View key={item.label} className="bg-card min-w-0 flex-1 gap-1 rounded-2xl p-3">
            <Text className="text-muted-foreground text-xs">{item.label}</Text>
            <Text
              className={cn("text-sm font-semibold tabular-nums", item.primary && "text-primary")}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {money.format(item.value / 100)}
            </Text>
          </View>
        ))}
      </View>

      {data.budget ? (
        <View className="border-border bg-card gap-3 rounded-2xl border p-4">
          <View className="flex-row justify-between gap-3">
            <Text className="font-medium">{budgetLabels[data.budget.period]}</Text>
            <Text className="text-muted-foreground text-xs tabular-nums">
              {money.format(data.budget.spentCents / 100)} /{" "}
              {money.format(data.budget.amountCents / 100)}
            </Text>
          </View>
          <Progress
            value={Math.min(100, (data.budget.spentCents / data.budget.amountCents) * 100)}
            indicatorClassName={
              data.budget.spentCents > data.budget.amountCents ? "bg-destructive" : "bg-primary"
            }
          />
        </View>
      ) : null}

      <View className="flex-row items-center justify-between gap-3 pt-1">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-lg font-semibold">账本明细</Text>
        </View>
        <View className="flex-row gap-2">
          {data.role === "editor" ? (
            <Button variant="outline" size="sm" onPress={confirmExit} disabled={isExiting}>
              {isExiting ? <Spinner /> : null}
              <Text>{isExiting ? "退出中" : "退出"}</Text>
            </Button>
          ) : null}
          <Button
            size="sm"
            onPress={() =>
              router.push({ pathname: "/accounting/entry", params: { ledgerId: data.id } })
            }
          >
            <Text>记一笔</Text>
          </Button>
        </View>
      </View>
    </View>
  ) : null

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          title: data?.name ?? "账本详情",
          headerRight: () => (
            <View className="flex-row items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onPress={() => setMonth((current) => moveMonthKey(current, -1))}
                accessibilityLabel="查看上个月"
              >
                <AppSymbol name={{ ios: "chevron.left", android: "chevron_left" }} size={15} />
              </Button>
              <Text className="text-xs font-semibold tabular-nums">{formatMonthTitle(month)}</Text>
              <Button
                variant="ghost"
                size="icon-xs"
                onPress={() => setMonth((current) => moveMonthKey(current, 1))}
                accessibilityLabel="查看下个月"
              >
                <AppSymbol name={{ ios: "chevron.right", android: "chevron_right" }} size={15} />
              </Button>
              {data?.role === "owner" ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onPress={() =>
                    router.push({
                      pathname: "/accounting/ledgers/[id]/settings",
                      params: { id: data.id },
                    })
                  }
                  accessibilityLabel="打开账本设置"
                >
                  <AppSymbol name={{ ios: "ellipsis.circle", android: "more_vert" }} size={19} />
                </Button>
              ) : null}
            </View>
          ),
        }}
      />
      <SectionList<AccountingLedgerTransaction, TransactionSection>
        sections={sections}
        keyExtractor={(transaction) => transaction.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-2 px-4 pb-8"
        stickySectionHeadersEnabled
        refreshing={Boolean(data) && isValidating}
        onRefresh={() => void mutate()}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <LedgerDetailSkeleton />
          ) : error || !data ? (
            <Empty className="min-h-80">
              <EmptyTitle>账本暂时没有打开</EmptyTitle>
              <EmptyDescription className="text-destructive">
                {getErrorMessage(error, "账本暂时没有打开")}
              </EmptyDescription>
              <Button variant="outline" onPress={() => void mutate()} disabled={isValidating}>
                {isValidating ? <Spinner tone="mutedForeground" /> : null}
                <Text>{isValidating ? "读取中" : "重新尝试"}</Text>
              </Button>
            </Empty>
          ) : (
            <Empty className="min-h-64">
              <EmptyMedia>
                <AppSymbol name={{ ios: "yensign.circle", android: "payments" }} size={24} />
              </EmptyMedia>
              <EmptyTitle>这个月还没有账单</EmptyTitle>
              <Button
                onPress={() =>
                  router.push({ pathname: "/accounting/entry", params: { ledgerId: data.id } })
                }
              >
                <Text>记下第一笔</Text>
              </Button>
            </Empty>
          )
        }
        renderSectionHeader={({ section }) => (
          <View className="bg-background flex-row items-baseline justify-between gap-3 py-3">
            <Text className="font-medium">{formatAccountingDateTitle(section.title)}</Text>
            <Text className="text-muted-foreground text-xs tabular-nums">
              支出 {money.format(section.dailyExpenseCents / 100)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const income = item.type === "income"
          const categoryLabel = getAccountingCategoryLabel(item.type, item.category)

          return (
            <Pressable
              className={cn(
                "border-border bg-card rounded-2xl border",
                item.createdByCurrentUser && "active:opacity-80"
              )}
              onPress={
                item.createdByCurrentUser && data
                  ? () =>
                      router.push({
                        pathname: "/accounting/entry",
                        params: { ledgerId: data.id, transactionId: item.id, month },
                      })
                  : undefined
              }
              disabled={!item.createdByCurrentUser}
              accessibilityRole={item.createdByCurrentUser ? "button" : undefined}
              accessibilityLabel={
                item.createdByCurrentUser ? `编辑${item.note || categoryLabel}账单` : undefined
              }
            >
              <Item>
                <ItemMedia>
                  <AccountingCategoryIcon
                    category={item.category}
                    type={item.type}
                    size={19}
                    color={income ? THEME[colorScheme].primary : THEME[colorScheme].foreground}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{categoryLabel}</ItemTitle>
                  <ItemDescription>
                    {item.note || (item.createdByCurrentUser ? "由我记录" : "成员记录")}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Text
                    className={cn("text-sm font-medium tabular-nums", income && "text-primary")}
                  >
                    {income ? "+" : "-"}
                    {money.format(item.amountCents / 100)}
                  </Text>
                  {item.canRemoveFromLedger ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onPress={(event) => {
                        event.stopPropagation()
                        confirmRemove(item)
                      }}
                      disabled={isRemoving}
                      accessibilityLabel="从账本移出这笔账"
                    >
                      {removingId === item.id ? (
                        <Spinner />
                      ) : (
                        <AppSymbol name={{ ios: "minus.circle", android: "remove_circle" }} />
                      )}
                    </Button>
                  ) : null}
                </ItemActions>
              </Item>
            </Pressable>
          )
        }}
      />
    </View>
  )
}
