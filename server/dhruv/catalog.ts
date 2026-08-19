import { desc, eq } from "drizzle-orm";
import { documents, schemes } from "../../drizzle/schema";
import { getDb } from "../db";

export async function listSupportedPolicyDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      schemeSlug: schemes.slug,
      schemeName: schemes.name,
      documentId: documents.id,
      title: documents.title,
      documentType: documents.documentType,
      issuedOn: documents.issuedOn,
      sourceUrl: documents.sourceUrl,
      processingState: documents.processingState,
      isOfficial: documents.isOfficial,
    })
    .from(documents)
    .innerJoin(schemes, eq(documents.schemeId, schemes.id))
    .where(eq(schemes.coverageStatus, "supported"))
    .orderBy(desc(documents.issuedOn));
}
