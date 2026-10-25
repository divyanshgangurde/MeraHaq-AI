import { ArrowRight, ExternalLink, Network } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  formatIssuedOn,
  orderNodes,
  pickSchemeChain,
  shortSchemeLabel,
  statusTone,
  type LineageCitationRef,
  type LineageEdgeData,
  type LineageNodeData,
} from "./lineageData";

export function LineageGraphPreview({
  citations = [],
}: {
  citations?: LineageCitationRef[];
}) {
  const lineageQuery = trpc.dhruv.lineage.useQuery();
  const schemes = useMemo(
    () => lineageQuery.data ?? [],
    [lineageQuery.data]
  );
  const suggested = useMemo(
    () => pickSchemeChain(schemes, citations),
    [schemes, citations]
  );
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const active =
    schemes.find(scheme => scheme.schemeSlug === slugOverride) ??
    suggested ??
    schemes[0];
  const nodes = useMemo(
    () => (active ? orderNodes(active.nodes) : []),
    [active]
  );
  const selected =
    nodes.find(node => node.id === selectedId) ??
    nodes.find(node => node.title === citations[0]?.title) ??
    nodes[nodes.length - 1];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E6E8EB] bg-[#FBFCFD] p-5 sm:p-6">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            Policy lineage
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            Relationship graph
          </h3>
        </div>
        <Network className="size-5 text-[#142B4A]" strokeWidth={1.7} />
      </div>

      {schemes.length > 1 && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {schemes.map(scheme => (
            <button
              key={scheme.schemeSlug}
              type="button"
              onClick={() => {
                setSlugOverride(scheme.schemeSlug);
                setSelectedId(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active?.schemeSlug === scheme.schemeSlug
                  ? "border-[#142B4A] bg-[#142B4A] text-white"
                  : "border-[#E6E8EB] bg-white text-[#6F7782] hover:border-[#43A957]/45"
              }`}
            >
              {shortSchemeLabel(scheme.schemeSlug)}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-6">
        {lineageQuery.isLoading ? (
          <p className="text-sm leading-6 text-[#6F7782]">
            Loading the verified document graph…
          </p>
        ) : !active || nodes.length === 0 ? (
          <p className="text-sm leading-6 text-[#6F7782]">
            No verified lineage is available yet. The graph appears once
            official documents and their relationships are in the corpus.
          </p>
        ) : (
          <div
            className="flex flex-col items-stretch gap-3 md:flex-row md:items-center"
            role="group"
            aria-label={`Lineage graph for ${active.schemeName}`}
          >
            {nodes.map((node, index) => (
              <Fragment key={node.id}>
                {index > 0 && (
                  <GraphEdge
                    edge={findEdge(active.edges, nodes[index - 1], node)}
                  />
                )}
                <GraphNode
                  node={node}
                  selected={selected?.id === node.id}
                  onSelect={() => setSelectedId(node.id)}
                />
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {active && nodes.length === 1 && (
        <p className="relative z-10 mt-4 text-xs leading-5 text-[#6F7782]">
          Only one document from this scheme is in the verified corpus so far,
          so no relationships can be shown yet.
        </p>
      )}

      {selected && (
        <div
          className="relative z-10 mt-6 rounded-2xl border border-[#E6E8EB] bg-white/80 p-3.5"
          aria-live="polite"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6F7782]">
            Selected document
          </p>
          <p className="mt-1 text-sm font-bold leading-5 text-[#142B4A]">
            {selected.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#6F7782]">
            {selected.documentType} · {selected.issuingAuthority} · Issued{" "}
            {formatIssuedOn(selected.issuedOn)} · Status: {selected.status}
          </p>
          {active &&
            describeRelations(active.edges, active.nodes, selected).map(
              line => (
                <p
                  key={line}
                  className="mt-1 text-xs font-semibold leading-5 text-[#348847]"
                >
                  {line}
                </p>
              )
            )}
          <a
            href={selected.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#348847] hover:underline"
          >
            Official source <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}
      <span className="absolute -bottom-20 -right-20 size-56 rounded-full border border-[#43A957]/10" />
      <span className="absolute -bottom-8 -right-8 size-32 rounded-full border border-[#F4A51C]/15" />
    </section>
  );
}

function findEdge(
  edges: LineageEdgeData[],
  a: LineageNodeData,
  b: LineageNodeData
): LineageEdgeData | undefined {
  return edges.find(
    edge =>
      (edge.sourceDocumentId === a.id && edge.targetDocumentId === b.id) ||
      (edge.sourceDocumentId === b.id && edge.targetDocumentId === a.id)
  );
}

const RELATION_VERBS: Record<string, [string, string]> = {
  AMENDS: ["Amends", "Amended by"],
  SUPERSEDES: ["Supersedes", "Superseded by"],
  REPLACES: ["Replaces", "Replaced by"],
  REVOKES: ["Revokes", "Revoked by"],
  EXTENDS: ["Extends", "Extended by"],
  CORRIGES: ["Corrects", "Corrected by"],
  REFERENCES: ["References", "Referenced by"],
  CONTINUES: ["Continues", "Continued by"],
};

function describeRelations(
  edges: LineageEdgeData[],
  nodes: LineageNodeData[],
  node: LineageNodeData
): string[] {
  const titleOf = (id: number) =>
    nodes.find(candidate => candidate.id === id)?.title ?? "another document";
  const lines: string[] = [];
  for (const edge of edges) {
    const [activeVerb, passiveVerb] = RELATION_VERBS[
      edge.relationshipType
    ] ?? [edge.relationshipType, `${edge.relationshipType} by`];
    const detail = `${edge.verificationState}, ${Math.round(edge.confidence * 100)}% confidence`;
    if (edge.sourceDocumentId === node.id) {
      lines.push(`${activeVerb}: ${titleOf(edge.targetDocumentId)} (${detail})`);
    } else if (edge.targetDocumentId === node.id) {
      lines.push(`${passiveVerb}: ${titleOf(edge.sourceDocumentId)} (${detail})`);
    }
  }
  return lines;
}

function GraphEdge({ edge }: { edge?: LineageEdgeData }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-[0.1em] text-[#6F7782] md:flex-col">
      <ArrowRight
        className="size-4 rotate-90 text-[#F4A51C] md:rotate-0"
        strokeWidth={1.8}
      />
      <span className="text-center">
        {edge
          ? `${edge.relationshipType}${edge.verificationState !== "VERIFIED" ? ` · ${edge.verificationState}` : ""}`
          : "IN CHAIN"}
      </span>
    </div>
  );
}

function GraphNode({
  node,
  selected,
  onSelect,
}: {
  node: LineageNodeData;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full flex-1 rounded-2xl border px-3 py-4 text-center shadow-[0_8px_20px_rgba(20,43,74,0.04)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43A957] ${selected ? "ring-2 ring-[#43A957]/25" : ""} ${statusTone(node.status)}`}
    >
      <span className="block text-xs font-bold leading-5">{node.title}</span>
      <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.1em] opacity-80">
        {node.documentType} · {formatIssuedOn(node.issuedOn)}
      </span>
      <span className="mt-0.5 block text-[10px] font-extrabold uppercase tracking-[0.1em] opacity-80">
        {node.status}
      </span>
    </button>
  );
}
