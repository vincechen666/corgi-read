import Image from "next/image";

type TopBarProps = {
  documentLabel?: string;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onUploadClick?: () => void;
};

export function TopBar({
  documentLabel = "文档 The Last Question.pdf",
  menuOpen = false,
  onToggleMenu,
  onUploadClick,
}: TopBarProps) {
  return (
    <header className="flex h-[60px] items-center justify-between border border-[#e7ded4] bg-white px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="font-serif text-[26px] font-medium text-[#1a1a1a]">
          CorgiRead
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
          ENGLISH PDF READER
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div
          className="relative"
          data-testid="topbar-file-trigger-wrap"
        >
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="h-8 border border-[#e7ded4] bg-[#f8f4ee] px-4 text-[13px] text-[#514942]"
            onClick={onToggleMenu}
            type="button"
          >
            {documentLabel}
          </button>
          {menuOpen ? (
            <div
              className="absolute left-0 top-full z-10 mt-1 min-w-[156px] border border-[#e7ded4] bg-white p-1 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
              role="menu"
            >
              <button
                className="w-full px-3 py-2 text-left text-sm font-semibold text-[#514942] hover:bg-[#f8f4ee]"
                onClick={onUploadClick}
                role="menuitem"
                type="button"
              >
                上传 PDF
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex h-8 items-center border border-[#f1d4c6] bg-[#fff4ec] px-4 text-[13px] text-[#c25b34]">
          沉浸式精读模式
        </div>
        <button
          aria-label="User avatar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7ded4] bg-[#f8f4ee] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          data-testid="topbar-avatar-button"
          type="button"
        >
          <Image
            alt="CorgiRead avatar placeholder"
            className="rounded-full object-cover"
            height={28}
            src="/logo.webp"
            width={28}
          />
        </button>
      </div>
    </header>
  );
}
