import type { ReactNode } from "react";
import { GooglePlayBadge } from "../../components/GooglePlayBadge";

interface AppReviewCardProps {
  number: number;
  name: string;
  isOurApp?: boolean;
  intro?: ReactNode;
  highlights: ReactNode;
  drawbacks: ReactNode;
  price: ReactNode;
  idealFor: string;
}

export function AppReviewCard({ number, name, isOurApp, intro, highlights, drawbacks, price, idealFor }: AppReviewCardProps) {
  return (
    <div className="mt-8">
      {isOurApp && (
        <span className="inline-block mb-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
          Nuestra app
        </span>
      )}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">
          {number}. {name}
        </h2>
        {intro && <div className="mt-3 flex flex-col gap-3 text-sm text-stone-600 leading-relaxed">{intro}</div>}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Lo que destaca</h3>
          <div className="mt-1.5 flex flex-col gap-2 text-sm text-stone-600 leading-relaxed">{highlights}</div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Lo que no tiene</h3>
          <div className="mt-1.5 flex flex-col gap-2 text-sm text-stone-600 leading-relaxed">{drawbacks}</div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Precio</h3>
          <div className="mt-1.5 text-sm text-stone-600 leading-relaxed">{price}</div>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-stone-50">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Para quién es ideal</h3>
          <p className="mt-1 text-sm text-stone-700">{idealFor}</p>
        </div>
      </div>
      {isOurApp && (
        <div className="mt-5 flex justify-center">
          <GooglePlayBadge />
        </div>
      )}
    </div>
  );
}
