import { Sparkle } from "lucide-react";

export function CardDivider() {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 border-t border-dashed border-stone-200" />
      <Sparkle size={14} className="text-stone-300" />
      <div className="flex-1 border-t border-dashed border-stone-200" />
    </div>
  );
}
