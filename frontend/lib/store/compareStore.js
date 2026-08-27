import { create } from 'zustand';

const MAX_COMPARE = 4;

const useCompareStore = create((set, get) => ({
  selectedIds: [],

  toggleProduct: (productId) => {
    const { selectedIds } = get();
    if (selectedIds.includes(productId)) {
      set({ selectedIds: selectedIds.filter((id) => id !== productId) });
    } else {
      if (selectedIds.length >= MAX_COMPARE) {
        return { error: `You can compare up to ${MAX_COMPARE} products only.` };
      }
      set({ selectedIds: [...selectedIds, productId] });
    }
    return { error: null };
  },

  removeProduct: (productId) => {
    set({ selectedIds: get().selectedIds.filter((id) => id !== productId) });
  },

  clearAll: () => set({ selectedIds: [] }),

  isSelected: (productId) => get().selectedIds.includes(productId),

  count: () => get().selectedIds.length,
}));

export default useCompareStore;
