type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex h-14 w-full items-center overflow-hidden rounded-full border border-[#eadcc8] bg-[#fffaf2]/90 shadow-[0_18px_45px_rgba(85,54,25,0.1)] backdrop-blur">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search heirloom rings, gold bands, diamond edits..."
        className="h-full flex-1 bg-transparent px-6 text-sm text-[#352415] outline-none placeholder:text-[#9d8a76]"
      />

      <button
        type="button"
        aria-label="Search products"
        className="flex h-full w-16 items-center justify-center bg-[#9F2B68] text-[#f7d58b] transition hover:bg-[#4a2b17]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </div>
  );
}
