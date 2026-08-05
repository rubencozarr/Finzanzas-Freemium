import { Lightbulb, AlertTriangle, Calculator, TrendingUp, PenLine, Eye, Bell } from "lucide-react";
import { ArticleBanner } from "../components/ArticleBanner";
import { StepCard } from "../components/StepCard";
import { Callout } from "../components/Callout";
import { PullQuote } from "../components/PullQuote";
import { RuleBlock } from "../components/RuleBlock";
import { SectionTitleAccent } from "../../components/SectionTitleAccent";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";

type CategoryTone = "slate" | "rose" | "teal";

const TONE_STYLES: Record<CategoryTone, string> = {
  slate: "bg-slate-50 border-slate-200",
  rose: "bg-rose-50 border-rose-200",
  teal: "bg-teal-50 border-teal-200",
};

function CategoryGrid({ tone, items, columns }: { tone: CategoryTone; items: string[]; columns: string }) {
  return (
    <div className={`grid ${columns} gap-3`}>
      {items.map((item) => (
        <div key={item} className={`flex items-center gap-2 p-3 rounded-xl border ${TONE_STYLES[tone]}`}>
          <span className="font-bold text-stone-800 text-sm">{item}</span>
        </div>
      ))}
    </div>
  );
}

const NEEDS_ITEMS = ["🏠 Alquiler o hipoteca", "💡 Luz, agua, gas", "📶 Internet y teléfono", "🛡️ Seguros", "📚 Educación", "💳 Préstamos y deudas"];
const WANTS_ITEMS = [
  "🛒 Supermercado (más allá de lo básico)",
  "🍽️ Comer y beber fuera",
  "🎬 Ocio y entretenimiento",
  "👗 Ropa y compras",
  "✈️ Viajes y escapadas",
  "📦 Compras online",
];
const SAVINGS_ITEMS = ["🏦 Fondo de emergencia", "🎯 Ahorro para metas", "📈 Inversión"];

const METHOD_STEPS = [
  { icon: PenLine, title: "Registrar", text: "cada gasto y saber a qué bloque pertenece" },
  { icon: Eye, title: "Visualizar", text: "en cualquier momento cómo vas en cada bloque" },
  { icon: Bell, title: "Reaccionar", text: "antes de que se acabe el mes si un bloque se desborda" },
];

export function Regla503020() {
  return (
    <article>
      <ArticleBanner
        title="La regla del 50-30-20: cómo aplicarla de verdad"
        subtitle="No basta con conocer la regla. Lo difícil es aplicarla mes a mes sin abandonar. Te enseñamos cómo."
        date="4 de agosto de 2026"
      />

      <p className="py-8 text-center text-xl sm:text-2xl text-stone-700 font-medium italic">
        Sabes que deberías ahorrar el 20% de tu sueldo. Pero, ¿cuántos meses lo has conseguido?
      </p>

      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            La regla del 50-30-20 es probablemente el método de presupuesto más conocido del mundo. La idea es sencilla: divide tus ingresos en
            tres bloques — 50% para lo que necesitas, 30% para lo que quieres, y 20% para ahorro. La popularizó la economista Elizabeth Warren en
            su libro <em>All Your Worth</em> y desde entonces la recomiendan bancos, asesores financieros y medio internet.
          </p>
          <p>
            El problema es que casi nadie la aplica de verdad. La mayoría la lee, asiente con la cabeza, y sigue sin saber cuánto gasta en ocio o
            si su porcentaje de ahorro es del 20% o del 3%. La regla es fácil de entender pero difícil de mantener sin un sistema que la haga
            visible en el día a día.
          </p>
          <p>
            En este artículo no vamos a explicarte la regla otra vez (para eso ya hay 200 artículos). Vamos a enseñarte cómo aplicarla de verdad,
            con un método práctico que puedes poner en marcha hoy.
          </p>
        </div>
        <PullQuote>"El problema no es no conocer la regla. Es no tener un sistema para seguirla."</PullQuote>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">La regla en 30 segundos (para quien no la conozca)</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col gap-3">
        <RuleBlock tone="slate" percent="50%" title="Necesidades">
          Lo que pagas sí o sí: alquiler, hipoteca, luz, agua, internet, seguros, transporte al trabajo, comida básica. Si dejas de pagarlo, tu
          vida se complica seriamente.
        </RuleBlock>
        <RuleBlock tone="rose" percent="30%" title="Deseos">
          Lo que eliges gastar: comer fuera, ropa que no es imprescindible, ocio, viajes, suscripciones de streaming, el café de especialidad.
          Podrías vivir sin ello (aunque no quieras).
        </RuleBlock>
        <RuleBlock tone="teal" percent="20%" title="Ahorro e inversión">
          Lo que guardas para tu futuro: fondo de emergencia, ahorro para vacaciones, ahorro para una entrada, inversión. No es "lo que sobra", es
          lo primero que separas.
        </RuleBlock>
        <Callout tone="amber" icon={Lightbulb}>
          <p>
            <strong>¿Y si mis números no cuadran?</strong> Es normal. La regla es una referencia, no una ley. Si tu alquiler se come el 40% del
            sueldo, tus necesidades serán más del 50%. Lo importante no son los porcentajes exactos, sino tener visibilidad de cuánto dedicas a
            cada bloque y decidir conscientemente si ese reparto te parece bien.
          </p>
        </Callout>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">El problema real: la regla no se aplica sola</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            La mayoría de artículos sobre la regla 50-30-20 terminan en el punto anterior: "divide tus ingresos en tres bloques". Y tú te quedas
            pensando: vale, ¿pero cómo hago eso en la práctica?
          </p>
          <p>
            Porque el día a día no funciona así. Tú no abres la cartera y dices "este café sale del bloque del 30%". Simplemente gastas y a final
            de mes no sabes si has cumplido la regla o no. Para cuando lo descubres, ya es tarde para corregir.
          </p>
          <p className="font-semibold text-stone-800">Aplicar la regla de verdad requiere tres cosas:</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {METHOD_STEPS.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white border border-stone-200">
              <step.icon size={22} className="text-teal-600" strokeWidth={1.75} />
              <p className="font-bold text-stone-800 text-sm">{step.title}</p>
              <p className="text-xs text-stone-500">{step.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-stone-600 leading-relaxed">
          Sin estas tres cosas, la regla se queda en buena intención. Con ellas, se convierte en un sistema que funciona mes tras mes.
        </p>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Cómo aplicar la regla paso a paso</h2>
        <SectionTitleAccent />
      </div>
      <div className="flex flex-col gap-8">
        <StepCard number={1} title="Calcula tus números reales">
          <p>
            Antes de repartir nada, necesitas saber cuánto entra y cuánto sale. Toma tus ingresos netos (lo que te llega a la cuenta después de
            impuestos) y calcula los tres bloques:
          </p>
          <Callout tone="stone" icon={Calculator}>
            <p className="font-semibold text-stone-800">Ejemplo con un sueldo de 1.800€ netos:</p>
            <ul className="list-disc pl-5">
              <li>
                50% necesidades → <strong className="text-slate-700">900€</strong> para gastos fijos
              </li>
              <li>
                30% deseos → <strong className="text-rose-700">540€</strong> para gastos variables
              </li>
              <li>
                20% ahorro → <strong className="text-teal-700">360€</strong> para ahorrar o invertir
              </li>
            </ul>
          </Callout>
          <p>
            Ahora compara esos números con tu realidad. ¿Tus gastos fijos suman más o menos de 900€? ¿Gastas más o menos de 540€ en variable?
            ¿Ahorras algo cercano a 360€?
          </p>
          <p>Si no tienes ni idea de cuánto gastas en cada bloque, es completamente normal. Para eso está el paso 2.</p>
        </StepCard>

        <StepCard number={2} title="Organiza tus gastos en los tres bloques">
          <p>La clave de la regla 50-30-20 es que cada euro que gastas pertenece a uno de los tres bloques. El truco está en saber cuál.</p>
          <div>
            <p className="font-semibold text-stone-800 mb-2">Bloque 50% — Necesidades (gastos fijos):</p>
            <CategoryGrid tone="slate" items={NEEDS_ITEMS} columns="grid-cols-2 sm:grid-cols-3" />
            <p className="mt-2 text-sm text-stone-500">Estos gastos los configuras una vez y se repiten cada mes. No necesitas pensarlos a diario.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-800 mb-2">Bloque 30% — Deseos (gastos variables):</p>
            <CategoryGrid tone="rose" items={WANTS_ITEMS} columns="grid-cols-2 sm:grid-cols-3" />
            <p className="mt-2 text-sm text-stone-500">
              Estos son los que cambian cada mes y los que necesitas registrar cada día. Aquí es donde suele estar el descontrol.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-800 mb-2">Bloque 20% — Ahorro e inversión:</p>
            <CategoryGrid tone="teal" items={SAVINGS_ITEMS} columns="grid-cols-1 sm:grid-cols-3" />
            <p className="mt-2 text-sm text-stone-500">Este bloque no es "lo que sobra al final del mes". Es lo primero que separas cuando cobras.</p>
          </div>
        </StepCard>

        <StepCard number={3} title="Establece tus límites">
          <p>
            Ahora que sabes a qué bloque pertenece cada gasto, pon un límite a cada bloque. Esto es lo que convierte la regla en un sistema con
            alertas en vez de una idea bonita sin seguimiento.
          </p>
          <Callout tone="amber" icon={AlertTriangle}>
            <p>
              <strong>El error más común:</strong> No poner límite al bloque de deseos. "Ya iré controlando" no funciona. Necesitas un número
              concreto. Si tus ingresos son 1.800€, tu límite de gastos variables es 540€. Cuando llegas a 540€, paras. Sin un número, no hay
              freno.
            </p>
          </Callout>
          <p>
            Tu presupuesto de gastos fijos probablemente ya es un número que conoces (la suma de todos los recibos). El de ahorro es el 20% (o lo
            que puedas). Y el de gastos variables es lo que queda, que es exactamente donde tienes que poner el foco.
          </p>
        </StepCard>

        <StepCard number={4} title="Registra y mira cómo vas">
          <p>Aquí es donde la mayoría abandona. Porque registrar gastos suena aburrido. Pero no tiene por qué serlo.</p>
          <p>
            El truco no es registrarlo todo a final del día (se te olvidan la mitad). Es registrar cada gasto en el momento, en 3 segundos.
            Cualquier método vale: una nota en el móvil, un papel, o una app. Lo que importa es la inmediatez.
          </p>
          <PullQuote>"Registrar un gasto tarda menos que pagar con el móvil. Si puedes pagar con Apple Pay, puedes apuntar el gasto."</PullQuote>
          <p>
            Y una vez a la semana (el domingo, por ejemplo), mírate los números: ¿cuánto llevas gastado en el bloque de deseos? ¿Vas dentro del
            límite o te lo estás comiendo demasiado rápido?
          </p>
          <p>
            Si a mitad de mes descubres que ya llevas el 80% del presupuesto de ocio gastado, puedes decidir frenar las dos últimas semanas. Con
            la regla mensual sin seguimiento, eso lo descubres cuando ya no hay remedio.
          </p>
        </StepCard>

        <StepCard number={5} title="Haz del ahorro un gasto fijo">
          <p>El último cambio de mentalidad que necesitas: el ahorro no es lo que sobra. El ahorro es un gasto fijo más.</p>
          <p>
            El día que cobras, antes de gastar en nada variable, separa tu 20% (o el porcentaje que hayas decidido) y ponlo en un sitio separado.
            Un fondo de ahorro, una cuenta aparte, donde sea. Pero que salga de tu dinero disponible inmediatamente.
          </p>
          <Callout tone="emerald" icon={TrendingUp}>
            <p>
              <strong>Lo que cambia cuando haces esto:</strong> Dejas de pensar "a ver si este mes sobra algo para ahorrar" y empiezas a pensar
              "tengo X€ para gastar en variable este mes". El presupuesto de deseos se convierte en lo que queda después de necesidades y ahorro,
              no al revés.
            </p>
          </Callout>
          <p>
            Si además le pones nombre a ese ahorro (vacaciones de agosto, fondo de emergencia, entrada del coche), el hábito se refuerza solo. No
            es lo mismo ahorrar 360€ "por ahorrar" que ver una barra que dice "vacaciones: 1.400€ de 2.000€". El progreso visual motiva más que
            cualquier regla.
          </p>
        </StepCard>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">¿Y si no llego al 20% de ahorro?</h2>
        <SectionTitleAccent />
      </div>
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <div className="flex flex-col gap-4 text-stone-600 leading-relaxed">
          <p>
            Es perfectamente normal, especialmente si tu alquiler o hipoteca se lleva una parte grande de tus ingresos. La regla 50-30-20 es una
            guía, no un mandato. Si tus necesidades son el 60% en vez del 50%, no estás haciendo nada mal. Significa que tu situación requiere un
            reparto diferente.
          </p>
          <p>
            Lo importante es que tengas visibilidad. Si sabes que tus necesidades son el 60%, tus deseos el 25% y tu ahorro el 15%, ya tienes un
            punto de partida real sobre el que trabajar. Eso es infinitamente mejor que no tener ni idea de cómo se reparte tu dinero.
          </p>
        </div>
        <div className="mt-4">
          <Callout tone="amber" icon={Lightbulb}>
            <p>
              <strong>Consejo práctico:</strong> Si no llegas al 20%, empieza por el 5% o el 10%. Lo que puedas. El hábito de ahorrar algo todos
              los meses importa más que el porcentaje exacto. Cuando tus ingresos suban o tus gastos fijos bajen, aumentas el porcentaje.
            </p>
          </Callout>
        </div>
      </div>

      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">La regla 50-30-20 con Nitid</h2>
        <SectionTitleAccent />
      </div>
      <div className="rounded-2xl bg-white border border-teal-300 shadow-md p-6">
        <p className="text-stone-600 leading-relaxed">
          Si has leído hasta aquí, ya sabes cómo aplicar la regla. Todo lo que hemos descrito puedes hacerlo con papel y bolígrafo. Pero mantener
          el sistema mes tras mes sin una herramienta que automatice los cálculos es difícil.
        </p>
        <p className="mt-3 font-semibold text-stone-800">Nitid está diseñada con una estructura que encaja directamente con la regla 50-30-20:</p>
        <div className="mt-4 flex flex-col gap-3">
          <RuleBlock tone="slate" percent="50%" title="Necesidades = Categorías fijas en Nitid">
            Configuras tus gastos recurrentes una vez (alquiler, luz, seguros...) y la app los registra cada mes. Sabes siempre cuánto suman tus
            necesidades.
          </RuleBlock>
          <RuleBlock tone="rose" percent="30%" title="Deseos = Categorías variables en Nitid">
            Registras cada gasto del día a día en su categoría. El donut mensual te muestra al instante cómo se distribuyen. Si activas
            presupuestos por categoría, la app te avisa cuando te acercas al límite.
          </RuleBlock>
          <RuleBlock tone="teal" percent="20%" title="Ahorro = Fondos de ahorro en Nitid">
            Creas fondos con nombre y meta (vacaciones, emergencia, coche). Cada mes aportas tu 20% y ves la barra de progreso avanzar. Si además
            inviertes, el seguimiento de inversión te muestra dónde está ese dinero.
          </RuleBlock>
        </div>
        <p className="mt-4 text-stone-600 leading-relaxed">
          La tasa de ahorro se calcula automáticamente cada mes. Sin hojas de cálculo, sin fórmulas, sin hacer nada manual. Abres la app y ves si
          este mes has cumplido la regla o no.
        </p>
        <p className="mt-2 text-stone-600 leading-relaxed">Entrada manual, sin conectar tu banco, sin anuncios y gratis.</p>
        <div className="mt-6 flex justify-center">
          <GooglePlayBadge />
        </div>
      </div>

      <p className="mt-10 text-lg text-stone-400 italic text-center">
        "La regla 50-30-20 no cambia tu vida por conocerla. La cambia cuando la aplicas."
      </p>
    </article>
  );
}
