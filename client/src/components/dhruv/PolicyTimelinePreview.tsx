import { CalendarDays, FileText } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  formatIssuedOn,
  orderNodes,
  pickSchemeChain,
  shortSchemeLabel,
  statusDot,
  type LineageCitationRef,
} from "./lineageData";

export function PolicyTimelinePreview({
  citations = [],
}: {
  citations?: LineageCitationRef[];
}) {
  const lineageQuery = trpc.dhruv.lineage.useQuery();
  const schemes = useMemo(() => lineageQuery.data ?? [], [lineageQuery.data]);
  const active = useMemo(
    () => pickSchemeChain(schemes, citations),
    [schemes, citations]
  );
  const nodes = useMemo(
    () => (active ? orderNodes(active.nodes) : []),
    [active]
  );

  return (
    <section className="rounded-3xl border border-[#E6E8EB] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            Policy timeline
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            {active
              ? `${shortSchemeLabel(active.schemeSlug)} document history`
              : "Document history"}
          </h3>
        </div>
        <CalendarDays className="size-5 text-[#142B4A]" strokeWidth={1.7} />
      </div>
      <div className="mt-6 space-y-0">
        {lineageQuery.isLoading ? (
          <p className="text-sm leading-6 text-[#6F7782]">
            Loading document history…
          </p>
        ) : nodes.length === 0 ? (
          <p className="text-sm leading-6 text-[#6F7782]">
            No documents are in the verified corpus for this scheme yet.
          </p>
        ) : (
          nodes.map((node, index) => (
            <div className="relative flex gap-4 pb-5 last:pb-0" key={node.id}>
              {index < nodes.length - 1 && (
                <span className="absolute left-[9px] top-[20px] h-[calc(100%-2px)] w-px bg-[#E6E8EB]" />
              )}
              <span
                className="relative mt-1 size-5 shrink-0 rounded-full border-4 border-white"
                style={{ backgroundColor: statusDot(node.status) }}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-5 text-[#142B4A]">
                  {node.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6F7782]">
                  {formatIssuedOn(node.issuedOn)} · {node.documentType} ·{" "}
                  {node.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F5F6F7] px-3 py-2.5 text-xs leading-5 text-[#6F7782]">
        <FileText className="size-4 shrink-0 text-[#F4A51C]" />
        Only documents in the verified corpus are shown, in issue order.
      </div>
    </section>
  );
}
