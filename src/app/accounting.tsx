import { useEffect, useMemo, useRef, useState } from "react"
import { Pressable, SectionList, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"

import {
  AccountingBudgetSheet,
  type AccountingBudgetSheetMethods,
} from "@/components/accounting/accounting-budget-sheet"
import {
  AccountingEntrySheet,
  type AccountingEntrySheetMethods,
} from "@/components/accounting/accounting-entry-sheet"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
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
import { cn } from "@/lib/utils"
import type {
  AccountingBudgetStatus,
  AccountingOverview,
  AccountingPeriod,
  AccountingTransaction,
} from "@/types/accounting"

type TransactionSection = {
  title: string
  dailyExpenseCents: number
  data: AccountingTransaction[]
}

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
})

const compactMoney = new Intl.NumberFormat("zh-CN", {
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

function getErrorMessage(error: unknown) {
  if (error instanceof RequestError && error.isAuthError) return "登录状态已失效，正在返回登录页。"
  return error instanceof Error ? error.message : "账单读取失败，请稍后再试。"
}

function MonthlySummary({ data }: { data: AccountingOverview | undefined }) {
  const balanceCents = (data?.incomeCents ?? 0) - (data?.expenseCents ?? 0)

  return (
    <View className="flex-row gap-2" accessibilityLabel="本月收支概览">
      <View className="bg-card min-w-0 flex-1 gap-1 rounded-2xl p-3">
        <Text className="text-muted-foreground text-xs">结余</Text>
        <Text className="text-sm font-semibold tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
          {compactMoney.format(balanceCents / 100)}
        </Text>
      </View>
      <View className="bg-card min-w-0 flex-1 gap-1 rounded-2xl p-3">
        <Text className="text-muted-foreground text-xs">支出</Text>
        <Text className="text-sm font-semibold tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
          {compactMoney.format((data?.expenseCents ?? 0) / 100)}
        </Text>
      </View>
      <View className="bg-card min-w-0 flex-1 gap-1 rounded-2xl p-3">
        <Text className="text-muted-foreground text-xs">收入</Text>
        <Text
          className="text-primary text-sm font-semibold tabular-nums"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {compactMoney.format((data?.incomeCents ?? 0) / 100)}
        </Text>
      </View>
    </View>
  )
}

function BudgetSummary({
  budget,
  onPress,
}: {
  budget: AccountingBudgetStatus | null | undefined
  onPress: () => void
}) {
  if (!budget) {
    return (
      <View className="border-border bg-card flex-row items-center gap-4 rounded-2xl border p-4">
        <View className="bg-muted size-10 items-center justify-center rounded-2xl">
          <AppSymbol
            name={{ ios: "gauge.with.dots.needle.33percent", android: "speed" }}
            size={21}
          />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-medium">给支出定个范围</Text>
          <Text className="text-muted-foreground text-xs">设置个人预算，花到哪里更清楚。</Text>
        </View>
        <Button variant="ghost" size="sm" onPress={onPress} accessibilityLabel="设置预算">
          <Text>设置</Text>
        </Button>
      </View>
    )
  }

  const remainingCents = Math.max(0, budget.amountCents - budget.spentCents)
  const exceededCents = Math.max(0, budget.spentCents - budget.amountCents)
  const exceeded = exceededCents > 0
  const percentage = Math.min(100, (budget.spentCents / budget.amountCents) * 100)

  return (
    <Pressable
      className="border-border bg-card gap-3 rounded-2xl border p-4"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`修改${budgetLabels[budget.period]}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="min-w-0 flex-1 font-medium" numberOfLines={1}>
          {budgetLabels[budget.period]}
          {exceeded ? "超支" : "剩余"}{" "}
          <Text className={cn("font-semibold", exceeded && "text-destructive")}>
            {compactMoney.format((exceeded ? exceededCents : remainingCents) / 100)}
          </Text>
        </Text>
        <AppSymbol
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size={15}
          tone="mutedForeground"
        />
      </View>
      <Progress
        value={percentage}
        indicatorClassName={exceeded ? "bg-destructive" : "bg-primary"}
        accessibilityLabel={`${budgetLabels[budget.period]}使用进度`}
      />
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-muted-foreground text-xs tabular-nums">
          已支出 {compactMoney.format(budget.spentCents / 100)}
        </Text>
        <Text className="text-muted-foreground text-xs tabular-nums">
          预算 {compactMoney.format(budget.amountCents / 100)}
        </Text>
      </View>
    </Pressable>
  )
}

export default function AccountingScreen() {
  const [month, setMonth] = useState(getCurrentMonthKey)
  const entrySheetRef = useRef<AccountingEntrySheetMethods>(null)
  const budgetSheetRef = useRef<AccountingBudgetSheetMethods>(null)
  const { mutate: mutateCache } = useSWRConfig()
  const overviewKey = `/api/accounting/overview?month=${month}`
  const { data, error, isLoading, isValidating, mutate } = useSWR<AccountingOverview>(
    overviewKey,
    fetcher.get,
    {
      shouldRetryOnError: (requestError) =>
        !(requestError instanceof RequestError && requestError.isAuthError),
    }
  )
  const isCurrentMonth = month === getCurrentMonthKey()

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  const sections = useMemo<TransactionSection[]>(() => {
    const groups = new Map<string, AccountingTransaction[]>()

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

  const listHeader = (
    <View className="gap-5 px-4 pb-5 pt-3">
      <View className="flex-row items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onPress={() => setMonth((current) => moveMonthKey(current, -1))}
          accessibilityLabel="查看上个月"
        >
          <AppSymbol name={{ ios: "chevron.left", android: "chevron_left" }} size={18} />
        </Button>
        <View className="min-w-0 flex-1 items-center gap-0.5">
          <Text className="font-semibold">{formatMonthTitle(month)}</Text>
          <Text className="text-muted-foreground text-xs">
            {data?.transactions.length ?? 0} 笔记录
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon-sm"
          onPress={() => setMonth((current) => moveMonthKey(current, 1))}
          accessibilityLabel="查看下个月"
        >
          <AppSymbol name={{ ios: "chevron.right", android: "chevron_right" }} size={18} />
        </Button>
      </View>

      <MonthlySummary data={data} />

      {isCurrentMonth ? (
        <BudgetSummary
          budget={data?.budget}
          onPress={() => budgetSheetRef.current?.present(data?.budget ?? null)}
        />
      ) : null}

      {error && data ? (
        <View className="border-destructive/40 bg-destructive/5 flex-row items-center gap-3 rounded-2xl border p-4">
          <Text className="text-destructive min-w-0 flex-1 text-sm">{getErrorMessage(error)}</Text>
          <Button variant="outline" size="sm" onPress={() => void mutate()}>
            <Text>重试</Text>
          </Button>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between gap-3 pt-1">
        <View className="gap-0.5">
          <Text className="text-lg font-semibold">收支明细</Text>
          <Text className="text-muted-foreground text-xs">记录越及时，月底越清楚。</Text>
        </View>
        <Button
          size="sm"
          onPress={() => entrySheetRef.current?.present()}
          accessibilityLabel="记一笔"
        >
          <AppSymbol name={{ ios: "plus", android: "add" }} size={15} tone="primaryForeground" />
          <Text>记一笔</Text>
        </Button>
      </View>
    </View>
  )

  return (
    <View className="bg-background flex-1">
      <SectionList<AccountingTransaction, TransactionSection>
        sections={sections}
        keyExtractor={(transaction) => transaction.id}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled
        refreshing={Boolean(data) && isValidating}
        onRefresh={() => void mutate()}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View className="min-h-72 items-center justify-center gap-4 px-8 py-12">
            {isLoading ? (
              <>
                <Spinner size="large" />
                <Text className="text-muted-foreground text-sm">正在整理这个月的账单...</Text>
              </>
            ) : error ? (
              <>
                <View className="bg-destructive/10 size-12 items-center justify-center rounded-2xl">
                  <AppSymbol
                    name={{ ios: "wifi.exclamationmark", android: "wifi_off" }}
                    tone="destructive"
                  />
                </View>
                <View className="items-center gap-1.5">
                  <Text className="text-center font-semibold">账单暂时没有打开</Text>
                  <Text className="text-muted-foreground text-center text-sm leading-6">
                    {getErrorMessage(error)}
                  </Text>
                </View>
                <Button
                  variant="outline"
                  onPress={() => void mutate()}
                  accessibilityLabel="重新读取账单"
                >
                  <Text>重新尝试</Text>
                </Button>
              </>
            ) : (
              <>
                <View className="bg-muted size-12 items-center justify-center rounded-2xl">
                  <AppSymbol name={{ ios: "yensign.circle", android: "payments" }} size={24} />
                </View>
                <View className="items-center gap-1.5">
                  <Text className="text-center font-semibold">本月还没有账单</Text>
                  <Text className="text-muted-foreground text-center text-sm">
                    记下第一笔，月底回看会更清楚。
                  </Text>
                </View>
                <Button
                  onPress={() => entrySheetRef.current?.present()}
                  accessibilityLabel="记下第一笔"
                >
                  <AppSymbol
                    name={{ ios: "plus", android: "add" }}
                    size={16}
                    tone="primaryForeground"
                  />
                  <Text>记下第一笔</Text>
                </Button>
              </>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View className="bg-background flex-row items-baseline justify-between gap-3 px-4 py-3">
            <Text className="font-medium">{formatAccountingDateTitle(section.title)}</Text>
            <Text className="text-muted-foreground text-xs tabular-nums">
              支出 {compactMoney.format(section.dailyExpenseCents / 100)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const income = item.type === "income"
          const categoryLabel = getAccountingCategoryLabel(item.type, item.category)
          const ledgerLabel = item.ledgerAssignments.length
            ? item.ledgerAssignments.map((ledger) => ledger.name).join("、")
            : "未加入账本"

          return (
            <Pressable
              className="border-border bg-card mx-4 mb-2 rounded-2xl border"
              onPress={() => entrySheetRef.current?.present(item)}
              accessibilityRole="button"
              accessibilityLabel={`编辑${item.note || categoryLabel}账单`}
            >
              <Item>
                <ItemMedia>
                  <AppSymbol
                    name={{
                      ios: income ? "arrow.down.left" : "arrow.up.right",
                      android: income ? "south_west" : "north_east",
                    }}
                    size={18}
                    tone={income ? "primary" : "foreground"}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{item.note || categoryLabel}</ItemTitle>
                  <ItemDescription>
                    {categoryLabel} · {ledgerLabel}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Text
                    className={cn("text-sm font-medium tabular-nums", income && "text-primary")}
                  >
                    {income ? "+" : "-"}
                    {money.format(item.amountCents / 100)}
                  </Text>
                </ItemActions>
              </Item>
            </Pressable>
          )
        }}
        ListFooterComponent={<View className="h-8" />}
      />

      <AccountingEntrySheet ref={entrySheetRef} />
      <AccountingBudgetSheet ref={budgetSheetRef} />
    </View>
  )
}
