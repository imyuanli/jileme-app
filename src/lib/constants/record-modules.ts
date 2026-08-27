import type { SymbolViewProps } from "expo-symbols"

import type { HomeModuleId } from "@/types/home"

export type RecordModule = {
  id: HomeModuleId
  name: string
  summary: string
  status: "可进入" | "待开放"
  icon: SymbolViewProps["name"]
}

export const RECORD_MODULES = [
  {
    id: "accounting",
    name: "记账",
    summary: "记录收入、支出、预算和账本",
    status: "可进入",
    icon: { ios: "yensign.circle", android: "payments" },
  },
  {
    id: "diary",
    name: "日记",
    summary: "承接每天的心情和事件",
    status: "待开放",
    icon: { ios: "book.closed", android: "book" },
  },
  {
    id: "mood",
    name: "心情",
    summary: "标记今天的状态",
    status: "待开放",
    icon: { ios: "heart", android: "favorite" },
  },
  {
    id: "essay",
    name: "随笔",
    summary: "收纳随时冒出来的想法",
    status: "待开放",
    icon: { ios: "square.and.pencil", android: "edit_note" },
  },
  {
    id: "habit",
    name: "打卡",
    summary: "追踪习惯的完成情况",
    status: "待开放",
    icon: { ios: "checkmark.circle", android: "task_alt" },
  },
  {
    id: "schedule",
    name: "日程",
    summary: "安排待办和提醒",
    status: "待开放",
    icon: { ios: "calendar", android: "calendar_month" },
  },
  {
    id: "goals",
    name: "目标",
    summary: "推进长期计划",
    status: "待开放",
    icon: { ios: "target", android: "flag" },
  },
  {
    id: "notes",
    name: "笔记",
    summary: "保存资料或生活片段",
    status: "待开放",
    icon: { ios: "note.text", android: "note" },
  },
] as const satisfies readonly RecordModule[]

export function getRecordModule(moduleId: string | undefined) {
  return RECORD_MODULES.find((module) => module.id === moduleId)
}
