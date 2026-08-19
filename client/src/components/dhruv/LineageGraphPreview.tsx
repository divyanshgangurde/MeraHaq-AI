import { ArrowRight, Network } from "lucide-react";
import { useState } from "react";

export function LineageGraphPreview() {
  const [selectedNode, setSelectedNode] = useState<
    "Historical document" | "Follow-up document" | "Applicable evidence"
  >("Applicable evidence");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E6E8EB] bg-[#FBFCFD] p-5 sm:p-6">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            Policy lineage
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            Relationship graph preview
          </h3>
        </div>
        <Network className="size-5 text-[#142B4A]" strokeWidth={1.7} />
      </div>

      <div className="relative z-10 mt-8 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <GraphNode
          label="Historical document"
          tone="historical"
          selected={selectedNode === "Historical document"}
          onSelect={() => setSelectedNode("Historical document")}
        />
        <GraphEdge label="AMENDS" />
        <GraphNode
          label="Follow-up document"
          tone="review"
          selected={selectedNode === "Follow-up document"}
          onSelect={() => setSelectedNode("Follow-up document")}
        />
        <GraphEdge label="REFERENCES" />
        <GraphNode
          label="Applicable evidence"
          tone="current"
          selected={selectedNode === "Applicable evidence"}
          onSelect={() => setSelectedNode("Applicable evidence")}
        />
      </div>

      <div className="relative z-10 mt-6 rounded-2xl border border-[#E6E8EB] bg-white/80 p-3.5">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6F7782]">
          Selected node
        </p>
        <p className="mt-1 text-sm font-bold text-[#142B4A]">{selectedNode}</p>
        <p className="mt-1 text-xs leading-5 text-[#6F7782]">
          This interactive preview will show a real title, authority, date,
          source link, page evidence, and verification status only after the
          curated official corpus is validated.
        </p>
      </div>
      <span className="absolute -bottom-20 -right-20 size-56 rounded-full border border-[#43A957]/10" />
      <span className="absolute -bottom-8 -right-8 size-32 rounded-full border border-[#F4A51C]/15" />
    </section>
  );
}

function GraphEdge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-[0.1em] text-[#6F7782] md:flex-col">
      <ArrowRight className="size-4 text-[#F4A51C]" strokeWidth={1.8} />
      <span>{label}</span>
    </div>
  );
}

function GraphNode({
  label,
  tone,
  selected,
  onSelect,
}: {
  label: "Historical document" | "Follow-up document" | "Applicable evidence";
  tone: "historical" | "review" | "current";
  selected: boolean;
  onSelect: () => void;
}) {
  const tones = {
    historical: "border-[#E6E8EB] bg-white text-[#6F7782]",
    review: "border-[#F4A51C]/40 bg-[#FFF9EE] text-[#A86B00]",
    current: "border-[#43A957]/40 bg-[#F1FAF3] text-[#348847]",
  };
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border px-3 py-4 text-center text-xs font-bold leading-5 shadow-[0_8px_20px_rgba(20,43,74,0.04)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43A957] ${selected ? "ring-2 ring-[#43A957]/25" : ""} ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
