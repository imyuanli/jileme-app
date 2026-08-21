export type ApiCode = number | string

export type ApiResponse<T> = {
  code: ApiCode
  message: string
  data: T | null
}
