export type LineageCitationRef = { title: string };

export type LineageNodeData = {
  id: number;
  title: string;
  documentType: string;
  issuingAuthority: string;
  issuedOn: string | null;
  sourceUrl: string;
  isOfficial: boolean;
  status: string;
};

export type LineageEdgeData = {
  sourceDocumentId: number;
  targetDocumentId: number;
  relationshipType: string;
  verificationState: string;
  confidence: number;
};

export type LineageSchemeData = {
  schemeSlug: string;
  schemeName: string;
  nodes: LineageNodeData[];
  edges: LineageEdgeData[];
};

const SCHEME_LABELS: Record<string, string> = {
  "pm-kisan": "PM-KISAN",
  "jal-jeevan-mission": "Jal Jeevan Mission",
  "national-livestock-mission": "National Livestock Mission",
};

export function shortSchemeLabel(slug: string): string {
  return (
    SCHEME_LABELS[slug] ??
    slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/** The scheme chain an answer belongs to: the one containing a cited document. */
export function pickSchemeChain(
  schemes: LineageSchemeData[],
  citations: LineageCitationRef[]
): LineageSchemeData | undefined {
  if (citations.length > 0) {
    const match = schemes.find(scheme =>
      scheme.nodes.some(node => node.title === citations[0].title)
    );
    if (match) return match;
  }
  return schemes[0];
}

export function orderNodes(nodes: LineageNodeData[]): LineageNodeData[] {
  return [...nodes].sort((a, b) => {
    if (a.issuedOn && b.issuedOn)
      return a.issuedOn.localeCompare(b.issuedOn) || a.id - b.id;
    if (a.issuedOn) return -1;
    if (b.issuedOn) return 1;
    return a.id - b.id;
  });
}

export function formatIssuedOn(iso: string | null): string {
  if (!iso) return "Date not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusTone(status: string): string {
  switch (status) {
    case "CURRENT_VERIFIED":
      return "border-[#43A957]/40 bg-[#F1FAF3] text-[#348847]";
    case "HISTORICAL":
      return "border-[#E6E8EB] bg-white text-[#6F7782]";
    default:
      return "border-[#F4A51C]/40 bg-[#FFF9EE] text-[#A86B00]";
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case "CURRENT_VERIFIED":
      return "#43A957";
    case "HISTORICAL":
      return "#6F7782";
    default:
      return "#F4A51C";
  }
}
