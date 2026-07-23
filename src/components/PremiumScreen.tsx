import { useState, type ComponentType } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  FileSpreadsheet,
  FolderTree,
  Lightbulb,
  Target,
  TrendingUp,
  Unlock,
  Wallet,
  X,
} from "lucide-react";
import { openCheckout } from "../lib/lemonsqueezy";

interface Benefit {
  Icon: ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  title: string;
  text: string;
}

const BENEFITS: Benefit[] = [
  { Icon: Target, iconClass: "text-teal-600", title: "Metas de ahorro", text: "Pon un objetivo, ve tu progreso y deja de preguntarte si llegarás" },
  { Icon: BarChart3, iconClass: "text-amber-500", title: "Tu año completo", text: "Mira atrás con claridad y planifica lo que viene con confianza" },
  {
    Icon: Lightbulb,
    iconClass: "text-amber-500",
    title: "Análisis profundo de tus gastos",
    text: "Entiende tus hábitos y toma decisiones con datos, no con intuición",
  },
  { Icon: Wallet, iconClass: "text-amber-500", title: "Presupuestos por categoría", text: "Deja de llevarte sorpresas a final de mes" },
  { Icon: FolderTree, iconClass: "text-amber-500", title: "Categorías ilimitadas", text: "Adapta la app a tu vida, no tu vida a la app" },
  { Icon: TrendingUp, iconClass: "text-amber-500", title: "Inversión desglosada", text: "Ten claro dónde está tu dinero y si va por buen camino" },
  { Icon: Unlock, iconClass: "text-amber-500", title: "Historial sin límites", text: "Tu progreso completo, siempre disponible para ti" },
  { Icon: FileSpreadsheet, iconClass: "text-amber-500", title: "Exportar a Excel", text: "Tus datos organizados para revisarlos cuando quieras" },
];

const TECH_GROUPS: { title: string; items: string[] }[] = [
  { title: "Fondos y ahorro", items: ["Fondos ilimitados", "Metas de ahorro con progreso por fondo"] },
  { title: "Categorías", items: ["Categorías ilimitadas", "Subcategorías", "Presupuestos individuales por categoría con avisos"] },
  {
    title: "Análisis",
    items: ["Vista anual completa con 6 gráficos", "Comparativa entre años", "Análisis de tendencias", "Sparklines de 6 meses"],
  },
  { title: "Inversión", items: ["Gestión de activos con porcentajes de reparto", "Distribución real vs objetivo"] },
  {
    title: "Otros",
    items: ["Historial completo sin límite de 6 meses", "Exportación a Excel", "Iconos exclusivos para fondos"],
  },
];

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí, sin ningún compromiso. Puedes cancelar tu suscripción en cualquier momento desde la gestión de tu cuenta. Seguirás disfrutando de todas las funciones Premium hasta que termine el periodo que ya has pagado, y después tu cuenta pasará automáticamente al plan gratuito sin perder ninguno de tus datos.",
  },
  {
    question: "¿Puedo cambiar de plan más adelante?",
    answer:
      "Cuando quieras. Puedes pasar del plan mensual al anual (o al revés) desde la gestión de tu suscripción. Solo pagas la diferencia proporcional a lo que te quede del periodo actual, sin cobros duplicados ni pérdidas.",
  },
  {
    question: "¿Conservo los datos que ya he registrado?",
    answer:
      "Por supuesto. Al pasar a Premium, todo tu historial se mantiene intacto y desbloqueas al instante el análisis completo de todos tus datos anteriores. Cuanto más tiempo lleves registrando, más partido le sacarás desde el primer día.",
  },
  {
    question: "¿Qué pasa con mis datos si cancelo?",
    answer:
      "Tus datos nunca se borran. Si cancelas, conservas todo tu historial completo. Algunas funciones Premium dejarán de estar disponibles, pero tus movimientos, fondos y categorías siguen ahí. Si vuelves a Premium, recuperas el acceso completo al instante.",
  },
  {
    question: "¿Necesito dar acceso a mi banco?",
    answer:
      "No, nunca. Nitid funciona con entrada manual precisamente para que tú tengas el control total y tu información financiera sea completamente privada. No conectamos con tu banco ni accedemos a tus cuentas.",
  },
  {
    question: "¿Cómo se gestiona el pago?",
    answer: "El pago se procesa de forma segura a través de Lemon Squeezy, nuestro proveedor de pagos. No almacenamos los datos de tu tarjeta en ningún momento.",
  },
];

interface PremiumScreenProps {
  isPremium: boolean;
  userId?: string;
  userEmail?: string;
  onClose: () => void;
}

export function PremiumScreen({ isPremium, userId, userEmail, onClose }: PremiumScreenProps) {
  const [showTech, setShowTech] = useState(false);
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set());

  const toggleFaq = (i: number) =>
    setOpenFaq((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const startCheckout = () => {
    if (userId) openCheckout(userId, userEmail);
  };

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col">
      <header
        className="bg-slate-800 text-stone-50 px-5 pb-4 flex items-center justify-between shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <h1 className="font-serif text-xl tracking-tight">Premium</h1>
        <button onClick={onClose} className="text-stone-300 hover:text-white">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8 max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <Crown size={36} className="text-amber-500 mx-auto mb-3" />
          <h2 className="font-serif text-xl text-slate-800 mb-1.5">Tus finanzas, con toda la claridad</h2>
          <p className="text-sm text-stone-500">Analiza, planifica y controla tu dinero sin límites.</p>
        </div>

        <div className="space-y-3 mb-6">
          {BENEFITS.map(({ Icon, iconClass, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon size={20} className={`shrink-0 mt-0.5 ${iconClass}`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="border border-stone-200 rounded-lg p-3 bg-white flex flex-col">
            <p className="text-sm font-medium text-slate-800">Mensual</p>
            <p className="font-mono text-lg text-slate-800 mt-1 mb-3">2,99 €/mes</p>
            <button
              onClick={startCheckout}
              disabled={!userId}
              className="mt-auto w-full border border-slate-800 text-slate-800 rounded-lg py-2 text-xs font-medium"
            >
              Empieza a ver claro
            </button>
          </div>
          <div className="relative border-2 border-amber-500 rounded-lg p-3 bg-amber-50 flex flex-col">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              Más popular · Ahorra 16%
            </span>
            <p className="text-sm font-medium text-slate-800 mt-1">Anual</p>
            <p className="font-mono text-lg text-slate-800 mt-1">29,99 €/año</p>
            <p className="text-[11px] text-amber-800 mb-3">Solo 2,50 €/mes</p>
            <button
              onClick={startCheckout}
              disabled={!userId}
              className="mt-auto w-full bg-amber-500 text-white rounded-lg py-2 text-xs font-medium"
            >
              Empieza a ver claro
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-400 text-center mb-6">Cancela cuando quieras. Tus datos siempre son tuyos.</p>

        <div className="bg-white rounded-lg border border-stone-100 overflow-hidden mb-5">
          <button onClick={() => setShowTech((s) => !s)} className="w-full text-left px-3 py-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">Ver todo lo que incluye Premium</span>
            {showTech ? <ChevronUp size={16} className="text-stone-400 shrink-0" /> : <ChevronDown size={16} className="text-stone-400 shrink-0" />}
          </button>
          {showTech && (
            <div className="px-3 pb-3 space-y-3">
              {TECH_GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{g.title}</p>
                  <ul className="space-y-1">
                    {g.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-stone-600">
                        <Check size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 mb-6">
          {FAQ_ITEMS.map((item, i) => {
            const expanded = openFaq.has(i);
            return (
              <div key={item.question} className="bg-white rounded-lg border border-stone-100 overflow-hidden">
                <button onClick={() => toggleFaq(i)} className="w-full text-left px-3 py-3 flex items-center justify-between gap-2">
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

        <div className="bg-white rounded-lg border border-stone-100 p-3 text-center">
          {isPremium ? (
            <>
              <p className="text-sm font-medium text-slate-800 flex items-center justify-center gap-1.5">
                Tu plan actual: Premium <Check size={14} className="text-emerald-600" />
              </p>
              <a
                href="https://nitidfinanzas.lemonsqueezy.com/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-800 underline mt-1 inline-block"
              >
                Gestionar suscripción
              </a>
            </>
          ) : (
            <p className="text-sm text-stone-500">Tu plan actual: Gratuito</p>
          )}
        </div>
      </div>
    </div>
  );
}
