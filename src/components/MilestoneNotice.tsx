interface MilestoneNoticeProps {
  message: string | null;
  onClose: () => void;
}

// A diferencia de Toast (auto-desaparece, pensado para confirmaciones rápidas de acciones), este aviso
// se queda hasta que el usuario lo cierra a propósito, y se centra en el viewport (fixed inset-0) en
// vez de anclarse arriba del todo, para que no se pierda si se ha hecho scroll.
export function MilestoneNotice({ message, onClose }: MilestoneNoticeProps) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-stone-600 mb-4">{message}</p>
        <button onClick={onClose} className="w-full bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium">
          Vale
        </button>
      </div>
    </div>
  );
}
