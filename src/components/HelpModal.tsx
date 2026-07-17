import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, X } from "lucide-react";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "¿Cómo funciona la app?",
    answer:
      "Registras a mano cada movimiento en Movimientos: ingresos, gastos fijos o variables, aportaciones y retiros de tus fondos de ahorro, e inversión. Los ingresos, gastos e inversiones que se repiten cada mes (nómina, alquiler, suscripciones...) los configuras una vez como preestablecidos en Ajustes y los aplicas de golpe con un botón, en vez de registrarlos uno a uno. Organizas tu ahorro en fondos con un objetivo cada uno, y en Mensual y Anual ves el desglose completo de en qué se ha ido tu dinero. La inversión se trata siempre por separado del ahorro, porque a diferencia de este puede subir o bajar de valor.",
  },
  {
    question: "¿Qué son los preestablecidos?",
    answer:
      "Son tus ingresos y gastos que se repiten todos los meses (nómina, alquiler, internet...). Los configuras una vez en Ajustes y después cada mes los aplicas de golpe desde Movimientos, ajustando el importe si algo ha cambiado.",
  },
  {
    question: "¿Qué diferencia hay entre gasto fijo y variable?",
    answer:
      "Fijo es lo que pagas sí o sí cada mes (alquiler, seguros, suscripciones). Variable es lo que cambia según tus decisiones (alimentación, ocio, ropa). La app los separa porque se controlan de forma distinta: el fijo lo reduces renegociando contratos, el variable lo reduces con hábitos diarios.",
  },
  {
    question: "¿Qué es el ahorro libre?",
    answer:
      "El ahorro libre es el dinero que te sobra cada mes después de descontar todos tus gastos, lo destinado a inversión y lo aportado a fondos de ahorro.",
  },
  {
    question: "¿Qué es el ahorro libre consolidado?",
    answer:
      "Es la suma de todo el dinero que te ha sobrado en meses anteriores sin gastarlo ni asignarlo a ningún fondo. Es dinero tuyo que puedes usar en cualquier momento marcando \"pagado con ahorro\" al crear un gasto.",
  },
  {
    question: "¿Qué es el ahorro libre en curso?",
    answer:
      "Es el ahorro libre del mes actual. Todavía puede cambiar (porque el mes no ha terminado). Cuando el mes cierre, ese dinero se sumará al consolidado.",
  },
  {
    question: "¿Qué es la tasa de ahorro?",
    answer:
      "La tasa de ahorro es el porcentaje de tus ingresos que consigues ahorrar cada mes, ya sea como ahorro libre o aportándolo a tus fondos. No incluye la inversión, porque en Klaro la inversión se trata por separado del ahorro (puede cambiar de valor). Por ejemplo, si ingresas 2.000€ y ahorras 400€ entre ahorro libre y fondos, tu tasa de ahorro es del 20%.",
  },
  {
    question: "¿Cómo funcionan los fondos de ahorro?",
    answer:
      "Son sobres virtuales donde separas parte de tu ahorro para un objetivo concreto (viajes, coche, colchón de emergencia). Aportas dinero cada mes y cuando llega el momento de gastarlo, lo marcas como \"pagado con ahorro\" al crear el gasto.",
  },
  {
    question: "¿La inversión cuenta como ahorro?",
    answer:
      "No. El ahorro es dinero que no pierde valor, la inversión sí puede subirlo o bajarlo. Por eso la app los muestra siempre separados. En Fondos e inversión ves ambos juntos como \"patrimonio total\", pero claramente diferenciados.",
  },
  {
    question: "¿Cómo uso los presupuestos?",
    answer:
      "En Ajustes → Categorías puedes poner un límite mensual a cada categoría variable (ej. Ocio: 150€) y un presupuesto general de todo lo variable. Cuando metes un gasto, la app te avisa al instante si te estás acercando o pasando del límite.",
  },
  {
    question: "¿Puedo exportar o hacer una copia de seguridad de mis datos?",
    answer:
      "Sí. En Ajustes encontrarás las opciones de exportar e importar tus datos en formato JSON (disponible para todos) y en formato Excel (disponible con Premium). Tus datos son tuyos y puedes descargarlos cuando quieras.",
  },
];

interface HelpModalProps {
  onClose: () => void;
  onRestartTour: () => void;
}

export function HelpModal({ onClose, onRestartTour }: HelpModalProps) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      <header
        className="bg-slate-800 text-stone-50 px-5 pb-4 flex items-center justify-between shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <h1 className="font-serif text-xl tracking-tight">Ayuda</h1>
        <button onClick={onClose} className="text-stone-300 hover:text-white">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 max-w-md w-full mx-auto">
        <div className="space-y-2 mb-5">
          {FAQ_ITEMS.map((item, i) => {
            const expanded = open.has(i);
            return (
              <div key={item.question} className="bg-white rounded-lg border border-stone-100 overflow-hidden">
                <button onClick={() => toggle(i)} className="w-full text-left px-3 py-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">{item.question}</span>
                  {expanded ? (
                    <ChevronUp size={16} className="text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-stone-400 shrink-0" />
                  )}
                </button>
                {expanded && <p className="text-sm text-stone-600 px-3 pb-3 -mt-1">{item.answer}</p>}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-stone-100 p-3">
          <p className="text-sm font-medium text-slate-800 mb-1">¿Puedo volver a ver el tutorial inicial?</p>
          <p className="text-sm text-stone-600 mb-3">Sí, desde aquí mismo.</p>
          <button
            onClick={onRestartTour}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-800 text-white rounded-lg py-2.5 text-sm font-medium"
          >
            <RotateCcw size={15} /> Repetir tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
