import { AlertCircle, Eye, Target, Calculator, Clock, TrendingUp, Check, X } from "lucide-react";
import { ArticleBanner } from "../components/ArticleBanner";
import { StepCard } from "../components/StepCard";
import { Callout } from "../components/Callout";
import { PullQuote } from "../components/PullQuote";
import { Timeline } from "../components/Timeline";
import { DeviceFrame } from "../components/DeviceFrame";
import { SectionTitleAccent } from "../../components/SectionTitleAccent";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";

type ReasonTone = "rose" | "amber" | "emerald";

const REASON_STYLES: Record<ReasonTone, { bg: string; border: string; icon: string; title: string }> = {
  rose: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500", title: "text-rose-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500", title: "text-amber-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500", title: "text-emerald-700" },
};

const REASONS: Array<{ tone: ReasonTone; icon: typeof AlertCircle; title: string; text: string }> = [
  {
    tone: "rose",
    icon: AlertCircle,
    title: '"Gano poco"',
    text: "Puede ser cierto. Si tus gastos fijos ya consumen el 80-90% de tu sueldo, el margen es muy pequeño. Pero incluso en este caso, la mayoría de personas tiene un 5-10% de gastos variables que podrían redirigir sin cambiar su estilo de vida. El problema es que no saben cuáles son.",
  },
  {
    tone: "amber",
    icon: Eye,
    title: '"No sé en qué gasto"',
    text: "Esta es la más común. No es que gastes demasiado, es que gastas sin ser consciente. Un café aquí, un antojo allá, una compra online de 15€ que parecía insignificante. Por separado, nada preocupante. Juntos, pueden sumar 200-400€ al mes.",
  },
  {
    tone: "emerald",
    icon: Target,
    title: '"No tengo motivación"',
    text: "Ahorrar \"por ahorrar\" no funciona. Ahorrar para algo concreto (un viaje, un fondo de emergencia, un capricho grande) sí. La diferencia es que una meta con nombre y número genera progreso visible, y el progreso visible genera motivación.",
  },
];

const INVISIBLE_EXPENSES = [
  { label: "Café fuera de casa: 2€/día", total: "60€/mes" },
  { label: "Comer fuera entre semana (2 veces): 12€ × 8", total: "96€/mes" },
  { label: "Compras online impulsivas: ~3 al mes × 15€", total: "45€/mes" },
  { label: "Suscripciones que casi no usas", total: "20€/mes" },
  { label: "Snacks, bebidas, antojos: ~2€/día", total: "60€/mes" },
];

const EASY_CUTS = [
  { emoji: "☕", text: "Llevo café de casa 3 de los 5 días", saving: "ahorras 24€/mes" },
  { emoji: "🛒", text: "Hago lista antes de ir al supermercado", saving: "ahorras 40-60€/mes" },
  { emoji: "📱", text: "Espero 48h antes de comprar online", saving: "ahorras 30-50€/mes" },
  { emoji: "🎬", text: "Cancelo 1 suscripción que casi no uso", saving: "ahorras 10-15€/mes" },
];

const GOALS = [
  { emoji: "🏖️", name: "Vacaciones de verano", meta: "Meta: 800€" },
  { emoji: "🛡️", name: "Fondo de emergencia", meta: "Meta: 1.000€" },
  { emoji: "🎁", name: "Capricho especial", meta: "Meta: 300€" },
];

const MISTAKES = [
  {
    title: "Empezar ahorrando demasiado.",
    text: "Si nunca has ahorrado y el primer mes intentas guardar el 20% de tu sueldo, vas a sufrir, vas a quitarlo de los ahorros a mitad de mes, y vas a sentir que has fracasado. Empieza con 30-50€. Cuando eso sea cómodo, sube.",
  },
  {
    title: 'Ahorrar "lo que sobre".',
    text: "Si esperas a final de mes para ahorrar lo que quede, la respuesta siempre será cero. El dinero que no separas al principio del mes siempre se gasta. Trata el ahorro como un gasto fijo: se aparta el día que cobras, antes de gastar en nada variable.",
  },
  {
    title: "No ver el progreso.",
    text: "Si tu ahorro es un número en una cuenta bancaria mezclado con el resto de tu dinero, no sientes que avanzas. Necesitas ver el ahorro separado, con nombre y con progreso visual. Por eso los fondos de ahorro con metas funcionan mejor que una cuenta corriente con más saldo.",
  },
  {
    title: "Ser demasiado estricto.",
    text: 'Si un mes gastas más de lo planeado y te saltas el ahorro, no lo conviertas en "ya he fracasado, lo dejo todo". Un mes sin ahorrar no borra los meses anteriores. Vuelve al plan el siguiente mes sin drama.',
  },
];

const TIMELINE_NODES = [
  {
    period: "1-2",
    title: "Mes 1-2: Solo registro",
    description:
      "No intentas ahorrar nada. Solo registras tus gastos para ver a dónde va tu dinero. Descubres que gastas 180€/mes en comer fuera y 40€/mes en suscripciones que no usas.",
  },
  {
    period: "3",
    title: "Mes 3: Primer ahorro",
    description:
      'Cancelas una suscripción (12€/mes) y reduces comer fuera a una vez por semana en vez de dos (ahorras ~45€). Empiezas a guardar 50€/mes en un fondo llamado "Fondo de emergencia".',
  },
  {
    period: "4-6",
    title: "Mes 4-6: El hábito se instala",
    description:
      'Los 50€ se apartan automáticamente el día que cobras. Casi no lo notas. El fondo de emergencia lleva 200€. Decides crear un segundo fondo: "Vacaciones" con otros 50€/mes.',
  },
  {
    period: "7-12",
    title: "Mes 7-12: Crecimiento natural",
    description: (
      <>
        Llevas meses registrando gastos y ya sabes exactamente cuánto puedes permitirte. Subes el ahorro a 100€/mes total. Al final del año:
        fondo de emergencia con 500€ + fondo de vacaciones con 400€ + ahorro libre de meses anteriores ~300€.{" "}
        <strong className="text-emerald-700">Total: 1.200€ que hace un año no existían.</strong>
      </>
    ),
    emphasis: true,
  },
];

const NITID_FEATURES = [
  { title: "Registro rápido:", text: "Cada gasto en 3 toques. En el momento, no al final del día." },
  { title: "Totales automáticos:", text: "El donut mensual te muestra exactamente en qué se va tu dinero, por categoría." },
  { title: "Fondos de ahorro con metas:", text: "Crea fondos con nombre, pon un objetivo, y ve la barra de progreso cada vez que aportas." },
  { title: "Tasa de ahorro:", text: "Se calcula sola cada mes. Ves al instante si vas mejor o peor que el mes anterior." },
  { title: "Sin banco, sin anuncios:", text: "Tú introduces tus datos, solo tú los ves. Gratis y sin publicidad." },
];

export function ComoEmpezarAAhorrar() {
  return (
    <article>
      <ArticleBanner
        title="Cómo empezar a ahorrar aunque sientas que no te llega"
        subtitle="No necesitas ganar más. Necesitas ver con claridad a dónde va lo que ya ganas."
        date="4 de agosto de 2026"
      />

      <p className="py-8 text-center text-xl sm:text-2xl text-stone-700 font-medium italic">
        ¿Cuántas veces te has dicho "el mes que viene empiezo a ahorrar"?
      </p>

      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            Vamos a ser directos: si sientes que no te llega para ahorrar, probablemente tengas razón. Con los alquileres por las nubes, los
            precios del supermercado subiendo cada año, y un sueldo que crece mucho más despacio que la inflación, ahorrar puede parecer un lujo
            que no te puedes permitir.
          </p>
          <p>
            Pero hay una diferencia entre "no me llega" y "no sé a dónde va lo que me llega". Y esa diferencia es la que marca que puedas ahorrar
            50€ al mes o 0€.
          </p>
          <p>
            Este artículo no va de consejos genéricos tipo "cancela Netflix y deja de comprarte cafés". Va de un método práctico para encontrar
            dinero que ahora mismo no sabes que tienes, y convertirlo en ahorro real.
          </p>
        </div>
        <PullQuote>"No se trata de ganar más. Se trata de saber a dónde va lo que ganas."</PullQuote>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Por qué sientes que no te llega (y qué puedes hacer)</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <p className="text-stone-600 leading-relaxed">
          Hay tres razones por las que la mayoría de personas sienten que no pueden ahorrar, y solo una de ellas es real:
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REASONS.map((reason) => {
            const style = REASON_STYLES[reason.tone];
            return (
              <div key={reason.title} className={`p-4 rounded-2xl border ${style.bg} ${style.border}`}>
                <reason.icon size={22} className={style.icon} strokeWidth={1.75} />
                <p className={`mt-2 font-bold ${style.title}`}>{reason.title}</p>
                <p className="mt-1 text-sm text-stone-600 leading-relaxed">{reason.text}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-stone-600 leading-relaxed">
          La buena noticia: las razones 2 y 3 tienen solución sin ganar un céntimo más de lo que ganas ahora. Y la razón 1, cuando controlas la 2
          y la 3, suele ser menos grave de lo que parecía.
        </p>
      </div>

      <div className="mt-10 rounded-2xl bg-white border-l-4 border-teal-400 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-stone-100 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">El método del dinero invisible</h2>
        </div>
        <div className="p-6 flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            Lo llamamos "dinero invisible" porque es dinero que gastas cada mes pero que no ves gastar. No son los gastos grandes (esos los
            conoces perfectamente). Son los pequeños, los que pasan desapercibidos porque ninguno parece importante por sí solo.
          </p>
          <Callout tone="amber" icon={Calculator}>
            <p className="font-semibold text-stone-800">Un ejemplo real:</p>
            <ul className="flex flex-col gap-1">
              {INVISIBLE_EXPENSES.map((expense) => (
                <li key={expense.label} className="flex items-baseline justify-between gap-3">
                  <span>{expense.label}</span>
                  <strong className="text-stone-800 whitespace-nowrap">{expense.total}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-2 p-2 rounded-lg bg-amber-100 font-bold text-lg text-center text-amber-900">Total: 281€/mes que no ves gastar</p>
          </Callout>
          <p>
            No estamos diciendo que dejes de hacer todo esto. Estamos diciendo que probablemente no sabías que sumaban 281€ al mes. Y que de esos
            281€, seguro que hay 50-100€ en cosas que ni siquiera disfrutas especialmente.
          </p>
          <p>Ese es tu dinero invisible. Y convertirlo en ahorro no requiere sacrificio, requiere visibilidad.</p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Cómo encontrar tu dinero invisible (4 pasos)</h2>
        <SectionTitleAccent />
      </div>
      <div className="flex flex-col gap-8">
        <StepCard number={1} title="Registra todo durante 2 semanas">
          <p>
            No un mes, 2 semanas. Un mes suena demasiado y la gente abandona. 2 semanas son suficientes para ver el patrón y lo bastante cortas
            para mantener el hábito.
          </p>
          <p>
            Cada vez que gastes en algo que no sea un recibo fijo (alquiler, luz, etc.), apúntalo. En el momento, no al final del día. No importa
            si es con el móvil, con papel, o con una app. Lo que importa es hacerlo justo cuando pagas.
          </p>
          <Callout tone="teal" icon={Clock}>
            <p>
              <strong>¿Y si se me olvida?</strong> Se te va a olvidar, sobre todo los primeros días. No pasa nada. Cuando te acuerdes, apúntalo.
              Mejor un registro incompleto que ningún registro. A los 4-5 días se convierte en automático.
            </p>
          </Callout>
          <p>
            No juzgues ningún gasto mientras lo registras. No es momento de decir "no debería haberme comprado esto". Solo apunta y sigue con tu
            vida. El análisis viene después.
          </p>
        </StepCard>

        <StepCard number={2} title="Mira los totales por categoría">
          <p>
            Después de 2 semanas, multiplica por 2 para tener una estimación mensual. Agrupa por categorías (alimentación, ocio, transporte,
            compras, etc.) y ordena de mayor a menor.
          </p>
          <PullQuote>
            "Todo el mundo tiene un gasto que le sorprende. Para unos es comer fuera, para otros es compras online, para otros es transporte. El
            tuyo está esperando a que lo descubras."
          </PullQuote>
          <p>
            La categoría que más te sorprenda es donde está tu dinero invisible. No la que más gasta (esa probablemente la conoces), sino la que
            gasta más de lo que pensabas.
          </p>
        </StepCard>

        <StepCard number={3} title="Elige UN gasto que reducir (solo uno)">
          <p>
            No intentes recortar todo a la vez. Eso es como ponerte a dieta eliminando azúcar, harina, alcohol, fritos y lácteos el mismo lunes.
            Dura tres días.
          </p>
          <p>Elige el gasto que más fácil te resulte reducir sin sufrir. No el más grande, el más fácil. Algunos ejemplos:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EASY_CUTS.map((cut) => (
              <div key={cut.text} className="flex items-start gap-2 p-3 rounded-xl bg-stone-50">
                <span className="text-lg shrink-0">{cut.emoji}</span>
                <div>
                  <p className="text-sm text-stone-700">"{cut.text}"</p>
                  <p className="text-sm font-bold text-emerald-600">{cut.saving}</p>
                </div>
              </div>
            ))}
          </div>
          <p>
            No hace falta que sea un recorte enorme. 30-50€ al mes ya es ahorro real. Son 360-600€ al año. Suficiente para un viaje, un fondo de
            emergencia básico, o un capricho que sí quieres de verdad.
          </p>
          <Callout tone="emerald" icon={TrendingUp}>
            <p>
              <strong>El efecto psicológico:</strong> Cuando consigues ahorrar tu primer mes (aunque sean 30€), algo cambia en tu cabeza. Pasas de
              "no puedo ahorrar" a "puedo ahorrar poco, pero puedo". Y eso es todo lo que necesitas para que el hábito se establezca.
            </p>
          </Callout>
        </StepCard>

        <StepCard number={4} title="Dale nombre a tu ahorro">
          <p>
            Este es el paso que convierte el ahorro de obligación a motivación. No pongas el dinero en un montón genérico llamado "ahorros".
            Ponle nombre y número:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOALS.map((goal) => (
              <div key={goal.name} className="flex flex-col items-center text-center gap-1 p-4 rounded-xl bg-white border border-stone-200">
                <span className="text-2xl">{goal.emoji}</span>
                <span className="font-bold text-stone-800 text-sm">{goal.name}</span>
                <span className="text-xs text-stone-500">{goal.meta}</span>
              </div>
            ))}
          </div>
          <p>
            Cuando ves una barra de progreso que dice "Vacaciones: 240€ de 800€ (30%)", el ahorro deja de ser un sacrificio y se convierte en un
            avance hacia algo que deseas. Cada vez que aportas, ves la barra moverse. Eso engancha mucho más que cualquier consejo financiero.
          </p>
          <PullQuote>"No ahorras 50€ al mes. Ahorras para las vacaciones de verano, para tu tranquilidad, para un futuro que eliges tú."</PullQuote>
        </StepCard>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Los errores que hacen que la gente deje de ahorrar</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <p className="text-stone-600 leading-relaxed">
          Si has intentado ahorrar antes y lo has dejado, probablemente cometiste uno de estos errores. No es culpa tuya, es que el consejo
          habitual de finanzas personales está diseñado para personas que ya tienen el hábito, no para quienes empiezan.
        </p>
        <div className="mt-4 flex flex-col">
          {MISTAKES.map((mistake, i) => (
            <div key={mistake.title} className={`flex gap-3 py-4 ${i < MISTAKES.length - 1 ? "border-b border-stone-100" : ""}`}>
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 shrink-0">
                <X size={15} className="text-rose-500" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-bold text-stone-800">{mistake.title}</p>
                <p className="mt-1 text-sm text-stone-600 leading-relaxed">{mistake.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Un ejemplo real: de 0€ a 1.200€ en un año</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200">
        <Timeline nodes={TIMELINE_NODES} />
        <Callout tone="emerald" icon={TrendingUp}>
          <p>
            <strong>Nada de esto requirió ganar más dinero.</strong> Solo requirió saber en qué se iba y decidir conscientemente qué hacer con esa
            información.
          </p>
        </Callout>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Ponlo en práctica con Nitid</h2>
        <SectionTitleAccent />
      </div>
      <div className="rounded-2xl bg-white border border-teal-300 shadow-md p-6">
        <p className="text-stone-600 leading-relaxed">
          Todo lo que hemos descrito puedes hacerlo con un papel y un bolígrafo. Pero seamos realistas: el papel no te calcula totales por
          categoría, no te muestra barras de progreso hacia tus metas, y no te dice automáticamente si este mes estás ahorrando más o menos que
          el anterior.
        </p>
        <div className="mt-5 flex justify-center">
          <DeviceFrame src="/screenshot-raw-fondos.webp" alt="Fondos de ahorro con barras de progreso en Nitid" width={600} height={1233} />
        </div>
        <p className="mt-5 font-semibold text-stone-800">Nitid te facilita cada paso:</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {NITID_FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-50 shrink-0 mt-0.5">
                <Check size={12} className="text-teal-600" strokeWidth={3} />
              </span>
              <span className="text-sm text-stone-600">
                <strong className="text-stone-800">{feature.title}</strong> {feature.text}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-stone-600 leading-relaxed">Entrada manual, sin conectar tu banco y gratis.</p>
        <div className="mt-6 flex justify-center">
          <GooglePlayBadge />
        </div>
      </div>

      <p className="mt-10 text-lg text-stone-400 italic text-center">"No necesitas ganar más para empezar a ahorrar. Necesitas empezar."</p>
    </article>
  );
}
