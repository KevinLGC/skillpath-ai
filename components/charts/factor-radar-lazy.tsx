"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/primitives";
import type { FactorContribution, Locale } from "@/lib/types";

/**
 * recharts is ~330KB, so it is loaded only once this component reaches the
 * browser — the server page that renders it stays a server component and ships
 * no chart code in its initial payload. The factor bars alongside it are the
 * SSR representation, so the information is present before the chart arrives.
 */
const FactorRadar = dynamic(() => import("./factor-radar").then((mod) => mod.FactorRadar), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

export function FactorRadarLazy(props: { contributions: FactorContribution[]; locale?: Locale }) {
  return <FactorRadar {...props} />;
}
