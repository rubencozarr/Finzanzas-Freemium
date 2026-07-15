import { useEffect, useState } from "react";
import { Download, LogOut, Upload } from "lucide-react";
import { CategoriasEditor } from "./CategoriasEditor";
import { RecurringEditor } from "./RecurringEditor";
import { RecurringIncomeEditor } from "./RecurringIncomeEditor";
import { InvestmentEditor } from "./InvestmentEditor";
import { PremiumGate } from "../../components/PremiumGate";
import type { Asset, Category, CategoryType, InvestmentConfig, Recurring, RecurringIncome, Transaction } from "../../types";

type Section = "categorias" | "recurrentes" | "ingresos" | "inversion";

interface AjustesTabProps {
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
  transactions: Transaction[];
  currentMonthKey: string;
  getCategoryUsageCount: (categoryId: string) => number;
  getSubcategoryUsageCount: (categoryId: string, subcategoryId: string) => number;
  variableBudget: number;
  updateVariableBudget: (amount: number) => void;

  recurring: Recurring[];
  addRecurring: (r: Omit<Recurring, "id">) => void;
  removeRecurring: (id: string) => void;
  updateRecurringAmount: (id: string, amount: number) => void;

  recurringIncome: RecurringIncome[];
  addRecurringIncome: (r: Omit<RecurringIncome, "id">) => void;
  removeRecurringIncome: (id: string) => void;
  updateRecurringIncomeAmount: (id: string, amount: number) => void;

  assets: Asset[];
  addAsset: (name: string) => void;
  renameAsset: (id: string, name: string) => void;
  updateAssetPct: (id: string, pct: number) => void;
  removeAsset: (id: string) => void;
  investmentConfig: InvestmentConfig;
  setGlobalPct: (pct: number) => void;

  initialSection: string;
  onSectionChange?: (section: string) => void;
  onExport: () => void;
  onImport: (data: unknown) => Promise<boolean>;
  onSignOut: () => void | Promise<unknown>;
}

export function AjustesTab({
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
  transactions,
  currentMonthKey,
  getCategoryUsageCount,
  getSubcategoryUsageCount,
  variableBudget,
  updateVariableBudget,
  recurring,
  addRecurring,
  removeRecurring,
  updateRecurringAmount,
  recurringIncome,
  addRecurringIncome,
  removeRecurringIncome,
  updateRecurringIncomeAmount,
  assets,
  addAsset,
  renameAsset,
  updateAssetPct,
  removeAsset,
  investmentConfig,
  setGlobalPct,
  initialSection,
  onSectionChange,
  onExport,
  onImport,
  onSignOut,
}: AjustesTabProps) {
  const [section, setSection] = useState<Section>((initialSection as Section) || "categorias");
  // initialSection también puede cambiar con la pestaña ya montada (p. ej. el tour guiado salta
  // directamente a "ingresos" sin salir de Ajustes), así que hay que sincronizarlo, no solo leerlo
  // como valor inicial.
  useEffect(() => {
    if (initialSection) setSection(initialSection as Section);
  }, [initialSection]);
  // Notifica siempre la sección visible (venga de initialSection o de un clic real del usuario en
  // los botones de abajo), para que el guided tour pueda detectar la navegación real del usuario.
  useEffect(() => {
    onSectionChange?.(section);
  }, [section, onSectionChange]);
  const [importConfirm, setImportConfirm] = useState<unknown | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setImportConfirm(JSON.parse(reader.result as string));
        setImportError(null);
      } catch {
        setImportError("Archivo no válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          onClick={() => setSection("categorias")}
          className={`text-sm rounded-lg py-2 border ${section === "categorias" ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500 bg-white"}`}
        >
          Categorías
        </button>
        <button
          data-tour="ajustes-recurrentes-btn"
          onClick={() => setSection("recurrentes")}
          className={`text-sm rounded-lg py-2 border ${section === "recurrentes" ? "bg-slate-800 text-white border-slate-800" : "border-stone-200 text-stone-500 bg-white"}`}
        >
          Gastos fijos
        </button>
        <button
          data-tour="ajustes-ingresos-btn"
          onClick={() => setSection("ingresos")}
          className={`text-sm rounded-lg py-2 border ${section === "ingresos" ? "bg-emerald-700 text-white border-emerald-700" : "border-stone-200 text-stone-500 bg-white"}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setSection("inversion")}
          className={`text-sm rounded-lg py-2 border ${section === "inversion" ? "bg-indigo-700 text-white border-indigo-700" : "border-stone-200 text-stone-500 bg-white"}`}
        >
          Inversión
        </button>
      </div>

      {section === "categorias" && (
        <CategoriasEditor
          isPremium={isPremium}
          canCreateCategory={canCreateCategory}
          categories={categories}
          addCategory={addCategory}
          renameCategory={renameCategory}
          removeCategory={removeCategory}
          updateBudget={updateBudget}
          addSubcategory={addSubcategory}
          removeSubcategory={removeSubcategory}
          moveCategory={moveCategory}
          updateCategoryActive={updateCategoryActive}
          transactions={transactions}
          currentMonthKey={currentMonthKey}
          getCategoryUsageCount={getCategoryUsageCount}
          getSubcategoryUsageCount={getSubcategoryUsageCount}
          variableBudget={variableBudget}
          updateVariableBudget={updateVariableBudget}
        />
      )}
      {section === "recurrentes" && (
        <RecurringEditor
          categories={categories}
          recurring={recurring}
          addRecurring={addRecurring}
          removeRecurring={removeRecurring}
          updateRecurringAmount={updateRecurringAmount}
        />
      )}
      {section === "ingresos" && (
        <RecurringIncomeEditor
          recurringIncome={recurringIncome}
          addRecurringIncome={addRecurringIncome}
          removeRecurringIncome={removeRecurringIncome}
          updateRecurringIncomeAmount={updateRecurringIncomeAmount}
        />
      )}
      {section === "inversion" &&
        (isPremium ? (
          <InvestmentEditor
            assets={assets}
            addAsset={addAsset}
            renameAsset={renameAsset}
            updateAssetPct={updateAssetPct}
            removeAsset={removeAsset}
            config={investmentConfig}
            setGlobalPct={setGlobalPct}
          />
        ) : (
          <PremiumGate message="Gestiona tus activos y reparto de inversión con Premium" />
        ))}

      <div className="border-t border-stone-200 mt-6 pt-4">
        <p className="text-xs text-stone-400 mb-3">Copia de seguridad de tus datos</p>
        {importError && <p className="text-xs text-rose-600 mb-2">{importError}</p>}
        <div className="flex gap-2">
          <button onClick={onExport} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 text-white rounded-lg py-2 text-xs font-medium">
            <Download size={14} /> Exportar
          </button>
          <label className="flex-1 flex items-center justify-center gap-1.5 border border-stone-200 text-slate-700 rounded-lg py-2 text-xs font-medium cursor-pointer bg-white">
            <Upload size={14} /> Importar
            <input type="file" accept="application/json" onChange={handleFile} className="hidden" />
          </label>
        </div>
        <button
          onClick={() => onSignOut()}
          className="w-full flex items-center justify-center gap-1.5 text-stone-400 py-2 text-xs mt-3"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>

      {importConfirm !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-30" onClick={() => setImportConfirm(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-base mb-2">¿Reemplazar tus datos?</p>
            <p className="text-sm text-stone-600 mb-4">
              Esto sustituirá todos tus movimientos, fondos, categorías y configuración actuales. No se puede deshacer.
            </p>
            <button
              onClick={async () => {
                try {
                  const ok = await onImport(importConfirm);
                  setImportConfirm(null);
                  if (!ok) setImportError("No se pudieron importar los datos.");
                } catch (e) {
                  setImportConfirm(null);
                  setImportError(e instanceof Error ? e.message : "No se pudieron importar los datos.");
                }
              }}
              className="w-full bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium mb-2"
            >
              Sí, reemplazar mis datos
            </button>
            <button onClick={() => setImportConfirm(null)} className="w-full border border-stone-200 text-stone-600 rounded-lg py-2.5 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
