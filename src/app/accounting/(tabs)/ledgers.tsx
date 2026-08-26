import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { FlatList, Pressable, useColorScheme, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { getCurrentMonthKey } from "@/lib/date"
import { fetcher, RequestError } from "@/lib/request"
import { THEME } from "@/lib/theme"
import type {
  AccountingLedgerSummary,
  CreateLedgerRequest,
  CreateLedgerResponse,
} from "@/types/accounting-ledgers"

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function LedgerListSkeleton() {
  return (
    <View className="gap-4 px-4 py-4" accessibilityLabel="正在读取账本">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </View>
  )
}

export default function AccountingLedgersScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light"
  const router = useRouter()
  const createSheetRef = useRef<BottomSheetModal>(null)
  const { mutate: mutateCache } = useSWRConfig()
  const [name, setName] = useState("")
  const [createMessage, setCreateMessage] = useState("")
  const month = getCurrentMonthKey()
  const listKey = `/api/accounting/ledgers/list?month=${month}`
  const { data, error, isLoading, isValidating, mutate } = useSWR<AccountingLedgerSummary[]>(
    listKey,
    fetcher.get,
    {
      shouldRetryOnError: (requestError) =>
        !(requestError instanceof RequestError && requestError.isAuthError),
    }
  )
  const { trigger: createLedger, isMutating: isCreating } = useSWRMutation<
    CreateLedgerResponse,
    RequestError,
    string,
    CreateLedgerRequest
  >("/api/accounting/ledgers/create", fetcher.post)

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  function presentCreateSheet() {
    setName("")
    setCreateMessage("")
    createSheetRef.current?.present()
  }

  async function handleCreate() {
    const normalizedName = name.trim()
    if (!normalizedName || normalizedName.length > 40) {
      setCreateMessage("账本名称需要 1 至 40 个字")
      return
    }

    setCreateMessage("")
    try {
      const result = await createLedger({ name: normalizedName })
      await Promise.allSettled([mutate(), mutateCache("/api/accounting/ledgers/options")])
      createSheetRef.current?.dismiss()
      router.push({ pathname: "/accounting/ledgers/[id]", params: { id: result.ledgerId } })
    } catch (createError) {
      if (createError instanceof RequestError && createError.isAuthError) {
        await mutateCache("/api/me")
      }
      setCreateMessage(getErrorMessage(createError, "账本创建失败，请稍后再试"))
    }
  }

  return (
    <View className="bg-background flex-1">
      <FlatList
        data={data ?? []}
        keyExtractor={(ledger) => ledger.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-8"
        refreshing={Boolean(data) && isValidating}
        onRefresh={() => void mutate()}
        ListHeaderComponent={
          <View className="flex-row items-start justify-between gap-4 px-4 pb-3 pt-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xl font-semibold">我的账本</Text>
              <Text className="text-muted-foreground text-sm">
                一个人记，或者和重要的人一起记。
              </Text>
            </View>
            <Button size="sm" onPress={presentCreateSheet} accessibilityLabel="新建账本">
              <AppSymbol name={{ ios: "plus", android: "add" }} tone="primaryForeground" />
              <Text>新建</Text>
            </Button>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <LedgerListSkeleton />
          ) : error ? (
            <View className="min-h-80 items-center justify-center gap-4 px-8 py-12">
              <View className="bg-destructive/10 size-12 items-center justify-center rounded-2xl">
                <AppSymbol
                  name={{ ios: "wifi.exclamationmark", android: "wifi_off" }}
                  tone="destructive"
                />
              </View>
              <Text className="text-destructive text-center text-sm">
                {getErrorMessage(error, "账本读取失败")}
              </Text>
              <Button variant="outline" onPress={() => void mutate()}>
                <Text>重新尝试</Text>
              </Button>
            </View>
          ) : (
            <View className="min-h-80 items-center justify-center gap-4 px-8 py-12">
              <View className="bg-muted size-12 items-center justify-center rounded-2xl">
                <AppSymbol name={{ ios: "books.vertical", android: "library_books" }} size={24} />
              </View>
              <View className="items-center gap-1.5">
                <Text className="font-semibold">还没有账本</Text>
                <Text className="text-muted-foreground text-center text-sm leading-6">
                  创建一个账本，把相关的收支放在一起。
                </Text>
              </View>
              <Button onPress={presentCreateSheet}>
                <Text>创建第一个账本</Text>
              </Button>
            </View>
          )
        }
        renderItem={({ item: ledger }) => {
          const balanceCents = ledger.incomeCents - ledger.expenseCents

          return (
            <Pressable
              className="border-border bg-card mx-4 mb-3 gap-4 rounded-2xl border p-4"
              onPress={() =>
                router.push({ pathname: "/accounting/ledgers/[id]", params: { id: ledger.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={`打开账本${ledger.name}`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <View className="bg-muted size-10 items-center justify-center rounded-2xl">
                    <AppSymbol name={{ ios: "book.closed", android: "menu_book" }} size={20} />
                  </View>
                  <Text className="min-w-0 flex-1 font-semibold" numberOfLines={1}>
                    {ledger.name}
                  </Text>
                </View>
                <Badge variant="outline">
                  <Text>{ledger.role === "owner" ? "创建人" : "共同编辑者"}</Text>
                </Badge>
              </View>

              <View className="flex-row gap-2">
                <View className="bg-muted/60 min-w-0 flex-1 gap-1 rounded-xl p-3">
                  <Text className="text-muted-foreground text-xs">本月支出</Text>
                  <Text className="font-medium tabular-nums" numberOfLines={1}>
                    {money.format(ledger.expenseCents / 100)}
                  </Text>
                </View>
                <View className="bg-muted/60 min-w-0 flex-1 gap-1 rounded-xl p-3">
                  <Text className="text-muted-foreground text-xs">本月收入</Text>
                  <Text className="text-primary font-medium tabular-nums" numberOfLines={1}>
                    {money.format(ledger.incomeCents / 100)}
                  </Text>
                </View>
                <View className="bg-muted/60 min-w-0 flex-1 gap-1 rounded-xl p-3">
                  <Text className="text-muted-foreground text-xs">本月结余</Text>
                  <Text className="font-medium tabular-nums" numberOfLines={1}>
                    {money.format(balanceCents / 100)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-muted-foreground text-xs">
                  {ledger.transactionCount} 笔账单 · {ledger.memberCount} 位成员
                </Text>
                <AppSymbol
                  name={{ ios: "chevron.right", android: "chevron_right" }}
                  size={15}
                  tone="mutedForeground"
                />
              </View>
            </Pressable>
          )
        }}
      />

      <BottomSheetModal
        ref={createSheetRef}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: THEME[colorScheme].background }}
        onDismiss={() => setCreateMessage("")}
      >
        <BottomSheetView>
          <View className="gap-6 px-5 pb-10 pt-2">
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-xl font-semibold">新建账本</Text>
                <Text className="text-muted-foreground text-sm">给这段共同记录起一个名字。</Text>
              </View>
              <Button
                variant="ghost"
                size="icon-sm"
                onPress={() => createSheetRef.current?.dismiss()}
                accessibilityLabel="关闭新建账本"
                disabled={isCreating}
              >
                <AppSymbol name={{ ios: "xmark", android: "close" }} size={17} />
              </Button>
            </View>
            <Field>
              <FieldLabel>账本名称</FieldLabel>
              <Input
                value={name}
                onChangeText={(value) => {
                  setName(value)
                  setCreateMessage("")
                }}
                placeholder="例如：我们的生活"
                maxLength={40}
                editable={!isCreating}
                autoFocus
              />
              <FieldDescription>{name.length}/40</FieldDescription>
              {createMessage ? <FieldError>{createMessage}</FieldError> : null}
            </Field>
            <Button size="lg" onPress={() => void handleCreate()} disabled={isCreating}>
              {isCreating ? <Spinner tone="primaryForeground" /> : null}
              <Text>{isCreating ? "创建中" : "创建账本"}</Text>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
}
