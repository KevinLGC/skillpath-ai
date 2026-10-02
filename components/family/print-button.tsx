"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/primitives";

/** Print / save-as-PDF. Uses the browser's print pipeline instead of a PDF dependency. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button onClick={() => window.print()} variant="outline" size="sm">
      <Printer className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
