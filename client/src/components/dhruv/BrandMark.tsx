import { Compass } from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label="DHRUV AI — Your Policy Guide">
      <div
        className={`${compact ? "size-10" : "size-12"} relative grid shrink-0 place-items-center rounded-2xl border border-[#142B4A]/10 bg-white shadow-[0_8px_20px_rgba(20,43,74,0.08)]`}
      >
        <span className="absolute inset-[5px] rounded-xl border border-[#F4A51C]/45" />
        <span className="absolute inset-[9px] rounded-lg border border-[#43A957]/35" />
        <Compass className="relative size-5 text-[#142B4A]" strokeWidth={1.8} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#F4A51C]" />
      </div>
      <div className="leading-none">
        <p className={`${compact ? "text-[14px]" : "text-[16px]"} font-extrabold tracking-[0.14em] text-[#142B4A]`}>
          DHRUV AI
        </p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.08em] text-[#6F7782]">
          YOUR POLICY GUIDE
        </p>
      </div>
    </div>
  );
}
