import { Search, Send } from "lucide-react";
import type { FormEvent } from "react";

type QuestionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
};

export function QuestionComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
}: QuestionComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="group relative mx-auto flex w-full max-w-[900px] items-center rounded-[25px] border border-[#E6E8EB] bg-white p-3 shadow-[0_18px_55px_rgba(20,43,74,0.10)] transition-shadow duration-200 hover:shadow-[0_22px_65px_rgba(20,43,74,0.13)] focus-within:border-[#43A957]/45 focus-within:shadow-[0_20px_62px_rgba(67,169,87,0.16)]"
    >
      <Search
        className="ml-4 size-5 shrink-0 text-[#6F7782]"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <label className="sr-only" htmlFor="policy-question">
        Ask a policy question
      </label>
      <input
        id="policy-question"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-[78px] min-w-0 flex-1 bg-transparent px-4 text-[16px] font-medium text-[#142B4A] outline-none placeholder:text-[#8A929D] sm:text-[17px]"
        placeholder="Type your question here... (e.g., PM Kisan Yojana eligibility)"
        maxLength={1000}
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="grid size-[64px] shrink-0 place-items-center rounded-[19px] bg-[#EDF8EF] text-[#43A957] transition duration-150 hover:bg-[#DDF3E1] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Submit policy question"
      >
        <Send className="size-[23px]" strokeWidth={1.9} />
      </button>
    </form>
  );
}
