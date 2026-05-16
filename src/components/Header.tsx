import SearchBar from "@/components/SearchBar";

type HeaderProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function Header({ searchTerm, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eadcc8]/80 bg-[#fffaf2]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#9F2B68] text-lg font-black text-[#f7d58b] shadow-[0_15px_40px_rgba(47,28,18,0.18)]">
            Z
          </div>
          <div className="hidden leading-none sm:block">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#2f1c12]">
              Zephico
            </p>
            <p className="mt-1 text-xs font-semibold text-[#9d7c52]">
              Fine Jewellery
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <SearchBar value={searchTerm} onChange={onSearchChange} />
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="rounded-full border border-[#d8bd8a] bg-white/60 px-5 py-2 text-sm font-bold text-[#4a2b17] transition hover:bg-[#fff4d8]">
            Treasure Chest
          </button>

          <button className="rounded-full border border-[#e7c8b2] bg-white/60 px-5 py-2 text-sm font-bold text-[#754225] transition hover:bg-[#fff1e8]">
            Stores
          </button>

          <button className="rounded-full bg-[#f4c76b] px-5 py-2 text-sm font-black text-[#2f1c12] shadow-[0_12px_28px_rgba(197,139,39,0.22)] transition hover:bg-[#ffd984]">
            Gold
          </button>
        </div>
      </div>
    </header>
  );
}
