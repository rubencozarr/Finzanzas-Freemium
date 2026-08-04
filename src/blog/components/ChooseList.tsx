interface ChooseItem {
  label: string;
  text: string;
  highlighted?: boolean;
}

export function ChooseList({ items }: { items: ChooseItem[] }) {
  return (
    <div className="mt-4 p-5 rounded-2xl bg-stone-50 flex flex-col gap-3">
      {items.map((item) => (
        <p
          key={item.label}
          className={`text-sm ${item.highlighted ? "p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900" : "text-stone-700"}`}
        >
          <strong>{item.label}:</strong> {item.text}
        </p>
      ))}
    </div>
  );
}
