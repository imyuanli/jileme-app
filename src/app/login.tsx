import { Image } from "expo-image"
import { useEffect, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput as NativeTextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useSWRConfig } from "swr"
import useSWRMutation from "swr/mutation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Text } from "@/components/ui/text"
import { fetcher, RequestError } from "@/lib/request"
import { cn } from "@/lib/utils"
import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  SendEmailOtpRequest,
  SendEmailOtpResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
} from "@/types/user"

type LoginMethod = "otp" | "password"
type OtpStep = "email" | "verify"

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
}

function OtpInput({ value, onChange, disabled = false, invalid = false }: OtpInputProps) {
  const [focused, setFocused] = useState(false)

  function handleChange(text: string) {
    onChange(text.replace(/\D/g, "").slice(0, 6))
  }

  return (
    <View className={cn("relative h-14 w-full", disabled && "opacity-50")}>
      <View
        className="absolute inset-0 flex-row gap-2"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: 6 }, (_, index) => {
          const active = focused && index === Math.min(value.length, 5)

          return (
            <View
              key={index}
              className={cn(
                "border-input bg-background flex-1 items-center justify-center rounded-xl border",
                active && "border-ring border-2",
                invalid && "border-destructive"
              )}
            >
              <Text className="text-xl font-semibold tabular-nums">{value[index] ?? ""}</Text>
            </View>
          )
        })}
      </View>
      <NativeTextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        caretHidden
        selectionColor="transparent"
        style={styles.otpInput}
        accessibilityLabel="6 位邮箱验证码"
        accessibilityHint="请输入邮件中的六位数字"
      />
    </View>
  )
}

function LoginForm() {
  const { mutate } = useSWRConfig()
  const [method, setMethod] = useState<LoginMethod>("otp")
  const [otpStep, setOtpStep] = useState<OtpStep>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [message, setMessage] = useState("")
  const [resendSeconds, setResendSeconds] = useState(0)

  const { trigger: login, isMutating: isLoggingIn } = useSWRMutation<
    LoginResponse,
    RequestError,
    string,
    LoginRequest
  >("/api/auth/login", fetcher.post, {
    throwOnError: false,
    onError: (loginError) => setMessage(loginError.message),
  })

  const { trigger: sendOtp, isMutating: isSendingOtp } = useSWRMutation<
    SendEmailOtpResponse,
    RequestError,
    string,
    SendEmailOtpRequest
  >("/api/auth/email-otp/send", fetcher.post, {
    throwOnError: false,
    onSuccess: (data) => {
      setEmail(data.email)
      setToken("")
      setOtpStep("verify")
      setResendSeconds(data.resendAfterSeconds)
      setMessage("")
    },
    onError: (sendError) => setMessage(sendError.message),
  })

  const { trigger: verifyOtp, isMutating: isVerifyingOtp } = useSWRMutation<
    VerifyEmailOtpResponse,
    RequestError,
    string,
    VerifyEmailOtpRequest
  >("/api/auth/email-otp/verify", fetcher.post, {
    throwOnError: false,
    onError: (verifyError) => setMessage(verifyError.message),
  })

  useEffect(() => {
    if (resendSeconds <= 0) return

    const timer = setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [resendSeconds])

  async function finishLogin() {
    try {
      const user = await mutate<CurrentUser>("/api/me")

      if (!user) {
        setMessage("登录成功，但会话尚未生效，请稍后重试。")
      }
    } catch (error) {
      setMessage(error instanceof RequestError ? error.message : "登录成功，但会话确认失败。")
    }
  }

  async function handleSendOtp() {
    setMessage("")
    await sendOtp({ email: email.trim() })
  }

  async function handleVerifyOtp() {
    setMessage("")
    const result = await verifyOtp({ email, token })
    if (result) await finishLogin()
  }

  async function handlePasswordLogin() {
    setMessage("")
    const result = await login({ email: email.trim(), password })
    if (result) await finishLogin()
  }

  async function handleResendOtp() {
    setMessage("")
    await sendOtp({ email })
  }

  function switchMethod(nextMethod: LoginMethod) {
    setMethod(nextMethod)
    setMessage("")
  }

  function changeEmail() {
    setOtpStep("email")
    setToken("")
    setResendSeconds(0)
    setMessage("")
  }

  const isBusy = isLoggingIn || isSendingOtp || isVerifyingOtp
  const hasEmail = email.trim().length > 0

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">
          {method === "otp" ? "邮箱验证码登录" : "密码登录"}
        </CardTitle>
        <CardDescription>
          {method === "otp"
            ? otpStep === "email"
              ? "输入邮箱，我们会发送 6 位验证码。"
              : `验证码已发送至 ${email}`
            : "使用邮箱和密码登录。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {method === "otp" && otpStep === "email" ? (
          <View className="gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel>邮箱</FieldLabel>
                <Input
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value)
                    setMessage("")
                  }}
                  editable={!isBusy}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (hasEmail && !isBusy) void handleSendOtp()
                  }}
                  accessibilityLabel="邮箱"
                />
                {message ? <FieldError>{message}</FieldError> : null}
              </Field>
            </FieldGroup>

            <Button
              disabled={!hasEmail || isSendingOtp}
              onPress={() => void handleSendOtp()}
              className="w-full"
            >
              {isSendingOtp ? <Spinner tone="primaryForeground" /> : null}
              <Text>{isSendingOtp ? "发送中" : "获取验证码"}</Text>
            </Button>

            <FieldSeparator>或</FieldSeparator>
            <Button
              variant="link"
              disabled={isBusy}
              className="self-center"
              onPress={() => switchMethod("password")}
            >
              <Text>使用密码登录</Text>
            </Button>
          </View>
        ) : null}

        {method === "otp" && otpStep === "verify" ? (
          <View className="gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel>验证码</FieldLabel>
                <OtpInput
                  value={token}
                  onChange={(value) => {
                    setToken(value)
                    setMessage("")
                  }}
                  disabled={isBusy}
                  invalid={Boolean(message)}
                />
                <FieldDescription>请输入邮件中的 6 位数字验证码。</FieldDescription>
                {message ? <FieldError>{message}</FieldError> : null}
              </Field>
            </FieldGroup>

            <Button
              disabled={token.length !== 6 || isVerifyingOtp}
              onPress={() => void handleVerifyOtp()}
              className="w-full"
            >
              {isVerifyingOtp ? <Spinner tone="primaryForeground" /> : null}
              <Text>{isVerifyingOtp ? "验证中" : "验证并登录"}</Text>
            </Button>

            <View className="flex-row items-center justify-between gap-3">
              <Button
                variant="link"
                size="sm"
                disabled={resendSeconds > 0 || isSendingOtp}
                onPress={() => void handleResendOtp()}
              >
                {isSendingOtp ? <Spinner /> : null}
                <Text>{resendSeconds > 0 ? `重新发送（${resendSeconds} 秒）` : "重新发送"}</Text>
              </Button>
              <Button variant="link" size="sm" disabled={isBusy} onPress={changeEmail}>
                <Text>更换邮箱</Text>
              </Button>
            </View>
          </View>
        ) : null}

        {method === "password" ? (
          <View className="gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel>邮箱</FieldLabel>
                <Input
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value)
                    setMessage("")
                  }}
                  editable={!isBusy}
                  accessibilityLabel="邮箱"
                />
              </Field>
              <Field>
                <FieldLabel>密码</FieldLabel>
                <Input
                  secureTextEntry
                  textContentType="password"
                  autoComplete="current-password"
                  placeholder="输入密码"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value)
                    setMessage("")
                  }}
                  editable={!isBusy}
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    if (hasEmail && password && !isBusy) void handlePasswordLogin()
                  }}
                  accessibilityLabel="密码"
                />
                {message ? <FieldError>{message}</FieldError> : null}
              </Field>
            </FieldGroup>

            <Button
              disabled={!hasEmail || !password || isLoggingIn}
              onPress={() => void handlePasswordLogin()}
              className="w-full"
            >
              {isLoggingIn ? <Spinner tone="primaryForeground" /> : null}
              <Text>{isLoggingIn ? "登录中" : "登录"}</Text>
            </Button>

            <FieldSeparator>或</FieldSeparator>
            <Button
              variant="link"
              disabled={isBusy}
              className="self-center"
              onPress={() => switchMethod("otp")}
            >
              <Text>使用邮箱验证码登录</Text>
            </Button>
          </View>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function LoginScreen() {
  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View className="flex-1 items-center justify-center px-4 py-10">
            <View className="w-full max-w-sm items-center gap-6">
              <View className="flex-row items-center gap-2" accessibilityRole="header">
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={{ width: 32, height: 33 }}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
                <Text className="text-lg font-bold">记了么</Text>
              </View>
              <LoginForm />
              <Text className="text-muted-foreground text-center text-sm">
                记录生活，从这一刻开始。
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  otpInput: {
    ...StyleSheet.absoluteFill,
    color: "transparent",
    backgroundColor: "transparent",
  },
})
