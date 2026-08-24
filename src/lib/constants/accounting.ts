import type { AccountingPeriod, AccountingType } from "@/types/accounting"

export type AccountingCategory = {
  code: string
  label: string
}

export const ACCOUNTING_CATEGORIES: Record<AccountingType, AccountingCategory[]> = {
  expense: [
    { code: "food", label: "餐饮" },
    { code: "shopping", label: "购物" },
    { code: "daily", label: "日用" },
    { code: "transport", label: "交通" },
    { code: "vegetables", label: "蔬菜" },
    { code: "fruit", label: "水果" },
    { code: "snacks", label: "零食" },
    { code: "sports", label: "运动" },
    { code: "entertainment", label: "娱乐" },
    { code: "communication", label: "通讯" },
    { code: "clothing", label: "服饰" },
    { code: "beauty", label: "美容" },
    { code: "housing", label: "住房" },
    { code: "home", label: "居家" },
    { code: "children", label: "孩子" },
    { code: "elders", label: "长辈" },
    { code: "social", label: "社交" },
    { code: "travel", label: "旅行" },
    { code: "tobacco_alcohol", label: "烟酒" },
    { code: "digital", label: "数码" },
    { code: "car", label: "汽车" },
    { code: "medical", label: "医疗" },
    { code: "books", label: "书籍" },
    { code: "study", label: "学习" },
    { code: "pets", label: "宠物" },
    { code: "cash_gift", label: "礼金" },
    { code: "gift", label: "礼物" },
    { code: "office", label: "办公" },
    { code: "repair", label: "维修" },
    { code: "donation", label: "捐赠" },
    { code: "lottery", label: "彩票" },
    { code: "family_friends", label: "亲友" },
    { code: "delivery", label: "快递" },
  ],
  income: [
    { code: "salary", label: "工资" },
    { code: "part_time", label: "兼职" },
    { code: "investment", label: "理财" },
    { code: "cash_gift", label: "礼金" },
    { code: "other", label: "其它" },
  ],
}

export const ACCOUNTING_PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: "day", label: "今日" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
]

export const ACCOUNTING_CATEGORY_CODES: Record<AccountingType, Set<string>> = {
  expense: new Set(ACCOUNTING_CATEGORIES.expense.map((category) => category.code)),
  income: new Set(ACCOUNTING_CATEGORIES.income.map((category) => category.code)),
}

export function getAccountingCategory(type: AccountingType, code: string) {
  return ACCOUNTING_CATEGORIES[type].find((category) => category.code === code)
}

export function getAccountingCategoryLabel(type: AccountingType, code: string) {
  return getAccountingCategory(type, code)?.label ?? "其它"
}
