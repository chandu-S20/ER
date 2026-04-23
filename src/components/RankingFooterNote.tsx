import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RankingFooterNoteProps = {
  extra?: ReactNode;
  className?: string;
};

export function RankingFooterNote({ extra, className }: RankingFooterNoteProps) {
  return (
    <div
      className={cn(
        "mt-6 space-y-2 text-center text-xs text-muted-foreground",
        "max-w-4xl mx-auto px-2 sm:px-4",
        className,
      )}
    >
      <p className="leading-relaxed text-pretty">
        Ranked by relevance: distance (40%) · quality (30%) · availability (20%) · insurance (10%)
      </p>
      {extra}
    </div>
  );
}
