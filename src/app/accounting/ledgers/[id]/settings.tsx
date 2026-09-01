import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Alert, Pressable, ScrollView, Share, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import {
  AccountingBudgetSheet,
  type AccountingBudgetSheetMethods,
} from "@/components/accounting/accounting-budget-sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { AppSymbol } from "@/components/ui/symbol"
import { Text } from "@/components/ui/text"
import { fetcher, RequestError } from "@/lib/request"
import { cn } from "@/lib/utils"
import type {
  AccountingLedgerMember,
  AccountingLedgerSettingsData,
  DeleteLedgerRequest,
  DeleteLedgerResponse,
  RemoveLedgerMemberRequest,
  RemoveLedgerMemberResponse,
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

function SettingsSkeleton() {
  return (
    <View
      className="gap-5 px-4 py-4"
      accessibilityRole="progressbar"
      accessibilityLabel="正在读取账本设置"
    >
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </View>
  )
}

type SettingsRowProps = {
  title: string
  description?: string
  value?: string
  onPress?: () => void
  disabled?: boolean
  destructive?: boolean
  accessibilityLabel?: string
  children?: React.ReactNode
  showChevron?: boolean
}

function SettingsRow({
  title,
  description,
  value,
  onPress,
  disabled,
  destructive = false,
  accessibilityLabel,
  children,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <Pressable
      className="min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-accent"
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className={cn("font-medium", destructive && "text-destructive")}>{title}</Text>
        {description ? (
          <Text
            className={cn(
              "text-muted-foreground text-xs leading-5",
              destructive && "text-destructive/80"
            )}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text className="text-muted-foreground max-w-[45%] text-right text-sm" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {children}
      {showChevron ? (
        <AppSymbol
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size={17}
          tone="mutedForeground"
        />
      ) : null}
    </Pressable>
  )
}

export default function AccountingLedgerSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const ledgerId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const budgetSheetRef = useRef<AccountingBudgetSheetMethods>(null)
  const { mutate: mutateCache } = useSWRConfig()
  const [memberMessage, setMemberMessage] = useState("")
  const settingsKey = ledgerId ? `/api/accounting/ledgers/settings?ledgerId=${ledgerId}` : null
  const { data, error, isLoading, isValidating, mutate } = useSWR<AccountingLedgerSettingsData>(
    settingsKey,
    fetcher.get,
    {
      shouldRetryOnError: (requestError) =>
        !(requestError instanceof RequestError && requestError.isAuthError),
    }
  )
  const { trigger: removeMember, isMutating: isRemovingMember } = useSWRMutation<
    RemoveLedgerMemberResponse,
    RequestError,
    string,
    RemoveLedgerMemberRequest
  >("/api/accounting/ledgers/members/remove", fetcher.post)
  const { trigger: deleteLedger, isMutating: isDeleting } = useSWRMutation<
    DeleteLedgerResponse,
    RequestError,
    string,
    DeleteLedgerRequest
  >("/api/accounting/ledgers/delete", fetcher.post)

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  async function refreshLedgerCaches() {
    await Promise.allSettled([
      mutate(),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?")
      ),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/detail?")
      ),
      mutateCache("/api/accounting/ledgers/options"),
      mutateCache((key) => typeof key === "string" && key.startsWith("/api/accounting/overview?")),
    ])
  }

  async function handleShareInvite() {
    if (!data) return
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
    if (!apiBaseUrl) {
      Alert.alert("暂时无法分享", "请先配置有效的 App 接口地址。")
      return
    }

    try {
      const inviteUrl = new URL(data.invitePath, apiBaseUrl).toString()
      await Share.share({ message: `邀请你加入“${data.ledger.name}”共同记账：${inviteUrl}` })
    } catch (shareError) {
      Alert.alert("暂时无法分享", getErrorMessage(shareError, "请稍后再试"))
    }
  }

  async function handleRemoveMember(member: AccountingLedgerMember) {
    if (!ledgerId) return
    setMemberMessage("")
    try {
      await removeMember({ ledgerId, userId: member.userId })
      await refreshLedgerCaches()
    } catch (removeError) {
      if (removeError instanceof RequestError && removeError.isAuthError) {
        await mutateCache("/api/me")
      }
      setMemberMessage(getErrorMessage(removeError, "成员移除失败，请稍后再试"))
    }
  }

  function confirmRemoveMember(member: AccountingLedgerMember) {
    setMemberMessage("")
    Alert.alert(
      "移除这位共同编辑者？",
      `移除 ${member.displayName} 后，对方将无法继续访问；对方创建的原始账单不会被删除。`,
      [
        {
          text: "取消",
          style: "cancel",
        },
        {
          text: "确认移除",
          style: "destructive",
          onPress: () => void handleRemoveMember(member),
        },
      ]
    )
  }

  async function handleDelete() {
    if (!ledgerId) return
    try {
      await deleteLedger({ ledgerId })
      await Promise.allSettled([
        mutateCache(
          (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?")
        ),
        mutateCache("/api/accounting/ledgers/options"),
        mutateCache(
          (key) => typeof key === "string" && key.startsWith("/api/accounting/overview?")
        ),
        mutateCache(
          (key) =>
            typeof key === "string" &&
            (key.startsWith("/api/accounting/ledgers/detail?") ||
              key.startsWith("/api/accounting/ledgers/settings?")),
          undefined,
          { revalidate: false }
        ),
      ])
      router.replace("/accounting/ledgers")
    } catch (deleteError) {
      if (deleteError instanceof RequestError && deleteError.isAuthError) {
        await mutateCache("/api/me")
      }
      Alert.alert("账本删除失败", getErrorMessage(deleteError, "请稍后再试"))
    }
  }

  function confirmDelete() {
    Alert.alert(
      `删除“${data?.ledger.name ?? "当前账本"}”？`,
      "账本、成员和归属关系会被删除，但所有原始账单都会保留。此操作无法撤销。",
      [
        { text: "取消", style: "cancel" },
        { text: "确认删除", style: "destructive", onPress: () => void handleDelete() },
      ]
    )
  }

  if (isLoading) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ title: "账本设置" }} />
        <SettingsSkeleton />
      </View>
    )
  }

  if (error || !data || !ledgerId) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 px-4">
        <Stack.Screen options={{ title: "账本设置" }} />
        <Text className="text-destructive text-center text-sm leading-6">
          {getErrorMessage(error, "账本设置暂时没有打开")}
        </Text>
        <Button variant="outline" onPress={() => void mutate()} disabled={isValidating}>
          {isValidating ? <Spinner tone="mutedForeground" /> : null}
          <Text>{isValidating ? "读取中" : "重新尝试"}</Text>
        </Button>
      </View>
    )
  }

  const budgetPercentage = data.budget
    ? Math.min(100, (data.budget.spentCents / data.budget.amountCents) * 100)
    : 0
  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: "账本设置" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-4 pb-8 pt-4"
      >
        <View className="bg-card items-center gap-3 rounded-3xl px-4 py-6">
          <View className="flex-row items-center justify-center gap-2">
            {data.members.slice(0, 5).map((member) => (
              <Avatar
                key={member.userId}
                className="size-12 border-2 border-background"
                alt={member.displayName}
              >
                <AvatarFallback>
                  <Text className="font-medium">{member.displayName.slice(0, 1)}</Text>
                </AvatarFallback>
              </Avatar>
            ))}
          </View>
          <Text className="text-lg font-semibold">{data.ledger.name}</Text>
          <Text className="text-muted-foreground text-sm">
            {data.members.length} 位成员 · 共同记账
          </Text>
        </View>

        <View className="bg-card overflow-hidden rounded-2xl">
          <SettingsRow
            title="邀请成员"
            description="分享链接，邀请好友加入这个账本"
            onPress={() => void handleShareInvite()}
            accessibilityLabel="分享或复制账本邀请链接"
            showChevron={false}
          >
            <AppSymbol
              name={{ ios: "square.and.arrow.up", android: "share" }}
              size={19}
              tone="primary"
            />
          </SettingsRow>
          <Separator />
          {data.members.map((member, index) => (
            <View key={member.userId}>
              {index > 0 ? <Separator /> : null}
              <View className="min-h-16 flex-row items-center gap-3 px-4 py-3">
                <Avatar alt={member.displayName}>
                  <AvatarFallback>
                    <Text className="text-xs font-medium">{member.displayName.slice(0, 1)}</Text>
                  </AvatarFallback>
                </Avatar>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="font-medium" numberOfLines={1}>
                    {member.displayName}
                    {member.isCurrentUser ? "（我）" : ""}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {member.role === "owner" ? "创建人" : "共同编辑者"}
                  </Text>
                </View>
                <Badge variant={member.role === "owner" ? "default" : "outline"}>
                  <Text>{member.role === "owner" ? "创建人" : "编辑者"}</Text>
                </Badge>
                {member.role === "editor" ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onPress={() => confirmRemoveMember(member)}
                    disabled={isRemovingMember}
                    accessibilityLabel={`移除${member.displayName}`}
                  >
                    <AppSymbol name={{ ios: "person.badge.minus", android: "person_remove" }} />
                  </Button>
                ) : null}
              </View>
            </View>
          ))}
          {memberMessage ? <FieldError className="px-4 pb-4">{memberMessage}</FieldError> : null}
        </View>

        <View className="bg-card overflow-hidden rounded-2xl">
          <SettingsRow
            title="账本名称"
            description="成员看到的账本名称会同步更新"
            value={data.ledger.name}
            onPress={() =>
              router.push({
                pathname: "/accounting/ledgers/[id]/name",
                params: { id: data.ledger.id },
              })
            }
            accessibilityLabel="编辑账本名称"
          />
          <Separator />
          <SettingsRow
            title="共享预算"
            description={data.budget ? "预算进度会展示在账本详情中" : "还没有设置共享预算"}
            value={
              data.budget
                ? `${money.format(data.budget.spentCents / 100)} / ${money.format(data.budget.amountCents / 100)}`
                : "未设置"
            }
            onPress={() => budgetSheetRef.current?.present(data.budget)}
            accessibilityLabel={data.budget ? "修改共享预算" : "设置共享预算"}
          />
          {data.budget ? (
            <View className="px-4 pb-4">
              <Progress value={budgetPercentage} />
            </View>
          ) : null}
        </View>

        <View className="bg-card overflow-hidden rounded-2xl border border-destructive/40">
          <SettingsRow
            title="删除账本"
            description="删除账本、成员和归属关系，但不会删除原始账单"
            onPress={confirmDelete}
            disabled={isDeleting}
            destructive
            accessibilityLabel="删除账本"
            showChevron={false}
          >
            {isDeleting ? (
              <Spinner tone="mutedForeground" />
            ) : (
              <AppSymbol name={{ ios: "trash", android: "delete" }} size={19} tone="destructive" />
            )}
          </SettingsRow>
        </View>
      </ScrollView>

      <AccountingBudgetSheet
        ref={budgetSheetRef}
        ledgerId={ledgerId}
        onChanged={() => void mutate()}
      />
    </View>
  )
}
