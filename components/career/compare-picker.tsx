"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/types";

export interface CompareOption {
  slug: string;
  title: string;
  score: number;
}

/** Up to three careers can be compared at once; the selection lives in the URL. */
export function ComparePicker({
  options,
  selected,
  locale,
}: {
  options: CompareOption[];
  selected: string[];
  locale: Locale;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function toggle(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((item) => item !== slug)
      : [...selected, slug].slice(-3);

    const query = new URLSearchParams(params.toString());
    query.delete("a");
    query.delete("b");
    query.delete("c");
    next.forEach((value, index) => query.set(["a", "b", "c"][index] ?? "a", value));
    router.push(`/compare?${query.toString()}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        {locale === "te" ? "గరిష్ఠంగా 3 వృత్తులను ఎంచుకోండి." : "Pick up to three careers to compare side by side."}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.slug);
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => toggle(option.slug)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                active
                  ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border)] hover:bg-[var(--secondary)]",
              )}
            >
              {option.title}
              <Badge variant={active ? "default" : "muted"}>{option.score}%</Badge>
            </button>
          );
        })}
      </div>
      {selected.length > 0 ? (
        <Button variant="ghost" size="sm" onClick={() => router.push("/compare")}>
          {locale === "te" ? "ఎంపికను తీసివేయండి" : "Clear selection"}
        </Button>
      ) : null}
    </div>
  );
}
