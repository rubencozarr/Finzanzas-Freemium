import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Chip } from "../../components/Chip";
import type { Category, Recurring } from "../../types";

interface RecurringEditorProps {
  categories: Category[];
  recurring: Recurring[];
  addRecurring: (r: Omit<Recurring, "id">) => void;
  removeRecurring: (id: string) => void;
  updateRecurringAmount: (id: string, amount: number) => void;
}

export function RecurringEditor({ categories, recurring, addRecurring, removeRecurring, updateRecurringAmount }: RecurringEditorProps) {
  const fixedCats = categories.filter((c) => c.type === "fixed");
  const [categoryId, setCategoryId] = useState(fixedCats[0]?.id || "");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("");
  const currentCat = categories.find((c) => c.id === categoryId);

  const add = () => {
    const amt = parseFloat(amount);
    if (!categoryId || !amt || amt <= 0) return;
    addRecurring({ categoryId, subcategory: subcategory || null, amount: amt, note, day: parseInt(day) || null });
    setAmount("");
    setNote("");
    setSubcategory("");
    setDay("");
  };

  return (
    <div>
      <p className="text-xs text-stone-500 mb-3">
        Defínelos una vez. Cada mes podrás aplicarlos de golpe desde Movimientos, ajustando el importe si algo ha cambiado.
      </p>
      <div className="space-y-2 mb-4">
        {recurring.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes gastos fijos habituales.</p>}
        {recurring.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          return (
            <div key={r.id} className="flex items-center justify-between gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {cat?.name}
                  {r.subcategory ? ` · ${r.subcategory}` : ""}
                  {r.day ? ` · día ${r.day}` : ""}
                </p>
                {r.note && <p className="text-xs text-stone-400 truncate">{r.note}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  value={r.amount}
                  onChange={(e) => updateRecurringAmount(r.id, parseFloat(e.target.value) || 0)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-20 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right"
                />
                <button onClick={() => removeRecurring(r.id)} className="text-stone-300 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div data-tour="recurring-form">
        <p className="text-sm font-medium mb-2">Añadir nuevo</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {fixedCats.map((c) => (
            <Chip
              key={c.id}
              tone="fixed"
              label={c.name}
              active={categoryId === c.id}
              onClick={() => {
                setCategoryId(c.id);
                setSubcategory("");
              }}
            />
          ))}
        </div>
        {currentCat && currentCat.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Chip label="Sin subcategoría" active={!subcategory} onClick={() => setSubcategory("")} />
            {currentCat.subcategories.map((sc) => (
              <Chip key={sc.id} label={sc.name} active={subcategory === sc.name} onClick={() => setSubcategory(sc.name)} />
            ))}
          </div>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Importe habitual (€)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3 font-mono"
        />
        <input
          type="number"
          inputMode="numeric"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="Día habitual del mes (opcional, ej. 5)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3"
          min="1"
          max="31"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-base mb-3"
        />
        <button onClick={add} className="w-full bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium">
          Añadir gasto fijo habitual
        </button>
      </div>
    </div>
  );
}
