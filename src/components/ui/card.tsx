import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";

import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithoutRef<"section">;

export const Card = forwardRef<ElementRef<"section">, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "rounded-none border border-[#e7ded4] bg-[#fffdf9]",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
