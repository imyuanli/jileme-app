import type { ApiCode, ApiResponse } from "@/types/api"

type HttpMethod = "GET" | "POST"

export type RequestOptions<TArg = unknown> = {
  arg?: TArg
  headers?: HeadersInit
  signal?: AbortSignal
  credentials?: RequestCredentials
}

type MutationOptions<TArg> = Readonly<{ arg: TArg }>

export class RequestError extends Error {
  status: number
  code?: ApiCode
  payload?: unknown
  isAuthError: boolean

  constructor({
    message,
    status,
    code,
    payload,
  }: {
    message: string
    status: number
    code?: ApiCode
    payload?: unknown
  }) {
    super(message)
    this.name = "RequestError"
    this.status = status
    this.code = code
    this.payload = payload
    this.isAuthError =
      status === 401 ||
      status === 403 ||
      code === 401 ||
      code === 403 ||
      code === "401" ||
      code === "403" ||
      code === "NO_LOGIN" ||
      code === "UNAUTHORIZED"
  }
}

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//.test(path)
}

function normalizeApiPath(path: string) {
  if (isAbsoluteUrl(path) || path.startsWith("/api/")) return path
  if (path.startsWith("api/")) return `/${path}`

  return `/api/${path.replace(/^\/+/, "")}`
}

function resolveApiUrl(path: string) {
  const normalizedPath = normalizeApiPath(path)
  if (isAbsoluteUrl(normalizedPath)) return normalizedPath

  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim()

  if (!configuredBaseUrl || !isAbsoluteUrl(configuredBaseUrl)) {
    throw new RequestError({
      message: "请先配置有效的 EXPO_PUBLIC_API_URL。",
      status: 0,
      code: "API_URL_MISSING",
    })
  }

  return `${configuredBaseUrl.replace(/\/+$/, "")}${normalizedPath}`
}

function isRawBody(body: unknown) {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  )
}

function createHeaders(method: HttpMethod, arg: unknown, headers?: HeadersInit) {
  const requestHeaders = new Headers(headers)

  if (
    method !== "GET" &&
    arg !== undefined &&
    arg !== null &&
    !isRawBody(arg) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json")
  }

  return requestHeaders
}

function createBody(arg: unknown) {
  if (arg === undefined || arg === null) return undefined
  if (isRawBody(arg)) return arg

  return JSON.stringify(arg)
}

async function parseResponse(response: Response) {
  const rawText = await response.text()
  if (!rawText) return undefined

  const contentType = response.headers.get("Content-Type") ?? ""
  if (!contentType.includes("application/json")) return rawText

  try {
    return JSON.parse(rawText) as unknown
  } catch {
    throw new RequestError({
      message: "接口返回了无效的 JSON。",
      status: response.status,
      code: "INVALID_JSON",
    })
  }
}

function isObject(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    isObject(payload) &&
    (typeof payload.code === "number" || typeof payload.code === "string") &&
    typeof payload.message === "string" &&
    "data" in payload
  )
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (!isObject(payload)) return fallback
  if (typeof payload.message === "string") return payload.message

  if (isObject(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message
  }

  return fallback
}

function getResponseCode(payload: unknown) {
  if (!isObject(payload)) return undefined

  if (typeof payload.code === "string" || typeof payload.code === "number") {
    return payload.code
  }

  if (
    isObject(payload.error) &&
    (typeof payload.error.code === "string" || typeof payload.error.code === "number")
  ) {
    return payload.error.code
  }

  return undefined
}

function isSuccessCode(code: ApiCode) {
  const numericCode = typeof code === "number" ? code : Number(code)
  return Number.isInteger(numericCode) && numericCode >= 200 && numericCode < 300
}

function isBusinessFailed(payload: unknown) {
  if (isApiResponse(payload)) return !isSuccessCode(payload.code)
  if (!isObject(payload)) return false

  return payload.success === false || payload.ok === false
}

function unwrapData<T>(payload: unknown) {
  if (isApiResponse<T>(payload)) return payload.data as T
  if (!isObject(payload)) return payload as T

  if ("data" in payload && (payload.success === true || payload.ok === true)) {
    return payload.data as T
  }

  return payload as T
}

export async function request<T>(
  url: string,
  method: HttpMethod = "GET",
  { arg, headers, signal, credentials = "include" }: RequestOptions = {}
): Promise<T> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl(url), {
      method,
      headers: createHeaders(method, arg, headers),
      body: method === "GET" ? undefined : createBody(arg),
      signal,
      credentials,
    })
  } catch (error) {
    if (error instanceof RequestError) throw error

    throw new RequestError({
      message: "网络连接失败，请检查网络和接口地址后重试。",
      status: 0,
      code: "NETWORK_ERROR",
      payload: error,
    })
  }

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new RequestError({
      message: getResponseMessage(payload, `请求失败，状态码：${response.status}`),
      status: response.status,
      code: getResponseCode(payload),
      payload,
    })
  }

  if (isBusinessFailed(payload)) {
    throw new RequestError({
      message: getResponseMessage(payload, "请求失败"),
      status: response.status,
      code: getResponseCode(payload),
      payload,
    })
  }

  return unwrapData<T>(payload)
}

export const fetcher = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, "GET", options),
  post: <T, TArg = undefined>(url: string, { arg }: MutationOptions<TArg>) =>
    request<T>(url, "POST", { arg }),
}
