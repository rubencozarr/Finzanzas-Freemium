import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Zap, PieChart, Target, ShieldCheck, Ban, Layers, Heart, Check, Lock } from "lucide-react";
import { PLAY_STORE_URL } from "../lib/constants";

interface LandingPageProps {
  onLoginClick: () => void;
}

function Reveal({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

const STEPS = [
  { number: "1", icon: Zap, title: "Registra en segundos", description: "Cada café, cada compra, cada recibo. En 3 toques." },
  { number: "2", icon: PieChart, title: "Ve a dónde va tu dinero", description: "Gráficos claros que te muestran tus hábitos reales." },
  { number: "3", icon: Target, title: "Ahorra para lo que importa", description: "Crea fondos con metas y ve tu progreso cada día." },
];

const DIFFERENTIATORS = [
  { icon: ShieldCheck, title: "Privacidad total", description: "Sin banco, sin contraseñas bancarias. Solo tú ves tus datos." },
  { icon: Ban, title: "Sin anuncios", description: "Ni ahora ni nunca. Tu experiencia sin interrupciones." },
  { icon: Layers, title: "Todo en una app", description: "Gastos, ahorro e inversión juntos. Sin necesitar tres apps." },
  { icon: Heart, title: "Precio justo", description: "Empieza gratis. Premium desde 2,50€/mes si quieres más." },
];

const FREE_FEATURES = [
  "Transacciones ilimitadas",
  "2 fondos de ahorro",
  "Gráficos mensuales",
  "6 meses de historial",
  "Exportación de datos",
];

const SCREENSHOTS = [
  { src: "/screenshot-mensual.png", caption: "Entiende tus gastos" },
  { src: "/screenshot-fondos.png", caption: "Ahorra con metas" },
  { src: "/screenshot-anual.png", caption: "Analiza tu año" },
];

export function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* HERO */}
      <section className="bg-linear-to-b from-white to-teal-50 px-5 pt-12 pb-16">
        <div className="max-w-[768px] mx-auto flex flex-col items-center text-center">
          <img src="/icon-512.png" alt="Nitid" className="w-16 h-16 rounded-2xl shadow-sm mb-6" />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900 max-w-md">
            ¿Sabes en qué se va tu dinero cada mes?
          </h1>
          <p className="mt-4 text-stone-600 text-base max-w-sm">
            Controla tus gastos, ahorra con metas y entiende tus finanzas. Sin conectar con tu banco.
          </p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-teal-600 px-8 py-4 text-white font-semibold text-base shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-transform"
          >
            Descargar gratis en Google Play
          </a>
          <button onClick={onLoginClick} className="mt-4 text-sm text-stone-500 underline underline-offset-2">
            Ya tengo cuenta → Iniciar sesión
          </button>
          <div className="mt-12 w-full max-w-[280px]">
            <img
              src="/screenshot-movimientos.png"
              alt="Pantalla de movimientos de Nitid"
              className="w-full rounded-[28px] border border-stone-200 shadow-2xl shadow-stone-300/50"
            />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-5 py-16">
        <div className="max-w-[768px] mx-auto">
          <Reveal>
            <h2 className="text-2xl font-serif font-bold text-center text-slate-900 mb-10">Así de fácil</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <Reveal key={step.number} className="flex flex-col items-center text-center">
                <span className="text-4xl font-serif font-bold text-teal-600">{step.number}</span>
                <step.icon className="mt-2 text-teal-600" size={28} strokeWidth={1.75} />
                <h3 className="mt-3 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="px-5 py-16 bg-teal-50/40">
        <div className="max-w-[768px] mx-auto">
          <Reveal>
            <h2 className="text-2xl font-serif font-bold text-center text-slate-900 mb-10">Tu dinero, con claridad</h2>
          </Reveal>
          <Reveal>
            <div className="flex gap-5 overflow-x-auto pb-2 sm:justify-center sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-5 px-5 sm:mx-0 sm:px-0">
              {SCREENSHOTS.map((shot) => (
                <div key={shot.src} className="flex-none w-[220px] snap-center flex flex-col items-center">
                  <img
                    src={shot.src}
                    alt={shot.caption}
                    className="w-full rounded-2xl border border-stone-200 shadow-lg shadow-stone-300/40"
                  />
                  <p className="mt-3 text-sm text-stone-600 text-center">{shot.caption}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="px-5 py-16">
        <div className="max-w-[768px] mx-auto">
          <Reveal>
            <h2 className="text-2xl font-serif font-bold text-center text-slate-900 mb-10">¿Por qué Nitid?</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map((item) => (
              <Reveal key={item.title} className="flex flex-col items-start p-5 rounded-2xl bg-stone-50 border border-stone-100">
                <item.icon className="text-teal-600" size={32} strokeWidth={1.5} />
                <h3 className="mt-3 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VERSION GRATUITA */}
      <section className="px-5 py-16 bg-stone-50">
        <div className="max-w-[768px] mx-auto text-center">
          <Reveal className="flex flex-col items-center">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Empieza gratis. De verdad.</h2>
            <p className="mt-2 text-stone-600">Sin trucos. Sin límite de tiempo. Sin anuncios.</p>
            <ul className="mt-8 flex flex-col items-start gap-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-slate-800">
                  <Check className="text-teal-600 shrink-0" size={18} strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-stone-500">¿Necesitas más? Premium desde 2,50€/mes. Sin permanencia.</p>
          </Reveal>
        </div>
      </section>

      {/* CONFIANZA */}
      <section className="px-5 py-20">
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          <Reveal className="flex flex-col items-center">
            <Lock className="text-teal-600" size={40} strokeWidth={1.5} />
            <h2 className="mt-5 text-2xl font-serif font-bold text-slate-900">Tus datos son tuyos</h2>
            <p className="mt-4 text-stone-600 leading-relaxed">
              Cero analítica de terceros. Cero cookies de rastreo. Cero SDKs publicitarios. Cumplimos con el RGPD.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-20 bg-teal-600 text-white text-center">
        <div className="max-w-[768px] mx-auto flex flex-col items-center">
          <Reveal className="flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold max-w-sm">Empieza hoy a ver tus finanzas con claridad</h2>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-teal-700 font-semibold text-base shadow-lg active:scale-[0.98] transition-transform"
            >
              Descargar gratis en Google Play
            </a>
            <img src="/icon-512.png" alt="Nitid" className="mt-8 w-10 h-10 rounded-xl opacity-90" />
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-800 text-stone-300 px-5 py-10 text-sm">
        <div className="max-w-[768px] mx-auto flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a href="/privacy" className="hover:text-white">
              Política de privacidad
            </a>
            <span className="text-stone-600">|</span>
            <a href="/delete-account" className="hover:text-white">
              Eliminar cuenta
            </a>
            <span className="text-stone-600">|</span>
            <a href="mailto:contacto@nitidapp.com" className="hover:text-white">
              contacto@nitidapp.com
            </a>
          </div>
          <p className="text-stone-500">© 2026 Nitid Apps</p>
        </div>
      </footer>
    </div>
  );
}
