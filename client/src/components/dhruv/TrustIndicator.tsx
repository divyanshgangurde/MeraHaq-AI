import type { LucideIcon } from "lucide-react";

type TrustIndicatorProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "saffron" | "green" | "navy";
};

const accentClasses = {
  saffron: "bg-[#FFF6E4] text-[#D88900]",
  green: "bg-[#EDF8EF] text-[#348847]",
  navy: "bg-[#EFF4FA] text-[#142B4A]",
};

export function TrustIndicator({ icon: Icon, title, description, accent }: TrustIndicatorProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-left">
      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${accentClasses[accent]}`}>
        <Icon className="size-[19px]" strokeWidth={1.9} />
      </span>
      <div>
        <p className="text-sm font-bold text-[#142B4A]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#6F7782]">{description}</p>
      </div>
    </div>
  );
}
