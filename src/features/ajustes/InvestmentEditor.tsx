import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Asset, InvestmentConfig } from "../../types";

interface InvestmentEditorProps {
  assets: Asset[];
  addAsset: (name: string) => void;
  renameAsset: (id: string, name: string) => void;
  updateAssetPct: (id: string, pct: number) => void;
  removeAsset: (id: string) => void;
  config: InvestmentConfig;
  setGlobalPct: (pct: number) => void;
}

export function InvestmentEditor({ assets, addAsset, renameAsset, updateAssetPct, removeAsset, config, setGlobalPct }: InvestmentEditorProps) {
  const [newName, setNewName] = useState("");
  const totalPct = assets.reduce((s, a) => s + (a.pct || 0), 0);

  return (
    <div>
      <p className="text-sm font-semibold mb-2">% de tus ingresos destinado a inversión</p>
      <div className="flex items-center gap-2 mb-1">
        <input
          type="number"
          inputMode="decimal"
          value={config.globalPct || ""}
          onChange={(e) => setGlobalPct(parseFloat(e.target.value) || 0)}
          className="w-24 border border-stone-200 rounded-lg px-3 py-2 text-base font-mono"
        />
        <span className="text-sm text-stone-500">% de los ingresos de cada mes</span>
      </div>
      <p className="text-xs text-stone-400 mb-5">
        Es solo una plantilla orientativa: al aplicar el plan cada mes podrás ajustar los importes reales, y si algún mes no inviertes nada, no
        pasa nada.
      </p>

      <p className="text-sm font-semibold mb-2">Reparto entre activos</p>
      <div className="space-y-2 mb-3">
        {assets.length === 0 && <p className="text-stone-400 text-sm text-center py-4">Todavía no tienes activos de inversión.</p>}
        {assets.map((a) => (
          <div key={a.id} className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
            <input
              value={a.name}
              onChange={(e) => renameAsset(a.id, e.target.value)}
              className="flex-1 border border-stone-200 rounded-md px-2 py-1 text-base min-w-0"
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                value={a.pct || ""}
                onChange={(e) => updateAssetPct(a.id, parseFloat(e.target.value) || 0)}
                className="w-14 border border-stone-200 rounded-md px-1.5 py-1 text-base font-mono text-right"
              />
              <span className="text-xs text-stone-400">%</span>
            </div>
            <button onClick={() => removeAsset(a.id)} className="text-stone-300 hover:text-rose-600 shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {assets.length > 0 && (
        <p className={`text-xs mb-4 ${totalPct === 100 ? "text-stone-400" : "text-amber-700"}`}>
          Suma actual del reparto: {totalPct.toFixed(0)}% {totalPct !== 100 ? "(lo ideal es que sume 100%)" : ""}
        </p>
      )}
      <div className="flex gap-1.5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuevo activo (ej. Oro, SP500)"
          className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-base"
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              addAsset(newName.trim());
              setNewName("");
            }
          }}
          className="bg-indigo-700 text-white rounded-md px-2.5 text-xs"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
