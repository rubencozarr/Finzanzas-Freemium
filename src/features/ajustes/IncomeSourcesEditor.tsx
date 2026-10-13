import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { isReservedIncomeSourceName } from "../../lib/calculations";
import type { IncomeSource } from "../../types";

interface IncomeSourcesEditorProps {
  sources: IncomeSource[];
  createIncomeSource: (name: string) => Promise<{ id: string; name: string } | { error: string }>;
  renameIncomeSource: (id: string, name: string) => Promise<void> | void;
  removeIncomeSource: (id: string, name: string) => Promise<void> | void;
  updateIncomeSourceOrder: (id: string, direction: -1 | 1) => Promise<void> | void;
  getIncomeSourceUsageCount: (sourceId: string) => number;
}

/** Gestor de fuentes de ingreso en Ajustes → Ingresos: mismo patrón de crear/renombrar/borrar/reordenar
 * que CategoriasEditor.tsx y FondosTab.tsx, pero sin agrupar por tipo ni límites (sin gates, igual en
 * free y premium). "createIncomeSource" (validación de duplicados + inserción) viene de App.tsx y es la
 * MISMA función que usa el "+ Nueva fuente" de NuevoMovimientoForm, para no duplicar esa lógica. */
export function IncomeSourcesEditor({
  sources,
  createIncomeSource,
  renameIncomeSource,
  removeIncomeSource,
  updateIncomeSourceOrder,
  getIncomeSourceUsageCount,
}: IncomeSourcesEditorProps) {
  const list = [...sources].sort((a, b) => a.sortOrder - b.sortOrder);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; count: number } | null>(null);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    const result = await createIncomeSource(name);
    if ("error" in result) {
      setAddError(result.error);
      return;
    }
    setNewName("");
    setAddError(null);
  };

  const startRename = (s: IncomeSource) => {
    setEditingId(s.id);
    setEditName(s.name);
    setRenameError(null);
  };

  // El nombre no puede repetirse (sin distinguir mayúsculas) ni ser el reservado "Sin clasificar": misma
  // validación que createIncomeSource usa para crear, aquí aplicada al renombrar (excluyendo la propia
  // fuente que se está editando en el caso de duplicados).
  const confirmRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    if (isReservedIncomeSourceName(name)) {
      setRenameError("Ese nombre está reservado.");
      return;
    }
    if (sources.some((s) => s.id !== id && s.name.trim().toLowerCase() === name.toLowerCase())) {
      setRenameError("Ya existe una fuente con este nombre.");
      return;
    }
    await renameIncomeSource(id, name);
    setEditingId(null);
    setRenameError(null);
  };

  const askRemove = (s: IncomeSource) => {
    const count = getIncomeSourceUsageCount(s.id);
    if (count === 0) {
      removeIncomeSource(s.id, s.name);
      return;
    }
    setDeleteConfirm({ id: s.id, name: s.name, count });
  };

  return (
    <div className="mb-5">
      <p className="text-sm font-semibold mb-2">Fuentes de ingreso</p>
      <p className="text-xs text-stone-500 mb-3">
        Clasifica tus ingresos por su origen (nómina, alquiler, freelance...) para ver de dónde viene tu dinero en Mensual.
      </p>
      <div className="space-y-2 mb-3">
        {list.length === 0 && <p className="text-stone-500 text-sm text-center py-2">Todavía no tienes ninguna fuente.</p>}
        {list.map((s, i) => (
          <div key={s.id} className="flex justify-between items-center gap-2 border border-stone-100 rounded-lg p-2.5 bg-white">
            {editingId === s.id ? (
              <div className="flex-1 mr-2 min-w-0">
                <div className="flex gap-1.5">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename(s.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setRenameError(null);
                      }
                    }}
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base min-w-0"
                    autoFocus
                  />
                  <button
                    onClick={() => confirmRename(s.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-teal-700 shrink-0"
                    aria-label="Confirmar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setRenameError(null);
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-500 shrink-0"
                    aria-label="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
                {renameError && <p className="text-xs text-rose-600 mt-1">{renameError}</p>}
              </div>
            ) : (
              <span className="text-sm flex items-center gap-1.5 min-w-0">
                <span className="truncate">{s.name}</span>
                <button
                  onClick={() => startRename(s)}
                  className="min-w-[44px] min-h-[44px] -m-2.5 flex items-center justify-center text-stone-300 hover:text-slate-700 shrink-0"
                  aria-label={`Renombrar ${s.name}`}
                >
                  <Pencil size={12} />
                </button>
              </span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => updateIncomeSourceOrder(s.id, -1)}
                disabled={i === 0}
                className={`min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center ${i === 0 ? "text-stone-200" : "text-stone-500 hover:text-slate-700"}`}
                aria-label={`Subir ${s.name}`}
              >
                <ChevronUp size={15} />
              </button>
              <button
                onClick={() => updateIncomeSourceOrder(s.id, 1)}
                disabled={i === list.length - 1}
                className={`min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center ${i === list.length - 1 ? "text-stone-200" : "text-stone-500 hover:text-slate-700"}`}
                aria-label={`Bajar ${s.name}`}
              >
                <ChevronDown size={15} />
              </button>
              <button
                onClick={() => askRemove(s)}
                className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-stone-300 hover:text-rose-600"
                aria-label={`Eliminar ${s.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setAddError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Nueva fuente (ej. Nómina)"
          className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-base"
        />
        <button
          onClick={add}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-800 text-white rounded-md px-2.5 text-xs"
          aria-label="Añadir fuente"
        >
          <Plus size={14} />
        </button>
      </div>
      {addError && <p className="text-xs text-rose-600 mt-1">{addError}</p>}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-20" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Eliminar "{deleteConfirm.name}"?</p>
            <p className="text-sm text-stone-600 mb-4">
              {deleteConfirm.count} ingreso{deleteConfirm.count > 1 ? "s" : ""} usa{deleteConfirm.count > 1 ? "n" : ""} esta fuente. Los
              ingresos ya registrados conservarán el nombre en el histórico.
            </p>
            <button
              onClick={() => {
                removeIncomeSource(deleteConfirm.id, deleteConfirm.name);
                setDeleteConfirm(null);
              }}
              className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
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
