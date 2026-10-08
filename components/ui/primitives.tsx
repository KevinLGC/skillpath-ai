import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------ button ------------------------------------ */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
        outline: "border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        subtle: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
        destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/* ------------------------------------- card ------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold leading-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 p-5 pt-0", className)} {...props} />;
}

/* ------------------------------------- badge ------------------------------------ */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        outline: "border-[var(--border)] text-[var(--muted-foreground)]",
        accent: "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]",
        success: "border-transparent bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]",
        warning: "border-transparent bg-[color-mix(in_oklab,var(--warning)_20%,transparent)] text-[var(--warning)]",
        muted: "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* ------------------------------------ progress ----------------------------------- */

export function Progress({
  value,
  className,
  tone = "primary",
  label,
  "aria-label": ariaLabel,
  ...props
}: {
  value: number;
  className?: string;
  tone?: "primary" | "success" | "warning";
  /** Accessible name. Falls back to `aria-label` if the caller passed one. */
  label?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "role">) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : "var(--primary)";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? label}
      {...props}
    >
      {/* scaleX rather than width: it animates on the compositor instead of
          triggering layout on every frame. */}
      <div
        className="h-full origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${clamped / 100})`, backgroundColor: color }}
      />
    </div>
  );
}

/* ------------------------------------- inputs ----------------------------------- */

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium leading-none", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------- alert ----------------------------------- */

const alertVariants = cva("rounded-xl border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)]",
      warning: "border-[color-mix(in_oklab,var(--warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--warning)_12%,transparent)]",
      danger: "border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)]",
      success: "border-[color-mix(in_oklab,var(--success)_35%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)]",
    },
  },
  defaultVariants: { variant: "info" },
});

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div role="note" className={cn(alertVariants({ variant }), className)} {...props}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-[var(--muted-foreground)] [&_strong]:text-[var(--foreground)]">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[var(--muted)]", className)} />;
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {hint ? <p className="text-sm text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  );
}
