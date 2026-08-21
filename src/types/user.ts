export type CurrentUser = {
  id: string
  email: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  email: string
}

export type SendEmailOtpRequest = {
  email: string
}

export type SendEmailOtpResponse = {
  email: string
  resendAfterSeconds: number
}

export type VerifyEmailOtpRequest = {
  email: string
  token: string
}

export type VerifyEmailOtpResponse = {
  email: string
}
