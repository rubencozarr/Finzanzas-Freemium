import type { ReactNode } from "react";

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  tourId?: string;
}

export function NavButton({ icon, label, active, onClick, tourId }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      data-tour={tourId}
      className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[11px] ${active ? "text-teal-700" : "text-stone-400"}`}
    >
      {icon}
      {label}
    </button>
  );
}
