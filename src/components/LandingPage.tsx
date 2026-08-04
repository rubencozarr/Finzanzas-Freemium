import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  Zap,
  PieChart,
  Target,
  ShieldCheck,
  Ban,
  Layers,
  Lock,
  Check,
  TrendingUp,
  FileText,
  PiggyBank,
  BarChart3,
  Download,
  type LucideIcon,
} from "lucide-react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { GooglePlayBadge } from "./GooglePlayBadge";
import { SiteFooter } from "./SiteFooter";
import { SectionTitleAccent } from "./SectionTitleAccent";

interface LandingPageProps {
  onLoginClick: () => void;
}

const SEO_TITLE = "Nitid: Control de Gastos — Tus finanzas con claridad";
const SEO_DESCRIPTION = "Registra gastos, ahorra con metas y analiza tus finanzas. Sin banco, sin anuncios, gratis. Descarga Nitid.";

// La landing solo se monta para visitantes sin sesión desde el navegador (ver App.tsx); useSeoMeta se
// encarga de sustituir/restaurar el <title>/<meta description>/og:* mientras esté montada.
function useLandingSeo() {
  useSeoMeta({
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    image: "https://nitidapp.com/icon-512.png",
    url: "https://nitidapp.com",
  });
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

function DeviceFrame({ src, alt, eager = false, className = "" }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`w-[220px] sm:w-full sm:max-w-[260px] rounded-[24px] border border-stone-200 shadow-xl bg-white overflow-hidden ${className}`}>
      <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
      </div>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="w-full block object-contain" />
    </div>
  );
}

function CheckRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 shrink-0">
        <Icon className="text-emerald-600" size={14} strokeWidth={2.25} />
      </span>
      <span className="text-sm text-stone-700">{text}</span>
    </div>
  );
}

const TRUST_BADGES = ["Gratis", "Sin anuncios", "Sin banco"];

const EASY_STEPS = [
  { icon: Zap, text: "Registra en 3 toques" },
  { icon: PieChart, text: "Ve tus hábitos" },
  { icon: Target, text: "Ahorra con metas" },
];

const SCREENSHOTS = [
  { src: "/screenshot-raw-mensual.webp", caption: "Entiende tus gastos" },
  { src: "/screenshot-raw-fondos.webp", caption: "Ahorra con metas" },
  { src: "/screenshot-raw-anual.webp", caption: "Analiza tu año" },
];

const DIFFERENTIATORS = [
  { icon: ShieldCheck, title: "Sin conexión bancaria", description: "No pedimos contraseñas de banco. Tú introduces tus datos manualmente." },
  { icon: Ban, title: "Sin anuncios", description: "Experiencia limpia, sin interrupciones." },
  { icon: Layers, title: "Todo en una app", description: "Gastos, ahorro e inversión en un solo lugar." },
  {
    icon: TrendingUp,
    title: "Crece con la app",
    description: "Empieza controlando gastos. Cuando estés listo: inversión, análisis anual y más con Premium.",
  },
];

const SEO_PARAGRAPH =
  "Nitid es una app de control de gastos y finanzas personales para quienes quieren saber en qué gastan, cuánto ahorran y cómo evoluciona su dinero. Registra tus gastos e ingresos, organiza tu ahorro personal con fondos y metas, y gestiona tu presupuesto mes a mes. Y si buscas más profundidad, el plan Premium incluye inversión desglosada por activos, análisis anual con comparativa entre años e insights automáticos de tus hábitos de gasto.";

const FREE_FEATURES = [
  { icon: FileText, text: "Transacciones ilimitadas" },
  { icon: PiggyBank, text: "2 fondos de ahorro" },
  { icon: PieChart, text: "Resumen y gráficos mensuales" },
  { icon: BarChart3, text: "Resumen anual" },
  { icon: Download, text: "Exportación de datos" },
  { icon: Ban, text: "Sin publicidad" },
];

export function LandingPage({ onLoginClick }: LandingPageProps) {
  useLandingSeo();

  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HERO */}
        <section className="px-5 pt-4 pb-8 sm:py-12">
          <div className="max-w-[1024px] mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center sm:items-start sm:w-[55%]">
              <img src="/icon-512.png" alt="Nitid" width={36} height={36} className="rounded-lg mb-3" />
              <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 max-w-md">
                  ¿Sabes en qué se va tu dinero cada mes?
                </h1>
                <p className="mt-2 text-stone-500 text-sm sm:text-base max-w-sm">
                  Controla tus gastos, ahorra con metas y entiende tus finanzas.
                </p>
                <GooglePlayBadge className="mt-4" />
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                  {TRUST_BADGES.map((label) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-stone-600 whitespace-nowrap">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 shrink-0">
                        <Check className="text-emerald-600" size={10} strokeWidth={3} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="sm:w-[45%] flex flex-col items-center gap-3">
              <DeviceFrame src="/screenshot-raw-movimientos.webp" alt="Pantalla de movimientos de Nitid" eager />
              <button
                onClick={onLoginClick}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Ya tengo cuenta → Iniciar sesión
              </button>
            </div>
          </div>
        </section>

        {/* FRANJA "ASÍ DE FÁCIL" (marquee continuo, ver @keyframes landing-marquee en index.css) */}
        <section className="py-3 bg-stone-50">
          <Reveal>
            <div className="overflow-hidden">
              <div className="landing-marquee-track flex w-max items-center gap-10 sm:gap-16">
                {[...EASY_STEPS, ...EASY_STEPS, ...EASY_STEPS].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 shrink-0">
                      <step.icon className="text-teal-600" size={14} strokeWidth={2} />
                    </span>
                    <span className="text-xs sm:text-sm text-stone-600 whitespace-nowrap">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* SCREENSHOTS */}
        <section className="px-5 py-12">
          <div className="max-w-[1024px] mx-auto">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-stone-800">Tu dinero, con claridad</h2>
              <SectionTitleAccent />
            </Reveal>
            <Reveal>
              <div className="flex gap-4 overflow-x-auto pb-2 sm:justify-center sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-5 px-10 sm:mx-0 sm:px-0">
                {SCREENSHOTS.map((shot) => (
                  <div key={shot.src} className="flex-none snap-center flex flex-col items-center">
                    <DeviceFrame src={shot.src} alt={shot.caption} />
                    <span className="mt-3 inline-block bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-1 rounded-full">
                      {shot.caption}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* PÁRRAFO SEO */}
        <section className="px-5 py-8 sm:py-10">
          <Reveal>
            <p className="max-w-2xl mx-auto text-center text-stone-500 text-sm leading-relaxed">{SEO_PARAGRAPH}</p>
          </Reveal>
        </section>

        {/* DIFERENCIADORES */}
        <section className="px-5 py-12 bg-stone-50">
          <div className="max-w-[1024px] mx-auto">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-stone-800">¿Por qué Nitid?</h2>
              <SectionTitleAccent />
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
              {DIFFERENTIATORS.map((item) => (
                <Reveal
                  key={item.title}
                  className="flex flex-col items-start p-4 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 shrink-0">
                    <item.icon className="text-teal-600" size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-2 font-bold text-sm text-stone-800">{item.title}</h3>
                  <p className="mt-1 text-xs text-stone-500">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* EMPIEZA GRATIS — tarjeta de plan única */}
        <section className="px-5 py-12">
          <div className="max-w-[1024px] mx-auto text-center">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Gratis. Sin letra pequeña.</h2>
              <SectionTitleAccent />
              <p className="-mt-3 text-stone-500 text-sm">Todo esto incluido, sin pagar nada.</p>
              <div className="mt-7 max-w-[400px] mx-auto bg-white border border-teal-400 rounded-2xl shadow-lg p-6 text-left">
                <div className="flex justify-center">
                  <span className="inline-block bg-teal-600 text-white text-sm font-semibold px-4 py-1 rounded-full">Plan Gratuito</span>
                </div>
                <div className="mt-5 flex flex-col">
                  {FREE_FEATURES.map((feature) => (
                    <CheckRow key={feature.text} icon={feature.icon} text={feature.text} />
                  ))}
                </div>
                <div className="border-t border-stone-200 my-4" />
                <p className="text-center text-xs text-stone-400 italic">Cuando quieras ir más allá: Premium desde 2,50€/mes.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PRIVACIDAD (SIN BANCO) */}
        <section className="px-5 py-12 bg-teal-600 text-white">
          <div className="max-w-md mx-auto text-center flex flex-col items-center">
            <Reveal className="flex flex-col items-center">
              <Lock className="text-white" size={48} strokeWidth={1.5} />
              <h2 className="mt-4 text-xl sm:text-2xl font-bold">Sin conexión bancaria</h2>
              <p className="mt-3 text-teal-100 text-sm leading-relaxed">
                No pedimos acceso a tu banco ni a tus contraseñas bancarias. Tú introduces tus datos, tú decides qué registrar.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="px-5 py-12 bg-stone-50 text-center">
          <div className="max-w-[1024px] mx-auto flex flex-col items-center">
            <Reveal className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-stone-800 max-w-sm">Tus finanzas, con toda la claridad</h2>
              <GooglePlayBadge className="mt-5" />
              <img src="/icon-512.png" alt="Nitid" width={28} height={28} className="mt-4 rounded-md" />
            </Reveal>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
