import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { fmt } from "../../lib/format";
import { PremiumGate } from "../../components/PremiumGate";
import { FREE_MAX_CATEGORIES } from "../../lib/constants";
import type { Category, CategoryType } from "../../types";

interface CategoriasEditorProps {
  isPremium: boolean;
  canCreateCategory: (currentCount: number, type: CategoryType) => boolean;
  categories: Category[];
  addCategory: (type: CategoryType, name: string) => void;
  renameCategory: (id: string, name: string) => void;
  removeCategory: (id: string) => void;
  updateBudget: (id: string, budget: number) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  removeSubcategory: (categoryId: string, subcategoryId: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  updateCategoryActive: (id: string, active: boolean) => void;
  getCategoryUsageCount: (categoryId: string) => number;
  getSubcategoryUsageCount: (categoryId: string, subcategoryId: string) => number;
  variableBudget: number;
  updateVariableBudget: (amount: number) => void;
}

export function CategoriasEditor({
  isPremium,
  canCreateCategory,
  categories,
  addCategory,
  renameCategory,
  removeCategory,
  updateBudget,
  addSubcategory,
  removeSubcategory,
  moveCategory,
  updateCategoryActive,
  getCategoryUsageCount,
  getSubcategoryUsageCount,
  variableBudget,
  updateVariableBudget,
}: CategoriasEditorProps) {
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});
  const [newCatName, setNewCatName] = useState<Record<CategoryType, string>>({ fixed: "", variable: "" });
  const [addError, setAddError] = useState<Record<CategoryType, string | null>>({ fixed: null, variable: null });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<{ id: string; name: string; count: number } | null>(null);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<{
    categoryId: string;
    categoryName: string;
    subId: string;
    subName: string;
    count: number;
  } | null>(null);

  const askRemoveCategory = (cat: Category) => {
    const count = getCategoryUsageCount(cat.id);
    if (count === 0) {
      removeCategory(cat.id);
      return;
    }
    setDeleteConfirmCat({ id: cat.id, name: cat.name, count });
  };

  const askRemoveSubcategory = (cat: Category, subId: string, subName: string) => {
    const count = getSubcategoryUsageCount(cat.id, subId);
    if (count === 0) {
      removeSubcategory(cat.id, subId);
      return;
    }
    setDeleteConfirmSub({ categoryId: cat.id, categoryName: cat.name, subId, subName, count });
  };

  // El nombre no puede repetirse entre categorías, sea cual sea su tipo (fija o variable).
  const nameExists = (name: string, excludeId?: string) =>
    categories.some((c) => c.id !== excludeId && c.name.trim().toLowerCase() === name.trim().toLowerCase());

  const addSub = (catId: string) => {
    const name = (newSubName[catId] || "").trim();
    if (!name) return;
    addSubcategory(catId, name);
    setNewSubName((s) => ({ ...s, [catId]: "" }));
  };

  const addCat = (type: CategoryType) => {
    const name = newCatName[type].trim();
    if (!name) return;
    const count = categories.filter((c) => c.type === type).length;
    if (!canCreateCategory(count, type)) return;
    if (nameExists(name)) {
      setAddError((s) => ({ ...s, [type]: "Ya existe una categoría con este nombre." }));
      return;
    }
    addCategory(type, name);
    setNewCatName((s) => ({ ...s, [type]: "" }));
    setAddError((s) => ({ ...s, [type]: null }));
  };

  const startRename = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setRenameError(null);
  };

  const confirmRename = (catId: string) => {
    const name = editCatName.trim();
    if (!name) return;
    if (nameExists(name, catId)) {
      setRenameError("Ya existe una categoría con este nombre.");
      return;
    }
    renameCategory(catId, name);
    setEditingCatId(null);
    setRenameError(null);
  };

  const renderGroup = (type: CategoryType, title: string) => {
    const list = categories.filter((c) => c.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
    // Downgrade/importación: un free con más de 6 categorías de este tipo puede ver y usar todas en
    // movimientos ya existentes, pero solo crear movimientos nuevos con las que marque como "activas"
    // (máx. FREE_MAX_CATEGORIES[type]). Mismo mecanismo que "fondo activo" en FondosTab.tsx.
    const showActiveToggle = !isPremium && list.length > FREE_MAX_CATEGORIES[type];
    const activeCount = list.filter((c) => c.isActive).length;
    return (
      <div className="mb-5">
        <p className="text-sm font-semibold mb-2">{title}</p>
        {type === "fixed" && (
          <p className="text-xs text-stone-400 mb-2">
            Los gastos fijos no llevan presupuesto: ya conoces su importe porque los defines en "Gastos fijos habituales".
          </p>
        )}
        {type === "variable" &&
          (() => {
            const sumaCat = list.reduce((s, c) => s + (c.budget || 0), 0);
            const excede = variableBudget > 0 && sumaCat > variableBudget;
            return (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-stone-500">Presupuesto total de todo lo variable</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={variableBudget || ""}
                    onChange={(e) => updateVariableBudget(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Sin límite"
                    className="w-24 border border-stone-200 rounded-md px-2 py-1 text-base font-mono"
                  />
                </div>
                {excede && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-2.5 py-1.5">
                    Los presupuestos por categoría suman {fmt(sumaCat)}, pero tu presupuesto total es {fmt(variableBudget)}.
                  </p>
                )}
              </div>
            );
          })()}
        <div className="space-y-3">
          {list.map((cat, i) => (
            <div key={cat.id} className="border border-stone-100 rounded-lg p-2.5 bg-white">
              <div className="flex justify-between items-center mb-2">
                {editingCatId === cat.id ? (
                  <div className="flex-1 mr-2">
                    <div className="flex gap-1.5">
                      <input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename(cat.id);
                          if (e.key === "Escape") {
                            setEditingCatId(null);
                            setRenameError(null);
                          }
                        }}
                        className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base min-w-0"
                        autoFocus
                      />
                      <button onClick={() => confirmRename(cat.id)} className="text-teal-700 shrink-0">
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCatId(null);
                          setRenameError(null);
                        }}
                        className="text-stone-400 shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {renameError && <p className="text-xs text-rose-600 mt-1">{renameError}</p>}
                  </div>
                ) : (
                  <span className="text-sm flex items-center gap-1.5">
                    {cat.name}
                    <button onClick={() => startRename(cat)} className="text-stone-300 hover:text-slate-700">
                      <Pencil size={12} />
                    </button>
                  </span>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => moveCategory(cat.id, -1)} disabled={i === 0} className={i === 0 ? "text-stone-200" : "text-stone-400 hover:text-slate-700"}>
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => moveCategory(cat.id, 1)}
                    disabled={i === list.length - 1}
                    className={i === list.length - 1 ? "text-stone-200" : "text-stone-400 hover:text-slate-700"}
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button onClick={() => askRemoveCategory(cat)} className="text-stone-300 hover:text-rose-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {showActiveToggle && (
                <button
                  onClick={() => updateCategoryActive(cat.id, !cat.isActive)}
                  disabled={!cat.isActive && activeCount >= FREE_MAX_CATEGORIES[type]}
                  className={`text-[11px] px-2 py-0.5 rounded-full border mb-2 ${
                    cat.isActive
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : activeCount >= FREE_MAX_CATEGORIES[type]
                        ? "text-stone-300 border-stone-100"
                        : "text-stone-400 border-stone-200"
                  }`}
                >
                  {cat.isActive ? "Categoría activa ✓" : "Marcar como activa"}
                </button>
              )}
              {type === "variable" && isPremium && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-stone-500">Presupuesto mensual</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cat.budget || ""}
                    onChange={(e) => updateBudget(cat.id, parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Sin límite"
                    className="w-24 border border-stone-200 rounded-md px-2 py-1 text-base font-mono"
                  />
                </div>
              )}
              {cat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {cat.subcategories.map((sc) => (
                    <span key={sc.id} className="flex items-center gap-1 bg-stone-100 text-xs rounded-full px-2 py-1">
                      {sc.name}
                      {isPremium && (
                        <button onClick={() => askRemoveSubcategory(cat, sc.id, sc.name)} className="text-stone-400 hover:text-rose-600">
                          <X size={11} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {isPremium && (
                <div className="flex gap-1.5">
                  <input
                    value={newSubName[cat.id] || ""}
                    onChange={(e) => setNewSubName((s) => ({ ...s, [cat.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSub(cat.id);
                    }}
                    placeholder="Nueva subcategoría"
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base"
                  />
                  <button onClick={() => addSub(cat.id)} className="bg-stone-800 text-white rounded-md px-2">
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {canCreateCategory(list.length, type) && (
          <>
            <div className="flex gap-1.5 mt-2">
              <input
                value={newCatName[type]}
                onChange={(e) => {
                  setNewCatName((s) => ({ ...s, [type]: e.target.value }));
                  setAddError((s) => ({ ...s, [type]: null }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCat(type);
                }}
                placeholder={`Nueva categoría ${type === "fixed" ? "fija" : "variable"}`}
                className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-base"
              />
              <button onClick={() => addCat(type)} className="bg-slate-800 text-white rounded-md px-2.5 text-xs">
                <Plus size={14} />
              </button>
            </div>
            {addError[type] && <p className="text-xs text-rose-600 mt-1">{addError[type]}</p>}
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {!isPremium && (
        <div className="mb-4">
          <PremiumGate message="Con Premium: categorías ilimitadas, subcategorías y presupuestos por categoría." />
        </div>
      )}
      {renderGroup("fixed", "Categorías fijas")}
      {renderGroup("variable", "Categorías variables")}

      {deleteConfirmCat && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirmCat(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Eliminar "{deleteConfirmCat.name}"?</p>
            <p className="text-sm text-stone-600 mb-4">
              {deleteConfirmCat.count} movimiento{deleteConfirmCat.count > 1 ? "s" : ""} usa{deleteConfirmCat.count > 1 ? "n" : ""} esta
              categoría. Si continúas, dejarán de tener categoría y podrás reasignarlos en bloque desde Movimientos, pero no se borrarán.
            </p>
            <button
              onClick={() => {
                removeCategory(deleteConfirmCat.id);
                setDeleteConfirmCat(null);
              }}
              className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setDeleteConfirmCat(null)}
              className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {deleteConfirmSub && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirmSub(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Eliminar la subcategoría "{deleteConfirmSub.subName}"?</p>
            <p className="text-sm text-stone-600 mb-4">
              {deleteConfirmSub.count} movimiento{deleteConfirmSub.count > 1 ? "s" : ""} de "{deleteConfirmSub.categoryName}" usa
              {deleteConfirmSub.count > 1 ? "n" : ""} esta subcategoría. Seguirán contando en el total de "{deleteConfirmSub.categoryName}",
              pero dejarán de aparecer desglosados por subcategoría hasta que los reasignes desde Movimientos.
            </p>
            <button
              onClick={() => {
                removeSubcategory(deleteConfirmSub.categoryId, deleteConfirmSub.subId);
                setDeleteConfirmSub(null);
              }}
              className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setDeleteConfirmSub(null)}
              className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
