import type { RecentChat } from "@rockask/types";
import Link from "next/link";

import { SectionEmptyState } from "@/components/landing/section-empty-state";
import { appRoutes, chatDetailRoute } from "@/lib/routes";

export function RecentChatsSection({ recentChats }: { recentChats: RecentChat[] }) {
  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">최근 채팅</h2>
          <p className="mt-1 text-sm text-slate-500">다시 이어보기 쉬운 질문 흐름</p>
        </div>
        <Link href={appRoutes.chats} className="text-sm font-medium text-blue-700">
          전체 보기
        </Link>
      </div>

      {recentChats.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="최근 채팅이 아직 없습니다."
            description="첫 질문을 시작하면 최근 채팅이 이 영역에 표시되어 다시 이어볼 수 있습니다."
            actionHref={appRoutes.chatNew}
            actionLabel="새 질문 시작"
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {recentChats.map((chat) => (
            <Link
              key={chat.id}
              href={chatDetailRoute(chat.id)}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/40"
            >
              <p className="text-sm font-semibold text-slate-900">{chat.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {chat.assistantName} · {chat.lastMessageRelative}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
