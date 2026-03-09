export function TopBar() {
  return (
    <header className="flex items-center justify-between rounded-[18px] border border-[#e7ded4] bg-white px-6 py-4">
      <div className="flex items-center gap-4">
        <span className="font-serif text-3xl font-medium text-[#1a1a1a]">
          corgi read
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
          ENGLISH PDF READER
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className="rounded-full border border-[#e7ded4] bg-[#f8f4ee] px-4 py-2 text-[#514942]">
          文档 The Last Question.pdf
        </div>
        <div className="rounded-full bg-[#fff4ec] px-4 py-2 text-[#c25b34]">
          沉浸式精读模式
        </div>
        <div className="rounded-full bg-[#f5f5f5] px-4 py-2 font-mono text-xs text-[#6f675f]">
          Page 12 / Section 3 / 18 min
        </div>
      </div>
    </header>
  );
}
