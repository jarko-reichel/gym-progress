import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const clear = useUiStore((s) => s.clearToast);
  if (!toast) return null;
  return (
    <div className="fixed inset-x-0 top-4 z-[200] mx-auto flex w-full max-w-sm justify-center px-4">
      <button
        type="button"
        onClick={clear}
        className={cn(
          'pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
          toast.tone === 'success' && 'bg-green-600 text-white',
          toast.tone === 'error' && 'bg-red-600 text-white',
          toast.tone === 'info' && 'bg-primary-700 text-white',
        )}
      >
        {toast.message}
      </button>
    </div>
  );
}
