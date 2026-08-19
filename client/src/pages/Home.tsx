import { BrandMark } from "@/components/dhruv/BrandMark";
import { MockAnswerCard } from "@/components/dhruv/MockAnswerCard";
import { QuestionComposer } from "@/components/dhruv/QuestionComposer";
import { TrustIndicator } from "@/components/dhruv/TrustIndicator";
import {
  AlertCircle,
  BookOpenCheck,
  FileText,
  Globe2,
  History,
  Loader2,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";

type ViewState = "idle" | "loading" | "answer" | "error" | "timeout";
type GroundedAnswer = {
  answer: string;
  verificationState: "VERIFIED" | "AMBIGUOUS" | "UNVERIFIED";
  caution: string | null;
  citations: Array<{
    title: string;
    sourceUrl: string;
    pageStart: number;
    pageEnd: number;
    quote: string;
    lineageStatus:
      | "CURRENT_VERIFIED"
      | "HISTORICAL"
      | "AMBIGUOUS"
      | "UNVERIFIED";
  }>;
};

export default function Home() {
  const initialPreview =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("preview");
  const [question, setQuestion] = useState(() =>
    initialPreview === "answer" || initialPreview === "loading"
      ? "How does this policy change affect eligibility?"
      : initialPreview === "error"
        ? "AI"
        : ""
  );
  const [viewState, setViewState] = useState<ViewState>(() =>
    initialPreview === "answer" ||
    initialPreview === "error" ||
    initialPreview === "loading"
      ? initialPreview
      : "idle"
  );
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const answerMutation = trpc.dhruv.answer.useMutation();
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  function clearRequestTimeout() {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }

  useEffect(() => () => clearRequestTimeout(), []);

  function submitQuestion(submittedQuestion: string) {
    if (submittedQuestion.length < 5) {
      setErrorMessage(
        "Try naming a scheme, policy topic, or eligibility question so DHRUV AI can retrieve the right evidence."
      );
      setViewState("error");
      return;
    }

    clearRequestTimeout();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setErrorMessage(null);
    setViewState("loading");
    setAnswer(null);
    requestTimeoutRef.current = setTimeout(() => {
      if (requestIdRef.current === requestId) {
        setViewState("timeout");
      }
    }, 25_000);

    answerMutation.mutate(
      { question: submittedQuestion },
      {
        onSuccess: result => {
          if (requestIdRef.current !== requestId) return;
          clearRequestTimeout();
          setAnswer(result);
          setViewState("answer");
        },
        onError: () => {
          if (requestIdRef.current !== requestId) return;
          clearRequestTimeout();
          setErrorMessage(
            "DHRUV AI could not complete this evidence check. Please try again in a moment."
          );
          setViewState("error");
        },
      }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    submitQuestion(question.trim());
  }

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#142B4A]">
      <div className="h-[4px] w-full bg-[linear-gradient(90deg,#F4A51C_0%,#F4A51C_33.33%,#FFFFFF_33.33%,#FFFFFF_66.66%,#43A957_66.66%,#43A957_100%)]" />
      <header className="relative z-20 border-b border-[#142B4A]/[0.06] bg-white/90 backdrop-blur">
        <div className="container flex h-[92px] items-center justify-between">
          <BrandMark />
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Main navigation"
          >
            {["Home", "Schemes", "Policy Check", "Updates", "About Us"].map(
              item => (
                <a
                  key={item}
                  href={item === "Home" ? "#home" : "#preview"}
                  className={`text-sm font-bold transition ${item === "Home" ? "text-[#142B4A]" : "text-[#6F7782] hover:text-[#142B4A]"}`}
                >
                  {item}
                </a>
              )
            )}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-xl border border-[#E6E8EB] bg-white px-3.5 py-2 text-sm font-bold text-[#142B4A] transition hover:border-[#43A957]/50 hover:bg-[#F7FBF8] sm:inline-flex"
            >
              <Globe2 className="size-4" /> English
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-[#E6E8EB] text-[#142B4A] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="home" className="relative">
        <div className="dhruv-flow dhruv-flow-left" aria-hidden="true" />
        <div className="dhruv-flow dhruv-flow-right" aria-hidden="true" />
        <div className="dhruv-heritage" aria-hidden="true" />

        <section className="container relative z-10 pb-14 pt-20 text-center sm:pb-20 sm:pt-28 lg:pb-24">
          <div className="mx-auto grid size-[72px] place-items-center rounded-[26px] border border-[#142B4A]/10 bg-white shadow-[0_16px_45px_rgba(20,43,74,0.08)]">
            <BookOpenCheck
              className="size-8 text-[#142B4A]"
              strokeWidth={1.55}
            />
          </div>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-[#6F7782]">
            MeraHaq AI · Government policy platform
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[38px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#142B4A] sm:text-[48px] lg:text-[54px]">
            Your right to <span className="text-[#F4A51C]">verified</span> policy information.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-7 text-[#6F7782] sm:text-[19px]">
            Understand government schemes and policies with information that is
            current, traceable, and checked against official sources.
          </p>

          <div className="mt-10">
            <div className="mb-4 flex flex-col items-center gap-1.5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#43A957]">
                DHRUV AI · Your policy guide
              </p>
              <p className="text-lg font-extrabold tracking-[-0.02em] text-[#142B4A]">
                How can I help you today?
              </p>
            </div>
            <QuestionComposer
              value={question}
              onChange={setQuestion}
              onSubmit={handleSubmit}
              isLoading={viewState === "loading"}
            />
          </div>

          <div className="mx-auto mt-8 grid max-w-[880px] gap-5 text-left sm:grid-cols-3 sm:gap-7">
            <TrustIndicator
              icon={FileText}
              title="Latest Information"
              description="Evidence-led policy updates"
              accent="saffron"
            />
            <TrustIndicator
              icon={ShieldCheck}
              title="Verified & Reliable"
              description="Sources checked before display"
              accent="green"
            />
            <TrustIndicator
              icon={History}
              title="Track Policy Changes"
              description="See how documents connect"
              accent="navy"
            />
          </div>

          {viewState === "loading" && (
            <div className="mx-auto mt-10 flex max-w-[700px] items-center justify-center gap-3 rounded-2xl border border-[#E6E8EB] bg-white px-5 py-4 text-sm font-bold text-[#142B4A] shadow-[0_10px_30px_rgba(20,43,74,0.06)]">
              <Loader2 className="size-5 animate-spin text-[#43A957]" />
              DHRUV AI is checking official evidence and policy lineage...
            </div>
          )}

          {viewState === "error" && (
            <div
              role="alert"
              className="mx-auto mt-10 flex max-w-[700px] items-start gap-3 rounded-2xl border border-[#F4A51C]/35 bg-[#FFF9EE] px-5 py-4 text-left shadow-[0_10px_30px_rgba(20,43,74,0.06)]"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#D88900]" />
              <div>
                <p className="text-sm font-bold text-[#142B4A]">
                  Add a little more policy context
                </p>
                <p className="mt-1 text-sm leading-6 text-[#6F7782]">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {viewState === "timeout" && (
            <div
              role="status"
              className="mx-auto mt-10 flex max-w-[700px] flex-col gap-3 rounded-2xl border border-[#F4A51C]/35 bg-[#FFF9EE] px-5 py-4 text-left shadow-[0_10px_30px_rgba(20,43,74,0.06)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#D88900]" />
                <div>
                  <p className="text-sm font-bold text-[#142B4A]">
                    The evidence check is taking longer than expected
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6F7782]">
                    Your question is still safe to retry. DHRUV AI will only show
                    answers supported by indexed official evidence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => submitQuestion(question.trim())}
                className="shrink-0 rounded-xl bg-[#142B4A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1E3D66] active:scale-[0.97]"
              >
                Try again
              </button>
            </div>
          )}

          {viewState === "answer" && (
            <div id="preview">
              <MockAnswerCard
                question={question}
                response={answer ?? undefined}
              />
            </div>
          )}
        </section>

        <section className="relative z-10 border-y border-[#E6E8EB] bg-[#F8FAFC]">
          <div className="container grid gap-7 py-10 sm:grid-cols-3 sm:py-12">
            {[
              [
                "01",
                "Find official evidence",
                "DHRUV AI retrieves only documents that belong to MeraHaq AI’s curated, traceable policy corpus.",
              ],
              [
                "02",
                "Check policy lineage",
                "Candidate documents will be compared with amendments, corrections, and other evidence-backed relationships.",
              ],
              [
                "03",
                "Show uncertainty clearly",
                "When current applicability is unclear, the product will warn rather than produce an unsupported answer.",
              ],
            ].map(([number, title, copy]) => (
              <article
                key={number}
                className="border-l-2 border-[#F4A51C]/50 pl-5 last:border-[#43A957]/60"
              >
                <p className="text-xs font-extrabold tracking-[0.16em] text-[#F4A51C]">
                  {number}
                </p>
                <h2 className="mt-2 text-base font-extrabold text-[#142B4A]">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6F7782]">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-white">
        <div className="container flex flex-col gap-6 py-9 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark compact />
          <p className="max-w-md text-sm leading-6 text-[#6F7782] sm:text-right">
            Empowering citizens with accurate policy information
          </p>
        </div>
        <div className="h-px bg-[linear-gradient(90deg,transparent_0%,#F4A51C_25%,#E6E8EB_50%,#43A957_75%,transparent_100%)]" />
      </footer>
    </div>
  );
}
