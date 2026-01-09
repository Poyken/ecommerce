/**
 * =====================================================================
 * ZUSTAND STORE FACTORIES - Factory functions cho creating stores
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STORE FACTORY PATTERN:
 * - Thay vì viết lại code giống nhau cho mỗi store, ta tạo factory function.
 * - Factory nhận config và trả về store đã được tạo sẵn.
 *
 * 2. COMMON PATTERNS:
 * - Modal/Dialog stores: isOpen, open(), close()
 * - List stores: items, loading, error, fetch(), add(), remove()
 * - Entity stores: data, loading, error, fetch(), update()
 * =====================================================================
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base state cho modal/dialog stores.
 */
export interface ModalState<T = void> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Base state cho async data stores.
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Base state cho list stores.
 */
export interface ListState<T> extends AsyncState<T[]> {
  addItem: (item: T) => void;
  removeItem: (predicate: (item: T) => boolean) => void;
  updateItem: (predicate: (item: T) => boolean, updates: Partial<T>) => void;
  clearItems: () => void;
}

// =============================================================================
// MODAL STORE FACTORY
// =============================================================================

/**
 * Tạo store cho modal/dialog với các methods cơ bản.
 *
 * @example
 * // Tạo store cho Delete Confirmation Modal
 * export const useDeleteModalStore = createModalStore<{ id: string; name: string }>();
 *
 * // Sử dụng
 * const { isOpen, data, open, close } = useDeleteModalStore();
 * open({ id: "123", name: "Product A" });
 */
export function createModalStore<T = void>() {
  return create<ModalState<T>>((set) => ({
    isOpen: false,
    data: null,
    open: (data?: T) => set({ isOpen: true, data: data ?? null }),
    close: () => set({ isOpen: false, data: null }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }));
}

// =============================================================================
// ASYNC STATE STORE FACTORY
// =============================================================================

/**
 * Tạo store cho async data với loading/error states.
 *
 * @example
 * export const useUserStore = createAsyncStore<User>();
 */
export function createAsyncStore<T>(initialData: T | null = null) {
  return create<AsyncState<T>>((set) => ({
    data: initialData,
    loading: false,
    error: null,
    setData: (data) => set({ data, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),
    reset: () => set({ data: initialData, loading: false, error: null }),
  }));
}

// =============================================================================
// LIST STORE FACTORY
// =============================================================================

/**
 * Tạo store cho list data với CRUD operations.
 *
 * @example
 * export const useNotificationsStore = createListStore<Notification>();
 */
export function createListStore<T>() {
  return create<ListState<T>>((set) => ({
    data: [],
    loading: false,
    error: null,
    setData: (data) => set({ data, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),
    reset: () => set({ data: [], loading: false, error: null }),
    addItem: (item) =>
      set((state) => ({
        data: state.data ? [...state.data, item] : [item],
      })),
    removeItem: (predicate) =>
      set((state) => ({
        data: state.data ? state.data.filter((item) => !predicate(item)) : [],
      })),
    updateItem: (predicate, updates) =>
      set((state) => ({
        data: state.data
          ? state.data.map((item) =>
              predicate(item) ? { ...item, ...updates } : item
            )
          : [],
      })),
    clearItems: () => set({ data: [] }),
  }));
}

// =============================================================================
// PERSISTED STORE FACTORY
// =============================================================================

/**
 * Tạo store với localStorage persistence.
 * Dữ liệu được lưu lại khi refresh page.
 *
 * @example
 * export const useRecentlyViewedStore = createPersistedListStore<string>("recently-viewed");
 */
export function createPersistedListStore<T>(storageKey: string, maxItems = 20) {
  return create<
    ListState<T> & {
      addUnique: (item: T, getId: (item: T) => string) => void;
    }
  >()(
    persist(
      (set) => ({
        data: [],
        loading: false,
        error: null,
        setData: (data) => set({ data, error: null }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error, loading: false }),
        reset: () => set({ data: [], loading: false, error: null }),
        addItem: (item) =>
          set((state) => {
            const newData = state.data ? [item, ...state.data] : [item];
            return { data: newData.slice(0, maxItems) };
          }),
        removeItem: (predicate) =>
          set((state) => ({
            data: state.data
              ? state.data.filter((item) => !predicate(item))
              : [],
          })),
        updateItem: (predicate, updates) =>
          set((state) => ({
            data: state.data
              ? state.data.map((item) =>
                  predicate(item) ? { ...item, ...updates } : item
                )
              : [],
          })),
        clearItems: () => set({ data: [] }),
        // Thêm item với dedup logic
        addUnique: (item, getId) =>
          set((state) => {
            const itemId = getId(item);
            const filtered = state.data
              ? state.data.filter((i) => getId(i) !== itemId)
              : [];
            const newData = [item, ...filtered].slice(0, maxItems);
            return { data: newData };
          }),
      }),
      {
        name: storageKey,
        partialize: (state) => ({ data: state.data }),
      }
    )
  );
}

// =============================================================================
// COUNTER STORE FACTORY
// =============================================================================

/**
 * Tạo store cho counter (cart count, notification count, etc.)
 *
 * @example
 * export const useCartCountStore = createCounterStore();
 */
export function createCounterStore(initialCount = 0) {
  return create<{
    count: number;
    increment: (amount?: number) => void;
    decrement: (amount?: number) => void;
    setCount: (count: number) => void;
    reset: () => void;
  }>((set) => ({
    count: initialCount,
    increment: (amount = 1) =>
      set((state) => ({ count: state.count + amount })),
    decrement: (amount = 1) =>
      set((state) => ({ count: Math.max(0, state.count - amount) })),
    setCount: (count) => set({ count }),
    reset: () => set({ count: initialCount }),
  }));
}

// =============================================================================
// TOGGLE STORE FACTORY
// =============================================================================

/**
 * Tạo store đơn giản cho toggle state (sidebar, menu, etc.)
 *
 * @example
 * export const useSidebarStore = createToggleStore();
 */
export function createToggleStore(initialValue = false) {
  return create<{
    isActive: boolean;
    toggle: () => void;
    setActive: (value: boolean) => void;
    activate: () => void;
    deactivate: () => void;
  }>((set) => ({
    isActive: initialValue,
    toggle: () => set((state) => ({ isActive: !state.isActive })),
    setActive: (value) => set({ isActive: value }),
    activate: () => set({ isActive: true }),
    deactivate: () => set({ isActive: false }),
  }));
}

// =============================================================================
// SELECTION STORE FACTORY
// =============================================================================

/**
 * Tạo store cho multi-select (checkboxes, data table selection)
 *
 * @example
 * export const useProductSelectionStore = createSelectionStore<string>();
 */
export function createSelectionStore<T>() {
  return create<{
    selectedItems: Set<T>;
    isSelected: (item: T) => boolean;
    toggle: (item: T) => void;
    select: (item: T) => void;
    deselect: (item: T) => void;
    selectAll: (items: T[]) => void;
    deselectAll: () => void;
    getSelectedArray: () => T[];
  }>((set, get) => ({
    selectedItems: new Set<T>(),
    isSelected: (item) => get().selectedItems.has(item),
    toggle: (item) =>
      set((state) => {
        const newSet = new Set(state.selectedItems);
        if (newSet.has(item)) {
          newSet.delete(item);
        } else {
          newSet.add(item);
        }
        return { selectedItems: newSet };
      }),
    select: (item) =>
      set((state) => {
        const newSet = new Set(state.selectedItems);
        newSet.add(item);
        return { selectedItems: newSet };
      }),
    deselect: (item) =>
      set((state) => {
        const newSet = new Set(state.selectedItems);
        newSet.delete(item);
        return { selectedItems: newSet };
      }),
    selectAll: (items) => set({ selectedItems: new Set(items) }),
    deselectAll: () => set({ selectedItems: new Set() }),
    getSelectedArray: () => Array.from(get().selectedItems),
  }));
}
