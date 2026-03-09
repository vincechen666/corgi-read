type PillTabsProps = {
  items: string[];
  activeItem: string;
};

export function PillTabs({ items, activeItem }: PillTabsProps) {
  return (
    <div className="inline-flex rounded-full bg-[#f4f0ea] p-1">
      {items.map((item) => {
        const active = item === activeItem;

        return (
          <div
            key={item}
            className={[
              "rounded-full px-6 py-2 text-sm transition",
              active
                ? "bg-white font-semibold text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                : "font-medium text-[#8a8178]",
            ].join(" ")}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}
