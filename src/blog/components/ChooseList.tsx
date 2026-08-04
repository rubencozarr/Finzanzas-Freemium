import type { LucideIcon } from "lucide-react";

interface ChooseItem {
  icon: LucideIcon;
  label: string;
  text: string;
  highlighted?: boolean;
}

export function ChooseList({ items }: { items: ChooseItem[] }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-start gap-4 p-4 rounded-xl border ${item.highlighted ? "bg-teal-50 border-teal-200" : "bg-white border-stone-200"}`}
        >
          <span className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${item.highlighted ? "bg-white" : "bg-teal-50"}`}>
            <item.icon className="text-teal-600" size={18} strokeWidth={1.75} />
          </span>
          <p className={`text-sm ${item.highlighted ? "text-teal-900" : "text-stone-700"}`}>
            <strong>{item.label}:</strong> {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}
