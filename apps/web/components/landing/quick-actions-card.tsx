import Link from "next/link";

import { appRoutes } from "@/lib/routes";

const quickActions = [
  {
    title: "새 질문 시작",
    helper: "전사 문서에서 바로 검색",
    href: appRoutes.chatNew,
  },
  {
    title: "문서 업로드",
    helper: "PDF, Word, PPT, 위키 반영",
    href: appRoutes.documentsUpload,
  },
  {
    title: "컬렉션 관리",
    helper: "팀별 지식 공간과 접근 권한 설정",
    href: appRoutes.knowledgeSpaces,
  },
  {
    title: "오답 신고",
    helper: "출처 이상, 권한 오류, 부정확 답변 접수",
    href: appRoutes.feedback,
  },
] as const;

export function QuickActionsCard() {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">즉시 실행</p>
          <p className="mt-1 text-xs text-slate-500">가장 많이 쓰는 첫 화면 액션</p>
        </div>
        <span className="text-blue-600">⚡</span>
      </div>
      <div className="mt-5 grid gap-3">
        {quickActions.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
              <span className="block text-xs text-slate-500">{item.helper}</span>
            </span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
