import { create } from 'zustand';

interface UiState {
  toast: { message: string; tone: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, tone?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  showToast: (message, tone = 'info') => {
    set({ toast: { message, tone } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));
