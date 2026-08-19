import { BrandMark } from "@/components/dhruv/BrandMark";
import { MockAnswerCard } from "@/components/dhruv/MockAnswerCard";
import { QuestionComposer } from "@/components/dhruv/QuestionComposer";
import { TrustIndicator } from "@/components/dhruv/TrustIndicator";
import {
  BookOpenCheck,
  FileText,
  Globe2,
  History,
  Loader2,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";

type ViewState = "idle" | "loading" | "answer";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [viewState, setViewState] = useState<ViewState>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;

    setViewState("loading");
    window.setTimeout(() => setViewState("answer"), 850);
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
            Civic policy research, evidence first
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[38px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#142B4A] sm:text-[48px] lg:text-[54px]">
            How can I <span className="text-[#F4A51C]">help</span> you today?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-7 text-[#6F7782] sm:text-[19px]">
            Ask me about any government scheme or policy and get the latest,
            verified information.
          </p>

          <div className="mt-10">
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
              Preparing the evidence-first preview...
            </div>
          )}

          {viewState === "answer" && (
            <div id="preview">
              <MockAnswerCard question={question} />
            </div>
          )}
        </section>

        <section className="relative z-10 border-y border-[#E6E8EB] bg-[#F8FAFC]">
          <div className="container grid gap-7 py-10 sm:grid-cols-3 sm:py-12">
            {[
              [
                "01",
                "Find official evidence",
                "DHRUV AI is being designed to retrieve only documents that belong to the curated, traceable policy corpus.",
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
