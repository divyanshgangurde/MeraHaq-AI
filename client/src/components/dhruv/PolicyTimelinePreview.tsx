import { CalendarDays, FileText } from "lucide-react";

export function PolicyTimelinePreview() {
  return (
    <section className="rounded-3xl border border-[#E6E8EB] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6F7782]">
            Policy timeline
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#142B4A]">
            Document history preview
          </h3>
        </div>
        <CalendarDays className="size-5 text-[#142B4A]" strokeWidth={1.7} />
      </div>
      <div className="mt-6 space-y-0">
        {[
          [
            "Original instrument",
            "Awaiting official corpus connection",
            "#6F7782",
          ],
          ["Follow-up instrument", "Evidence review pending", "#F4A51C"],
          ["Applicable evidence", "Shown after lineage validation", "#43A957"],
        ].map(([title, copy, color], index) => (
          <div className="relative flex gap-4 pb-5 last:pb-0" key={title}>
            {index < 2 && (
              <span className="absolute left-[9px] top-[20px] h-[calc(100%-2px)] w-px bg-[#E6E8EB]" />
            )}
            <span
              className="relative mt-1 size-5 shrink-0 rounded-full border-4 border-white"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#142B4A]">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#6F7782]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F5F6F7] px-3 py-2.5 text-xs leading-5 text-[#6F7782]">
        <FileText className="size-4 shrink-0 text-[#F4A51C]" />
        This preview intentionally contains no unverified policy documents or
        citations.
      </div>
    </section>
  );
}
