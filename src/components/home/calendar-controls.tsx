import { useState } from "react"
import { Pressable, View } from "react-native"

import { Button } from "@/components/ui/button"
import { AppSymbol } from "@/components/ui/symbol"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Text, TextClassContext } from "@/components/ui/text"
import {
  getCalendarDateKeys,
  getDateParts,
  isDateKeyInSelectedMonth,
  moveCalendarPeriod,
  type CalendarMode,
} from "@/lib/date"
import { cn } from "@/lib/utils"

type CalendarControlsProps = {
  onDateChange: (dateKey: string) => void
  selectedDateKey: string
  todayKey: string
}

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"]

export function CalendarControls({
  onDateChange,
  selectedDateKey,
  todayKey,
}: CalendarControlsProps) {
  const [mode, setMode] = useState<CalendarMode>("week")
  const calendarDateKeys = getCalendarDateKeys(selectedDateKey, mode)
  const calendarRows = Array.from(
    { length: Math.ceil(calendarDateKeys.length / weekLabels.length) },
    (_, index) => calendarDateKeys.slice(index * weekLabels.length, (index + 1) * weekLabels.length)
  )
  const selectedDate = getDateParts(selectedDateKey)
  const isToday = selectedDateKey === todayKey
  const dateTitle = isToday ? "今天" : `${selectedDate.month}月${selectedDate.day}日`

  function movePeriod(direction: -1 | 1) {
    onDateChange(moveCalendarPeriod(selectedDateKey, mode, direction))
  }

  return (
    <View className="gap-3" accessibilityLabel="日期选择">
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-1">
          <Text className="text-xl font-semibold">{dateTitle}</Text>
          {!isToday ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onDateChange(todayKey)}
              accessibilityLabel="回到今日"
            >
              <Text>今天</Text>
            </Button>
          ) : null}
        </View>

        <View className="shrink-0 flex-row items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onPress={() => movePeriod(-1)}
            accessibilityLabel={mode === "week" ? "上一周" : "上个月"}
          >
            <AppSymbol name={{ ios: "chevron.left", android: "chevron_left" }} size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onPress={() => movePeriod(1)}
            accessibilityLabel={mode === "week" ? "下一周" : "下个月"}
          >
            <AppSymbol name={{ ios: "chevron.right", android: "chevron_right" }} size={18} />
          </Button>
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value === "month" ? "month" : "week")}
          >
            <TabsList accessibilityLabel="日历视图" testID="calendar-mode-control">
              <TabsTrigger value="week">
                <Text>周</Text>
              </TabsTrigger>
              <TabsTrigger value="month">
                <Text>月</Text>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </View>
      </View>

      {mode === "month" ? (
        <View className="flex-row">
          {weekLabels.map((label) => (
            <View key={label} className="flex-1 items-center py-1">
              <Text className="text-muted-foreground text-[10px]">{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="gap-1">
        {calendarRows.map((row, rowIndex) => (
          <View key={row[0]} className="flex-row">
            {row.map((dateKey, columnIndex) => {
              const date = getDateParts(dateKey)
              const active = dateKey === selectedDateKey
              const today = dateKey === todayKey
              const outsideMonth =
                mode === "month" && !isDateKeyInSelectedMonth(dateKey, selectedDateKey)

              return (
                <View key={dateKey} className="flex-1 p-0.5">
                  <TextClassContext.Provider value={active ? "text-primary-foreground" : undefined}>
                    <Pressable
                      onPress={() => onDateChange(dateKey)}
                      accessibilityRole="button"
                      accessibilityLabel={`${date.month}月${date.day}日${today ? "，今天" : ""}`}
                      accessibilityState={{ selected: active }}
                      className={cn(
                        "min-h-12 items-center justify-center gap-0.5 rounded-xl active:opacity-70",
                        active ? "bg-primary" : "active:bg-muted",
                        outsideMonth && !active && "opacity-35"
                      )}
                    >
                      {mode === "week" ? (
                        <Text className="text-[9px] font-medium opacity-60">
                          {weekLabels[columnIndex]}
                        </Text>
                      ) : null}
                      <Text className="text-sm font-semibold tabular-nums">{date.day}</Text>
                      {mode === "week" ? (
                        <View
                          className={cn(
                            "size-1 rounded-full",
                            today
                              ? active
                                ? "bg-primary-foreground"
                                : "bg-primary"
                              : "bg-transparent"
                          )}
                        />
                      ) : null}
                    </Pressable>
                  </TextClassContext.Provider>
                </View>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}
