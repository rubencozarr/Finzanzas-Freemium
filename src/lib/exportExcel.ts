import { computeMonth, resolveCategoryName, resolveSubcategoryName, tasaAhorroPct } from "./calculations";
import { AHORRO_LIBRE_ID, MONTHS_FULL } from "./constants";
import { monthKey, todayISO } from "./format";
import type { Category, FundWithBalance, Transaction, TransactionType } from "../types";

const TYPE_LABELS: Record<TransactionType, string> = {
  ingreso: "Ingreso",
  gasto: "Gasto",
  aportacion: "Aportación",
  retiro: "Retiro",
  inversion: "Inversión",
};

function fundedByLabel(t: Transaction, funds: FundWithBalance[]): string {
  if (!t.fundedBy) return "";
  if (t.fundedBy === AHORRO_LIBRE_ID) return "ahorro libre";
  return funds.find((f) => f.id === t.fundedBy)?.name ?? "";
}

interface ExportExcelData {
  transactions: Transaction[];
  funds: FundWithBalance[];
  categories: Category[];
}

/** Exporta todos los datos del usuario a un .xlsx con 4 pestañas, generado 100% en el navegador.
 * Los números del resumen mensual reutilizan computeMonth/tasaAhorroPct de calculations.ts (las
 * mismas funciones que usan Mensual y Anual), para que coincidan exactamente con lo que ve el usuario
 * en la app. */
export async function exportToExcel({ transactions, funds, categories }: ExportExcelData) {
  // exceljs es pesado y solo lo usa quien exporta a Excel (premium): import() dinámico para que Vite lo
  // separe en su propio chunk, en vez de engordar el bundle inicial de todos los usuarios con él.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const movimientosSheet = workbook.addWorksheet("Movimientos");
  movimientosSheet.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Categoría", key: "categoria", width: 20 },
    { header: "Subcategoría", key: "subcategoria", width: 18 },
    { header: "Importe", key: "importe", width: 12 },
    { header: "Nota", key: "nota", width: 24 },
    { header: "Pagado con", key: "pagadoCon", width: 18 },
  ];
  [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((t) => {
      movimientosSheet.addRow({
        fecha: t.date,
        tipo: TYPE_LABELS[t.type],
        categoria: t.type === "gasto" ? resolveCategoryName(t, categories) : t.category,
        subcategoria: t.type === "gasto" ? (resolveSubcategoryName(t, categories) ?? "") : "",
        importe: t.amount,
        nota: t.note ?? "",
        pagadoCon: fundedByLabel(t, funds),
      });
    });

  const resumenSheet = workbook.addWorksheet("Resumen mensual");
  resumenSheet.columns = [
    { header: "Mes", key: "mes", width: 16 },
    { header: "Ingresos", key: "ingresos", width: 12 },
    { header: "Gastos fijos", key: "gastosFijos", width: 14 },
    { header: "Gastos variables", key: "gastosVariables", width: 16 },
    { header: "Gastos totales", key: "gastosTotales", width: 14 },
    { header: "Aportaciones a fondos", key: "aportaciones", width: 20 },
    { header: "Inversión", key: "inversion", width: 12 },
    { header: "Ahorro libre en curso", key: "ahorroLibre", width: 20 },
    { header: "Tasa de ahorro (%)", key: "tasaAhorro", width: 16 },
  ];
  const monthKeys = Array.from(new Set(transactions.map((t) => monthKey(t.date)))).sort();
  monthKeys.forEach((mKey) => {
    const stats = computeMonth(transactions, mKey);
    const [year, month] = mKey.split("-");
    resumenSheet.addRow({
      mes: `${MONTHS_FULL[parseInt(month, 10) - 1]} ${year}`,
      ingresos: stats.ingresos,
      gastosFijos: stats.fixedOrdinario,
      gastosVariables: stats.variableOrdinario,
      gastosTotales: stats.gastosTotal,
      aportaciones: stats.aportaciones,
      inversion: stats.inversion,
      ahorroLibre: stats.ahorroReal,
      tasaAhorro: Math.round(tasaAhorroPct(stats) * 10) / 10,
    });
  });

  const fondosSheet = workbook.addWorksheet("Fondos");
  fondosSheet.columns = [
    { header: "Nombre", key: "nombre", width: 20 },
    { header: "Saldo actual", key: "saldo", width: 14 },
    { header: "Meta", key: "meta", width: 12 },
    { header: "Progreso", key: "progreso", width: 12 },
  ];
  funds.forEach((f) => {
    fondosSheet.addRow({
      nombre: f.name,
      saldo: f.balance,
      meta: f.goalAmount ?? "",
      progreso: f.goalAmount ? Math.round((f.balance / f.goalAmount) * 1000) / 10 : "",
    });
  });

  const categoriasSheet = workbook.addWorksheet("Categorías");
  categoriasSheet.columns = [
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Nombre", key: "nombre", width: 20 },
    { header: "Presupuesto mensual", key: "presupuesto", width: 18 },
    { header: "Subcategorías", key: "subcategorias", width: 30 },
  ];
  categories.forEach((c) => {
    categoriasSheet.addRow({
      tipo: c.type === "fixed" ? "Fija" : "Variable",
      nombre: c.name,
      presupuesto: c.budget ?? "",
      subcategorias: c.subcategories.map((s) => s.name).join(", "),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nitid_datos_${todayISO()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
