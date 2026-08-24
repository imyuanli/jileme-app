export type CalendarMode = "week" | "month"

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/
const WEEKDAY_LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

function createLocalDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12)
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getTodayDateKey() {
  return formatDateKey(new Date())
}

export function getCurrentMonthKey() {
  return getTodayDateKey().slice(0, 7)
}

export function parseDateKey(dateKey: string) {
  const match = DATE_KEY_PATTERN.exec(dateKey)
  if (!match) throw new Error(`无效日期：${dateKey}`)

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = createLocalDate(year, monthIndex, day)

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    throw new Error(`无效日期：${dateKey}`)
  }

  return date
}

function parseMonthKey(monthKey: string) {
  const match = MONTH_KEY_PATTERN.exec(monthKey)
  if (!match) throw new Error(`无效月份：${monthKey}`)

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const date = createLocalDate(year, monthIndex, 1)

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex) {
    throw new Error(`无效月份：${monthKey}`)
  }

  return date
}

export function moveMonthKey(monthKey: string, direction: -1 | 1) {
  const date = parseMonthKey(monthKey)
  const nextMonth = createLocalDate(date.getFullYear(), date.getMonth() + direction, 1)

  return formatDateKey(nextMonth).slice(0, 7)
}

export function formatMonthTitle(monthKey: string) {
  const date = parseMonthKey(monthKey)

  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

export function formatAccountingDateTitle(dateKey: string) {
  const date = parseDateKey(dateKey)

  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_LABELS[date.getDay()]}`
}

function addDays(date: Date, amount: number) {
  return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function startOfWeek(date: Date) {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return addDays(date, -daysSinceMonday)
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6)
}

export function moveCalendarPeriod(dateKey: string, mode: CalendarMode, direction: -1 | 1) {
  const date = parseDateKey(dateKey)

  if (mode === "week") return formatDateKey(addDays(date, direction * 7))

  const targetMonthStart = createLocalDate(date.getFullYear(), date.getMonth() + direction, 1)
  const targetMonthEnd = createLocalDate(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth() + 1,
    0
  )
  const targetDate = createLocalDate(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth(),
    Math.min(date.getDate(), targetMonthEnd.getDate())
  )

  return formatDateKey(targetDate)
}

export function getCalendarDateKeys(dateKey: string, mode: CalendarMode) {
  const selectedDate = parseDateKey(dateKey)
  const firstDate =
    mode === "week"
      ? startOfWeek(selectedDate)
      : startOfWeek(createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const lastDate =
    mode === "week"
      ? endOfWeek(selectedDate)
      : endOfWeek(createLocalDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0))
  const dates: string[] = []

  for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
    dates.push(formatDateKey(date))
  }

  return dates
}

export function getDateParts(dateKey: string) {
  const date = parseDateKey(dateKey)

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

export function isDateKeyInSelectedMonth(dateKey: string, selectedDateKey: string) {
  const date = parseDateKey(dateKey)
  const selectedDate = parseDateKey(selectedDateKey)

  return (
    date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === selectedDate.getMonth()
  )
}
