import type { AccountingType } from "@/types/accounting"

const ACCOUNTING_CATEGORY_LABELS: Record<AccountingType, Record<string, string>> = {
  expense: {
    food: "餐饮",
    shopping: "购物",
    daily: "日用",
    transport: "交通",
    vegetables: "蔬菜",
    fruit: "水果",
    snacks: "零食",
    sports: "运动",
    entertainment: "娱乐",
    communication: "通讯",
    clothing: "服饰",
    beauty: "美容",
    housing: "住房",
    home: "居家",
    children: "孩子",
    elders: "长辈",
    social: "社交",
    travel: "旅行",
    tobacco_alcohol: "烟酒",
    digital: "数码",
    car: "汽车",
    medical: "医疗",
    books: "书籍",
    study: "学习",
    pets: "宠物",
    cash_gift: "礼金",
    gift: "礼物",
    office: "办公",
    repair: "维修",
    donation: "捐赠",
    lottery: "彩票",
    family_friends: "亲友",
    delivery: "快递",
  },
  income: {
    salary: "工资",
    part_time: "兼职",
    investment: "理财",
    cash_gift: "礼金",
    other: "其它",
  },
}

export function getAccountingCategoryLabel(type: AccountingType, code: string) {
  return ACCOUNTING_CATEGORY_LABELS[type][code] ?? "其它"
}
