export default function Header() {
  return (
    // Removed pt-4 so the text sits completely flush with its parent
    <header className="flex items-start justify-between w-full">
      <div className="flex flex-col">
        <span className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] uppercase text-neutral-500 mb-1.5">
          Good Morning,
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
          Bryan.
        </h1>
      </div>
    </header>
  );
}