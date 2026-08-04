import type { ReactNode } from "react";
import { ThumbsUp, AlertCircle, Tag, User } from "lucide-react";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";

interface AppReviewCardProps {
  number: number;
  name: string;
  isOurApp?: boolean;
  intro?: ReactNode;
  highlights: ReactNode;
  drawbacks: ReactNode;
  priceFree: ReactNode;
  pricePremium: ReactNode;
  idealFor: string;
}

export function AppReviewCard({ number, name, isOurApp, intro, highlights, drawbacks, priceFree, pricePremium, idealFor }: AppReviewCardProps) {
  return (
    <div>
      {isOurApp && (
        <span className="inline-block mb-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
          Nuestra app
        </span>
      )}
      <div className={`rounded-2xl bg-white border overflow-hidden ${isOurApp ? "border-teal-300 shadow-md" : "border-stone-200 shadow-sm"}`}>
        <div className="px-6 py-4 bg-stone-100 border-b border-stone-200">
          <h2 className="text-xl font-bold text-stone-900">
            {number}. {name}
          </h2>
        </div>
        <div className="p-6">
          {intro && <div className="flex flex-col gap-3 text-sm text-stone-600 leading-relaxed">{intro}</div>}

          <div className={intro ? "mt-5" : ""}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <ThumbsUp size={16} className="text-emerald-500" strokeWidth={2} />
              Lo que destaca
            </h3>
            <div className="mt-1.5 flex flex-col gap-2 text-sm text-stone-600 leading-relaxed">{highlights}</div>
          </div>

          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <AlertCircle size={16} className="text-amber-500" strokeWidth={2} />
              Lo que no tiene
            </h3>
            <div className="mt-1.5 flex flex-col gap-2 text-sm text-stone-600 leading-relaxed">{drawbacks}</div>
          </div>

          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <Tag size={16} className="text-teal-600" strokeWidth={2} />
              Precio
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              <div className="rounded-xl px-3 py-2 bg-emerald-50 text-emerald-800 text-sm">
                <span className="font-semibold">Gratis: </span>
                {priceFree}
              </div>
              <div className="rounded-xl px-3 py-2 bg-teal-50 text-teal-800 text-sm">
                <span className="font-semibold">Premium: </span>
                {pricePremium}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-teal-50 border-l-4 border-teal-400 p-4">
            <User size={18} className="text-teal-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h3 className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Para quién es ideal</h3>
              <p className="mt-1 text-sm text-teal-900">{idealFor}</p>
            </div>
          </div>
        </div>
      </div>
      {isOurApp && (
        <div className="my-8 flex justify-center">
          <GooglePlayBadge />
        </div>
      )}
    </div>
  );
}
