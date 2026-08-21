import { useEffect, useState } from "react"
import { RefreshControl, ScrollView, useColorScheme, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"

import { AccountingHomeBlock } from "@/components/home/accounting-home-block"
import { CalendarControls } from "@/components/home/calendar-controls"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getTodayDateKey } from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import { THEME } from "@/lib/theme"
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
        <View className="bg-muted/60 my-4 flex-row items-start gap-3 rounded-2xl p-4">
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
    <View accessibilityLabel={title}>
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
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const { mutate: mutateCache } = useSWRConfig()
  const todayKey = getTodayDateKey()
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const { data, error, isLoading, isValidating, mutate } = useSWR<HomeDayData>(
    `/api/home/day?date=${selectedDateKey}`,
    fetcher.get,
    { keepPreviousData: true }
  )
  const isToday = selectedDateKey === todayKey
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
      contentContainerStyle={{ flexGrow: 1 }}
      alwaysBounceVertical
      refreshControl={
        <RefreshControl
          refreshing={isValidating && !isLoading}
          onRefresh={() => void mutate()}
          tintColor={THEME[colorScheme].primary}
          colors={[THEME[colorScheme].primary]}
        />
      }
    >
      <View className="border-border border-b p-4">
        <CalendarControls
          onDateChange={setSelectedDateKey}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
        />
      </View>

      <View className="p-4">
        {error ? (
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
            <Button variant="outline" onPress={() => void mutate()}>
              <Text>重新加载</Text>
            </Button>
          </Empty>
        ) : isLoading || data?.dateKey !== selectedDateKey ? (
          <View className="gap-5">
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
          <View className="gap-8">
            <HomeSection title={isToday ? "今日焦点" : "当天焦点"} blocks={focusBlocks} />
            <HomeSection title={isToday ? "今日记录" : "当天记录"} blocks={recordBlocks} />
          </View>
        )}
      </View>
    </ScrollView>
  )
}
