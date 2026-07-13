interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-[90%] text-center bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
      {message}
    </div>
  );
}
