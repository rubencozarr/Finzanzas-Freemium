import type { ReactNode } from "react";

export function PullQuote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`pl-4 my-6 border-l-4 border-teal-400 text-lg text-teal-700 font-medium leading-snug italic ${className}`}>{children}</p>
  );
}
