import {
  AppInfoList,
  AppPill,
  AppScreenShell,
  AppSectionCard,
} from "@/components/app-screen-shell";
import {
  type DashboardPageSearchParams,
  feedbackCategories,
  loadDashboardPageData,
} from "@/lib/route-page-data";
import { appRoutes } from "@/lib/routes";

interface FeedbackPageProps {
  searchParams?: Promise<DashboardPageSearchParams>;
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const { dashboard } = await loadDashboardPageData(searchParams);

  const sidebar = (
    <>
      <AppSectionCard
        title="현재 시스템 알림"
        description="질문 품질이나 색인 상태와 관련된 최근 알림입니다."
      >
        {dashboard.alerts.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">지금은 표시할 운영 알림이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {dashboard.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-3xl border border-amber-100 bg-amber-50/90 p-4"
              >
                <div className="flex items-center gap-2">
                  <AppPill tone="amber">{alert.severity}</AppPill>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{alert.body}</p>
              </div>
            ))}
          </div>
        )}
      </AppSectionCard>

      <AppSectionCard
        title="처리 기준"
        description="신고 내용에 따라 우선순위와 대응 시간이 달라집니다."
      >
        <AppInfoList
          items={[
            { label: "권한 노출", value: "즉시 확인" },
            { label: "출처 오류", value: "영업일 1일 내" },
            { label: "답변 품질 개선", value: "주간 묶음 검토" },
          ]}
        />
      </AppSectionCard>
    </>
  );

  return (
    <AppScreenShell
      eyebrow="피드백"
      title="답변 품질과 권한 오류를 바로 접수하는 화면"
      description="출처가 이상하거나, 권한 범위를 벗어난 내용이 보이거나, 답변이 부정확할 때 어떤 정보를 남기면 되는지 한 눈에 정리했습니다."
      breadcrumbs={[{ href: appRoutes.home, label: "홈" }, { label: "피드백" }]}
      actions={[
        { href: appRoutes.newChat, label: "질문 다시 해보기", tone: "primary" },
        { href: appRoutes.home, label: "대시보드", tone: "secondary" },
      ]}
      sidebar={sidebar}
    >
      <AppSectionCard
        title="어떤 문제를 신고하나요"
        description="실제 접수에서 가장 많이 쓰는 유형입니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {feedbackCategories.map((category) => (
            <article
              key={category.title}
              className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5"
            >
              <AppPill tone="rose">신고 유형</AppPill>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{category.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>
            </article>
          ))}
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="접수 시 꼭 남겨야 하는 정보"
        description="재현과 확인에 필요한 정보만 남기면 처리 속도가 크게 빨라집니다."
      >
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
            문제가 발생한 질문 문장과 시간, 어느 화면에서 봤는지 함께 적습니다.
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
            보였던 출처 문서 제목, 잘못된 부분, 기대한 답변을 함께 남기면 확인이 빨라집니다.
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
            권한 이슈는 스크린샷보다 문서 제목과 공개 범위를 먼저 남기는 편이 더 중요합니다.
          </div>
        </div>
      </AppSectionCard>

      <AppSectionCard
        title="복붙해서 쓰는 접수 템플릿"
        description="메신저나 이슈 트래커에 그대로 붙여 넣을 수 있습니다."
      >
        <pre className="overflow-x-auto rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 text-sm leading-6 text-slate-700">
          {`[유형] 출처 오류 / 권한 노출 / 부정확 답변
[발생 시각] 2026-03-14 14:30
[질문] 예: 신규 입사자 온보딩 문서를 정리해 줘
[문제] 예: 최신 문서가 아닌 이전 버전이 인용됨
[기대한 결과] 예: 2026년 3월 개정본 기준으로 답변`}
        </pre>
      </AppSectionCard>
    </AppScreenShell>
  );
}
