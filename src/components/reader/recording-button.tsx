export function RecordingButton() {
  return (
    <button
      type="button"
      aria-label="Start retelling"
      className="absolute bottom-8 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full bg-transparent"
    >
      <span className="absolute inset-0 rounded-full bg-[#e07b54]/15" />
      <span className="absolute inset-[10px] rounded-full border border-[#f2d1c3] bg-[#fff4ec] shadow-[0_8px_18px_rgba(0,0,0,0.08)]" />
      <span className="absolute inset-[22px] rounded-full bg-[#e07b54]" />
      <span className="absolute inset-0 flex items-center justify-center text-2xl text-white">
        •
      </span>
    </button>
  );
}
