import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileText,
  LockKeyhole,
  Quote,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { LineageGraphPreview } from "./LineageGraphPreview";
import { PolicyTimelinePreview } from "./PolicyTimelinePreview";

type Citation = {
  title: string;
  sourceUrl: string;
  pageStart: number;
  pageEnd: number;
  quote: string;
  lineageStatus: "CURRENT_VERIFIED" | "HISTORICAL" | "AMBIGUOUS" | "UNVERIFIED";
};

type GroundedResponse = {
  answer: string;
  verificationState: "VERIFIED" | "AMBIGUOUS" | "UNVERIFIED";
  caution: string | null;
  citations: Citation[];
};

type MockAnswerCardProps = {
  question: string;
  response?: GroundedResponse;
};

export function MockAnswerCard({ question, response }: MockAnswerCardProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const citations = response?.citations ?? [];
  const verificationState = response?.verificationState ?? "UNVERIFIED";

  return (
    <section className="mx-auto mt-10 w-full max-w-[1060px] rounded-[30px] border border-[#E6E8EB] bg-white p-5 shadow-[0_22px_70px_rgba(20,43,74,0.08)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-[#E6E8EB] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            {response
              ? "MeraHaq AI · DHRUV AI evidence response"
              : "MeraHaq AI · DHRUV AI preview response"}
          </p>
          <h2 className="mt-2 text-xl font-extrabold leading-tight text-[#142B4A] sm:text-2xl">
            {response
              ? response.answer
              : "Your policy research flow is ready for source validation."}
          </h2>
          {!response && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F7782]">
              The interface has captured your question and is prepared to
              retrieve official documents, check their lineage, and present an
              evidence-backed result once the first curated document chain is
              connected.
            </p>
          )}
          {response?.caution && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A86B00]">
              {response.caution}
            </p>
          )}
        </div>
        <VerificationBadge state={verificationState} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#E6E8EB] bg-[#F9FAFB] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6F7782]">
          Submitted question
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#142B4A]">
          “{question}”
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <EvidencePreview
            citations={citations}
            onOpenDetail={() => setDetailOpen(true)}
          />
          {historyExpanded && <PolicyTimelinePreview />}
        </div>
        {historyExpanded ? (
          <LineageGraphPreview />
        ) : (
          <PolicyHistoryPlaceholder onExpand={() => setHistoryExpanded(true)} />
        )}
      </div>

      {detailOpen && (
        <DocumentDetailPanel
          citation={citations[0]}
          onClose={() => setDetailOpen(false)}
        />
      )}

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#F4A51C]/30 bg-[#FFF9EE] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <ShieldAlert
            className="mt-0.5 size-5 shrink-0 text-[#D88900]"
            strokeWidth={1.9}
          />
          <div>
            <p className="text-sm font-bold text-[#142B4A]">
              Evidence integrity is enforced
            </p>
            <p className="mt-1 text-xs leading-5 text-[#6F7782]">
              DHRUV AI only renders a citation when its quote occurs in indexed
              source text and a source URL and page span are present.
            </p>
          </div>
        </div>
        <button
          onClick={() => setHistoryExpanded(current => !current)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#142B4A] transition hover:text-[#43A957]"
          type="button"
          aria-expanded={historyExpanded}
        >
          {historyExpanded ? "Hide policy history" : "View policy history"}{" "}
          <ChevronRight
            className={`size-4 transition-transform ${historyExpanded ? "rotate-90" : ""}`}
          />
        </button>
      </div>
    </section>
  );
}

function PolicyHistoryPlaceholder({ onExpand }: { onExpand: () => void }) {
  return (
    <section className="flex min-h-[260px] flex-col justify-between rounded-3xl border border-dashed border-[#D9DDE2] bg-[#FBFCFD] p-6 text-left">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
          Interactive lineage
        </p>
        <h3 className="mt-2 text-lg font-bold text-[#142B4A]">
          Open the policy history view
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#6F7782]">
          The interactive graph activates once an answer is available. It will
          distinguish historical evidence from current applicable evidence and
          preserve uncertainty where the corpus does not establish a current
          status.
        </p>
      </div>
      <button
        onClick={onExpand}
        className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#142B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1E3D66] active:scale-[0.97]"
        type="button"
      >
        Open lineage preview <ChevronRight className="size-4" />
      </button>
    </section>
  );
}

function VerificationBadge({
  state,
}: {
  state: GroundedResponse["verificationState"];
}) {
  const tones = {
    VERIFIED: "border-[#43A957]/35 bg-[#F1FAF3] text-[#348847]",
    AMBIGUOUS: "border-[#F4A51C]/35 bg-[#FFF9EE] text-[#A86B00]",
    UNVERIFIED: "border-[#F4A51C]/35 bg-[#FFF9EE] text-[#A86B00]",
  };
  const Icon = state === "VERIFIED" ? CheckCircle2 : CircleAlert;
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-extrabold tracking-[0.08em] ${tones[state]}`}
    >
      <Icon className="size-4" strokeWidth={2} />
      {state}
    </div>
  );
}

function EvidencePreview({
  citations,
  onOpenDetail,
}: {
  citations: Citation[];
  onOpenDetail: () => void;
}) {
  return (
    <section className="rounded-3xl border border-[#E6E8EB] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            Citation ledger
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            Official-source evidence
          </h3>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-[#EFF4FA] text-[#142B4A]">
          <FileText className="size-[18px]" />
        </span>
      </div>
      {citations.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#D9DDE2] bg-[#F9FAFB] p-4">
          <div className="flex gap-3">
            <LockKeyhole
              className="mt-0.5 size-5 shrink-0 text-[#6F7782]"
              strokeWidth={1.8}
            />
            <div>
              <p className="text-sm font-bold text-[#142B4A]">
                No validated citation is available
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6F7782]">
                DHRUV AI abstains instead of showing an unverified source, page,
                or quote.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {citations.map(citation => (
            <article
              key={`${citation.sourceUrl}-${citation.pageStart}`}
              className="rounded-2xl border border-[#E6E8EB] bg-[#F9FAFB] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#142B4A]">
                    {citation.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#6F7782]">
                    Pages {citation.pageStart}–{citation.pageEnd} ·{" "}
                    {citation.lineageStatus}
                  </p>
                </div>
                <a
                  href={citation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#348847] hover:underline"
                >
                  Source <ExternalLink className="size-3.5" />
                </a>
              </div>
              <p className="mt-3 border-l-2 border-[#43A957]/55 pl-3 text-sm leading-6 text-[#142B4A]">
                “{citation.quote}”
              </p>
            </article>
          ))}
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PreviewFact
          icon={Quote}
          title="Quoted evidence"
          copy="Validated against indexed page text"
        />
        <PreviewFact
          icon={ExternalLink}
          title="Source link"
          copy="Resolved only to a stored official URL"
        />
      </div>
      <button
        onClick={onOpenDetail}
        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#142B4A] transition hover:text-[#43A957]"
        type="button"
      >
        Open document detail <ChevronRight className="size-4" />
      </button>
    </section>
  );
}

function DocumentDetailPanel({
  citation,
  onClose,
}: {
  citation?: Citation;
  onClose: () => void;
}) {
  const pending = "Pending official-source validation";
  return (
    <section
      className="mt-6 rounded-3xl border border-[#E6E8EB] bg-[#FBFCFD] p-5 sm:p-6"
      aria-label="Document detail"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#D88900]">
            {citation
              ? "Validated citation detail"
              : "Unverified document-detail preview"}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            {citation
              ? citation.title
              : "Official source fields appear after corpus validation"}
          </h3>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="rounded-xl border border-[#E6E8EB] bg-white px-3 py-2 text-xs font-bold text-[#142B4A] transition hover:border-[#43A957]/45"
        >
          Close detail
        </button>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailField
          label="Source URL"
          value={citation?.sourceUrl ?? pending}
        />
        <DetailField
          label="Page reference"
          value={
            citation
              ? `Pages ${citation.pageStart}–${citation.pageEnd}`
              : pending
          }
        />
        <DetailField
          label="Lineage status"
          value={
            citation?.lineageStatus ?? "Pending evidence-backed classification"
          }
        />
        <DetailField
          label="Verification"
          value={citation ? "Citation validated against indexed text" : pending}
        />
      </dl>
      <div className="mt-4 rounded-2xl border border-dashed border-[#D9DDE2] bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6F7782]">
          Quoted evidence
        </p>
        <p className="mt-2 text-sm leading-6 text-[#6F7782]">
          {citation
            ? `“${citation.quote}”`
            : "No quote is displayed in preview mode. DHRUV AI renders this area only when the quote is found in indexed source text and linked to its exact page."}
        </p>
      </div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E6E8EB] bg-white p-3.5">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#6F7782]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-5 text-[#142B4A]">
        {value}
      </dd>
    </div>
  );
}

function PreviewFact({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof CheckCircle2;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-2xl bg-[#F5F6F7] p-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-[#43A957]"
        strokeWidth={1.9}
      />
      <div>
        <p className="text-xs font-bold text-[#142B4A]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-[#6F7782]">{copy}</p>
      </div>
    </div>
  );
}
