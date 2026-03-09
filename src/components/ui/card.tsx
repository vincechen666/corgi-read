import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithoutRef<"section">;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-[#e7ded4] bg-[#fffdf9]",
        className,
      )}
      {...props}
    />
  );
}
