import Link from "next/link";
import { ChevronLeft } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type PageBackProps = {
  href: string;
  label: string;
  /** "admin" : couleurs pierre pour le fond beige de l’admin */
  variant?: "default" | "admin";
  className?: string;
};

export function PageBack({ href, label, variant = "default", className }: PageBackProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold hover:underline",
        variant === "admin"
          ? "text-stone-800 hover:text-stone-950"
          : "text-[#6b5538] hover:text-[#2c2822]",
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
