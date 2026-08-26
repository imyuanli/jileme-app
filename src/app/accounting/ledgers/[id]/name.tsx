import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { type NavigationAction, usePreventRemove } from "expo-router/react-navigation"
import { useEffect, useRef, useState } from "react"
import { Alert, ScrollView, View } from "react-native"
import useSWR, { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Text } from "@/components/ui/text"
import { fetcher, RequestError } from "@/lib/request"
import type {
  AccountingLedgerSettingsData,
  UpdateLedgerRequest,
  UpdateLedgerResponse,
} from "@/types/accounting-ledgers"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

type LedgerNameFormProps = {
  data: AccountingLedgerSettingsData
  ledgerId: string
}

function LedgerNameForm({ data, ledgerId }: LedgerNameFormProps) {
  const router = useRouter()
  const navigation = useNavigation()
  const { mutate: mutateCache } = useSWRConfig()
  const [nameDraft, setNameDraft] = useState(data.ledger.name)
  const [nameMessage, setNameMessage] = useState("")
  const [canLeave, setCanLeave] = useState(false)
  const pendingNavigationActionRef = useRef<NavigationAction | null>(null)
  const { trigger: renameLedger, isMutating: isRenaming } = useSWRMutation<
    UpdateLedgerResponse,
    RequestError,
    string,
    UpdateLedgerRequest
  >("/api/accounting/ledgers/update", fetcher.post)
  const nameChanged = nameDraft.trim() !== data.ledger.name.trim()

  usePreventRemove(nameChanged && !canLeave, ({ data: navigationData }) => {
    if (isRenaming) {
      Alert.alert("请稍候", "账本名称正在保存。")
      return
    }

    Alert.alert("放弃修改账本名称？", "当前填写的名称还没有保存。", [
      { text: "继续编辑", style: "cancel" },
      {
        text: "放弃",
        style: "destructive",
        onPress: () => {
          pendingNavigationActionRef.current = navigationData.action
          setCanLeave(true)
        },
      },
    ])
  })

  useEffect(() => {
    if (!canLeave) return

    const pendingAction = pendingNavigationActionRef.current
    if (pendingAction) {
      pendingNavigationActionRef.current = null
      navigation.dispatch(pendingAction)
      return
    }

    router.back()
  }, [canLeave, navigation, router])

  async function refreshLedgerCaches() {
    await Promise.allSettled([
      mutateCache(`/api/accounting/ledgers/settings?ledgerId=${ledgerId}`),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/list?")
      ),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/detail?")
      ),
      mutateCache("/api/accounting/ledgers/options"),
      mutateCache((key) => typeof key === "string" && key.startsWith("/api/accounting/overview?")),
      mutateCache(
        (key) => typeof key === "string" && key.startsWith("/api/accounting/ledgers/settings?")
      ),
    ])
  }

  async function handleSave() {
    const nextName = nameDraft.trim()
    if (!nextName || nextName.length > 40) {
      setNameMessage("账本名称需要 1 至 40 个字")
      return
    }
    if (nextName === data.ledger.name.trim()) {
      setCanLeave(true)
      return
    }

    setNameMessage("")
    try {
      await renameLedger({ ledgerId, name: nextName })
      await refreshLedgerCaches()
      setCanLeave(true)
    } catch (saveError) {
      if (saveError instanceof RequestError && saveError.isAuthError) {
        await mutateCache("/api/me")
      }
      setNameMessage(getErrorMessage(saveError, "名称保存失败，请稍后再试"))
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-6 px-5 pb-8 pt-8"
    >
      <View className="gap-2">
        <Text className="text-2xl font-semibold">修改账本名称</Text>
        <Text className="text-muted-foreground text-sm leading-6">
          修改后，账本成员看到的名称会同步更新。
        </Text>
      </View>

      <Field>
        <FieldLabel>账本名称</FieldLabel>
        <Input
          value={nameDraft}
          onChangeText={(value) => {
            setNameDraft(value)
            setNameMessage("")
          }}
          maxLength={40}
          editable={!isRenaming}
          autoFocus
        />
        <FieldDescription>{nameDraft.length}/40</FieldDescription>
        {nameMessage ? <FieldError>{nameMessage}</FieldError> : null}
      </Field>

      <Button size="lg" onPress={() => void handleSave()} disabled={!nameChanged || isRenaming}>
        {isRenaming ? <Spinner tone="primaryForeground" /> : null}
        <Text>{isRenaming ? "保存中" : "保存名称"}</Text>
      </Button>
    </ScrollView>
  )
}

export default function AccountingLedgerNameScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const ledgerId = Array.isArray(params.id) ? params.id[0] : params.id
  const { mutate: mutateCache } = useSWRConfig()
  const settingsKey = ledgerId ? `/api/accounting/ledgers/settings?ledgerId=${ledgerId}` : null
  const { data, error, isLoading, mutate } = useSWR<AccountingLedgerSettingsData>(
    settingsKey,
    fetcher.get,
    {
      shouldRetryOnError: (requestError) =>
        !(requestError instanceof RequestError && requestError.isAuthError),
    }
  )

  useEffect(() => {
    if (error instanceof RequestError && error.isAuthError) {
      void mutateCache("/api/me")
    }
  }, [error, mutateCache])

  if (isLoading) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ title: "修改账本名称" }} />
        <View className="gap-5 px-5 py-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
        </View>
      </View>
    )
  }

  if (error || !data || !ledgerId) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 px-8">
        <Stack.Screen options={{ title: "修改账本名称" }} />
        <Text className="text-destructive text-center text-sm leading-6">
          {getErrorMessage(error, "账本名称暂时无法打开")}
        </Text>
        <Button variant="outline" onPress={() => void mutate()}>
          <Text>重新尝试</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: "修改账本名称" }} />
      <LedgerNameForm key={data.ledger.id} data={data} ledgerId={ledgerId} />
    </View>
  )
}
