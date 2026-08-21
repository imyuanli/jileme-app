import { View } from "react-native"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getAccountingCategoryLabel } from "@/lib/constants/accounting"
import type { AccountingHomeBlock as AccountingHomeBlockData } from "@/types/home"

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
})

export function AccountingHomeBlock({ block }: { block: AccountingHomeBlockData }) {
  return (
    <View className="gap-4 py-5" accessibilityLabel="记账摘要">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="bg-muted size-10 items-center justify-center rounded-2xl">
            <AppSymbol name={{ ios: "yensign.circle", android: "payments" }} size={22} />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="font-medium">记账</Text>
            <Text className="text-muted-foreground text-xs">{block.transactionCount} 笔记录</Text>
          </View>
        </View>
        <View className="bg-accent rounded-full px-3 py-1.5">
          <Text className="text-accent-foreground text-xs font-medium">每日汇总</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="bg-muted/60 flex-1 gap-1 rounded-2xl p-3">
          <Text className="text-muted-foreground text-xs">支出</Text>
          <Text className="font-semibold tabular-nums">
            {money.format(block.expenseCents / 100)}
          </Text>
        </View>
        <View className="bg-muted/60 flex-1 gap-1 rounded-2xl p-3">
          <Text className="text-muted-foreground text-xs">收入</Text>
          <Text className="font-semibold tabular-nums">
            {money.format(block.incomeCents / 100)}
          </Text>
        </View>
      </View>

      <ItemGroup>
        {block.transactions.map((transaction) => {
          const categoryLabel = getAccountingCategoryLabel(transaction.type, transaction.category)
          const income = transaction.type === "income"

          return (
            <Item key={transaction.id}>
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
                <ItemTitle>{transaction.note || categoryLabel}</ItemTitle>
                <ItemDescription>{categoryLabel}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Text className="text-sm font-medium tabular-nums">
                  {income ? "+" : "-"}
                  {money.format(transaction.amountCents / 100)}
                </Text>
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </View>
  )
}
