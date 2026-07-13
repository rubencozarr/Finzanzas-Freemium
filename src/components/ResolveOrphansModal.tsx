import { useState } from "react";
import { X } from "lucide-react";
import { Chip } from "./Chip";
import { fmt } from "../lib/format";
import type { OrphanGroup, OrphanSubcategoryGroup } from "../lib/calculations";
import type { Category } from "../types";

interface ResolveOrphansModalProps {
  groups: OrphanGroup[];
  subcategoryGroups: OrphanSubcategoryGroup[];
  categories: Category[];
  onClose: () => void;
  onApply: (group: OrphanGroup, categoryId: string) => Promise<void>;
  onApplySubcategory: (group: OrphanSubcategoryGroup, subcategoryId: string) => Promise<void>;
}

export function ResolveOrphansModal({
  groups,
  subcategoryGroups,
  categories,
  onClose,
  onApply,
  onApplySubcategory,
}: ResolveOrphansModalProps) {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.filter((g) => g.suggestedCategoryId).map((g) => [g.key, g.suggestedCategoryId as string])),
  );
  const [selectedSub, setSelectedSub] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      subcategoryGroups.filter((g) => g.suggestedSubcategoryId).map((g) => [g.key, g.suggestedSubcategoryId as string]),
    ),
  );
  const [applying, setApplying] = useState<string | null>(null);

  const applyGroup = async (g: OrphanGroup) => {
    const categoryId = selected[g.key];
    if (!categoryId) return;
    setApplying(g.key);
    await onApply(g, categoryId);
    setApplying(null);
  };

  const applySubGroup = async (g: OrphanSubcategoryGroup) => {
    const subcategoryId = selectedSub[g.key];
    if (!subcategoryId) return;
    setApplying(g.key);
    await onApplySubcategory(g, subcategoryId);
    setApplying(null);
  };

  const applyAll = async () => {
    for (const g of groups) {
      if (selected[g.key]) {
        setApplying(g.key);
        await onApply(g, selected[g.key]);
      }
    }
    for (const g of subcategoryGroups) {
      if (selectedSub[g.key]) {
        setApplying(g.key);
        await onApplySubcategory(g, selectedSub[g.key]);
      }
    }
    setApplying(null);
  };

  const readyCount = groups.filter((g) => selected[g.key]).length + subcategoryGroups.filter((g) => selectedSub[g.key]).length;
  const totalCount = groups.length + subcategoryGroups.length;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[85dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-serif text-base">Reasignar movimientos</p>
          <button onClick={onClose} className="text-stone-400">
            <X size={18} />
          </button>
        </div>

        {totalCount === 0 ? (
          <p className="text-sm text-stone-500 text-center py-6">No queda ningún movimiento por reasignar.</p>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold mb-1">Categorías que ya no existen</p>
                <p className="text-xs text-stone-500 mb-3">
                  Por ejemplo, tras dividir o renombrar una categoría antigua. Elige el destino de cada grupo y aplícalo de una vez a
                  todos sus movimientos.
                </p>
                <div className="space-y-4">
                  {groups.map((g) => {
                    const pool = categories.filter((c) => c.type === (g.fixed ? "fixed" : "variable"));
                    return (
                      <div key={g.key} className="border border-stone-100 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            "{g.oldName}" <span className="text-stone-400 font-normal">({g.fixed ? "fijo" : "variable"})</span>
                          </span>
                          <span className="font-mono text-xs text-stone-500">
                            {g.count} mov. · {fmt(g.totalAmount)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">Reasignar todos a:</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pool.length === 0 && (
                            <span className="text-xs text-stone-400">No hay categorías {g.fixed ? "fijas" : "variables"} creadas.</span>
                          )}
                          {pool.map((c) => (
                            <Chip
                              key={c.id}
                              tone={g.fixed ? "fixed" : "variable"}
                              label={c.name}
                              active={selected[g.key] === c.id}
                              onClick={() => setSelected((s) => ({ ...s, [g.key]: c.id }))}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => applyGroup(g)}
                          disabled={!selected[g.key] || applying === g.key}
                          className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-md py-2 text-xs font-medium"
                        >
                          {applying === g.key ? "Aplicando..." : `Aplicar a los ${g.count} movimientos`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {subcategoryGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold mb-1">Subcategorías que ya no existen</p>
                <p className="text-xs text-stone-500 mb-3">
                  La categoría sigue existiendo, pero la subcategoría concreta ya no. El importe sigue contando en el total de la
                  categoría; esto solo afecta al desglose por subcategoría.
                </p>
                <div className="space-y-4">
                  {subcategoryGroups.map((g) => {
                    const cat = categories.find((c) => c.id === g.categoryId);
                    const pool = cat?.subcategories ?? [];
                    return (
                      <div key={g.key} className="border border-stone-100 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            "{g.oldSubName}" <span className="text-stone-400 font-normal">({g.categoryName})</span>
                          </span>
                          <span className="font-mono text-xs text-stone-500">
                            {g.count} mov. · {fmt(g.totalAmount)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">Reasignar todos a:</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pool.length === 0 && (
                            <span className="text-xs text-stone-400">"{g.categoryName}" no tiene subcategorías creadas.</span>
                          )}
                          {pool.map((sc) => (
                            <Chip
                              key={sc.id}
                              label={sc.name}
                              active={selectedSub[g.key] === sc.id}
                              onClick={() => setSelectedSub((s) => ({ ...s, [g.key]: sc.id }))}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => applySubGroup(g)}
                          disabled={!selectedSub[g.key] || applying === g.key}
                          className="w-full bg-slate-800 disabled:opacity-40 text-white rounded-md py-2 text-xs font-medium"
                        >
                          {applying === g.key ? "Aplicando..." : `Aplicar a los ${g.count} movimientos`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={applyAll}
              disabled={readyCount === 0 || applying !== null}
              className="w-full bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium"
            >
              Aplicar todo ({readyCount}/{totalCount} grupos listos)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
