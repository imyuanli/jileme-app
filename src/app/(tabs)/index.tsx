import { useEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"

import { AccountingHomeBlock } from "@/components/home/accounting-home-block"
import { CalendarControls } from "@/components/home/calendar-controls"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getTodayDateKey } from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import type { HomeBlock, HomeDayData, HomeSlot } from "@/types/home"

function getBlocksBySlot(blocks: HomeBlock[], slot: HomeSlot) {
  return blocks.filter((block) => block.slot === slot)
}

function HomeBlockContent({ block }: { block: HomeBlock }) {
  switch (block.kind) {
    case "accounting-summary":
      return <AccountingHomeBlock block={block} />
    case "module-error":
      return (
        <View className="bg-muted/60 flex-row items-start gap-3 rounded-2xl p-4">
          <AppSymbol
            name={{ ios: "exclamationmark.circle", android: "error" }}
            tone="destructive"
          />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-medium">{block.label}</Text>
            <Text className="text-muted-foreground text-sm leading-5">{block.message}</Text>
          </View>
        </View>
      )
  }
}

function HomeSection({ title, blocks }: { title: string; blocks: HomeBlock[] }) {
  if (blocks.length === 0) return null

  return (
    <View className="gap-4" accessibilityLabel={title}>
      <View className="border-border border-b pb-2">
        <Text className="text-muted-foreground text-sm font-medium">{title}</Text>
      </View>
      <View className="divide-border divide-y">
        {blocks.map((block) => (
          <HomeBlockContent key={block.id} block={block} />
        ))}
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const { mutate: mutateCache } = useSWRConfig()
  const todayKey = getTodayDateKey()
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const { data, error, isLoading, isValidating, mutate } = useSWR<HomeDayData>(
    `/api/home/day?date=${selectedDateKey}`,
    fetcher.get,
    { keepPreviousData: true }
  )
  const isToday = selectedDateKey === todayKey
  const isContentLoading = isLoading || data?.dateKey !== selectedDateKey
  const blocks = data?.dateKey === selectedDateKey ? data.blocks : []
  const focusBlocks = getBlocksBySlot(blocks, "focus")
  const recordBlocks = getBlocksBySlot(blocks, "records")

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  return (
    <ScrollView
      className="bg-background flex-1"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="border-border border-b">
        <CalendarControls
          onDateChange={setSelectedDateKey}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
        />
      </View>

      <View>
        {error && !data ? (
          <Empty className="min-h-72">
            <EmptyMedia>
              <AppSymbol
                name={{ ios: "exclamationmark.triangle", android: "warning" }}
                tone="destructive"
                size={22}
              />
            </EmptyMedia>
            <View className="items-center gap-2">
              <EmptyTitle>首页暂时无法读取</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error ? error.message : "请稍后再试。"}
              </EmptyDescription>
            </View>
            <Button variant="outline" onPress={() => void mutate()} disabled={isValidating}>
              {isValidating ? <Spinner tone="mutedForeground" /> : null}
              <Text>{isValidating ? "读取中" : "重新加载"}</Text>
            </Button>
          </Empty>
        ) : isContentLoading ? (
          <View
            className="gap-4"
            accessibilityRole="progressbar"
            accessibilityLabel="正在读取首页内容"
          >
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </View>
        ) : blocks.length === 0 ? (
          <Empty className="min-h-72">
            <EmptyMedia>
              <AppSymbol name={{ ios: "book.closed", android: "menu_book" }} size={22} />
            </EmptyMedia>
            <View className="items-center gap-2">
              <EmptyTitle>这一天还没有记录</EmptyTitle>
              <EmptyDescription>留下的账目、心情和日记会出现在这里。</EmptyDescription>
            </View>
          </Empty>
        ) : (
          <View className="gap-6">
            {error && data?.dateKey === selectedDateKey ? (
              <View className="border-destructive/40 bg-destructive/5 flex-row items-center gap-3 rounded-2xl border p-4">
                <Text className="text-destructive min-w-0 flex-1 text-sm">
                  内容更新失败，已保留上次记录。
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => void mutate()}
                  disabled={isValidating}
                >
                  {isValidating ? <Spinner tone="mutedForeground" /> : null}
                  <Text>{isValidating ? "读取中" : "重试"}</Text>
                </Button>
              </View>
            ) : null}
            <HomeSection title={isToday ? "今日焦点" : "当天焦点"} blocks={focusBlocks} />
            <HomeSection title={isToday ? "今日记录" : "当天记录"} blocks={recordBlocks} />
          </View>
        )}
      </View>
    </ScrollView>
  )
}
