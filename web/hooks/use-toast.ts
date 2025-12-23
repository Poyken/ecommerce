/**
 * =====================================================================
 * USE TOAST HOOK - Hook quản lý thông báo Toast
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REDUCER PATTERN (Flux Architecture):
 * - Sử dụng mô hình `Action` -> `Reducer` -> `State` tương tự Redux.
 * - Giúp quản lý state phức tạp (thêm, sửa, xóa, queue) một cách rõ ràng, dễ debug.
 *
 * 2. GLOBAL STATE WITHOUT CONTEXT:
 * - State được lưu trong biến `memoryState` (ngoài React Tree).
 * - Các component subscribe vào state này thông qua `listeners`.
 * - Lợi ích: Có thể gọi `toast()` từ bất kỳ đâu (kể cả ngoài React Component) mà không cần wrap Context.
 *
 * 3. AUTO-DISMISS:
 * - Sử dụng `setTimeout` và `Map` để quản lý việc tự động tắt toast sau 5s.
 * =====================================================================
 */

import type { ToastActionElement, ToastProps } from "@/components/atoms/toast";
import * as React from "react";

// =============================================================================
// ⚙️ CONSTANTS - Hằng số cấu hình
// =============================================================================

/** Số lượng toast tối đa hiển thị cùng lúc */
const TOAST_LIMIT = 5;

/** Thời gian tự động xóa toast sau khi dismiss (milliseconds) */
const TOAST_REMOVE_DELAY = 4000; // 4 giây

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Cấu trúc của một Toast.
 * Kế thừa từ ToastProps của component và thêm các fields mới.
 */
type ToasterToast = ToastProps & {
  /** ID unique của toast */
  id: string;
  /** Tiêu đề */
  title?: React.ReactNode;
  /** Mô tả chi tiết */
  description?: React.ReactNode;
  /** Action button (optional) */
  action?: ToastActionElement;
};

/**
 * Union type cho tất cả actions.
 */
type Action =
  | {
      type: "ADD_TOAST";
      toast: ToasterToast;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<ToasterToast>;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: ToasterToast["id"];
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: ToasterToast["id"];
    };

/**
 * State của toast system.
 */
interface State {
  toasts: ToasterToast[];
}

// =============================================================================
// 🔧 UTILITIES - Hàm tiện ích
// =============================================================================

/** Counter để generate ID unique cho mỗi toast */
let count = 0;

/**
 * Tạo ID unique cho toast mới.
 * Sử dụng counter để đảm bảo unique trong session.
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// =============================================================================
// ⏰ TIMEOUT MANAGEMENT - Quản lý auto-remove
// =============================================================================

/** Map lưu timeout của mỗi toast để cleanup */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Thêm toast vào queue để tự động xóa sau delay.
 * Nếu toast đã có trong queue thì bỏ qua.
 *
 * @param toastId - ID của toast cần schedule xóa
 */
const addToRemoveQueue = (toastId: string) => {
  // Tránh duplicate timeout cho cùng một toast
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // Schedule remove sau TOAST_REMOVE_DELAY
  const timeout = setTimeout(() => {
    const action: Action = {
      type: "REMOVE_TOAST",
      toastId,
    };
    dispatch(action);
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// =============================================================================
// 🔄 REDUCER - Xử lý state transitions
// =============================================================================

/**
 * Reducer xử lý các action và trả về state mới.
 * Pure function: không modify state cũ, tạo state mới.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // Thêm toast mới vào đầu array, giới hạn số lượng
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      // Cập nhật toast theo ID
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Schedule remove cho toast bị dismiss
      // Side effect ở đây để đơn giản hóa code
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Dismiss all: schedule remove cho tất cả
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      // Set open = false để trigger animation đóng
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || action.toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      // Xóa hoàn toàn toast khỏi state
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// =============================================================================
// 📡 STATE MANAGEMENT - Global state với listeners
// =============================================================================

/** Danh sách listeners đang subscribe */
const listeners: Array<(state: State) => void> = [];

/** Global state (in-memory, không persist) */
let memoryState: State = { toasts: [] };

/**
 * Dispatch action và notify tất cả listeners.
 * Pattern tương tự Redux store.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// =============================================================================
// 🎯 PUBLIC API - Các function và hook export
// =============================================================================

/**
 * Input type cho toast function.
 * Giống ToasterToast nhưng không cần id (sẽ được auto-generate).
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Tạo toast mới.
 * Đây là function chính để hiển thị thông báo.
 *
 * @param props - Toast properties (title, description, variant, etc.)
 * @returns Object với id, dismiss(), và update() methods
 *
 * @example
 * // Toast đơn giản
 * toast({ title: "Thành công!" });
 *
 * @example
 * // Toast với action
 * const { dismiss } = toast({
 *   title: "Đã xóa",
 *   description: "Bạn có thể hoàn tác trong 5 giây",
 *   action: <ToastAction onClick={undo}>Hoàn tác</ToastAction>,
 * });
 *
 * @example
 * // Destructive toast (lỗi)
 * toast({
 *   variant: "destructive",
 *   title: "Lỗi!",
 *   description: "Không thể kết nối server",
 * });
 */
function toast({ ...props }: Toast) {
  const id = genId();

  // Closure methods để control toast sau khi tạo
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Dispatch action tạo toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        // Khi user đóng toast (click X hoặc swipe)
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

/**
 * Hook để subscribe vào toast state.
 * Dùng trong Toaster component để render danh sách toasts.
 *
 * @returns Object với toasts array, toast function, và dismiss function
 *
 * @example
 * // Trong Toaster component
 * const { toasts } = useToast();
 *
 * return (
 *   <ToastProvider>
 *     {toasts.map((t) => (
 *       <Toast key={t.id} {...t} />
 *     ))}
 *   </ToastProvider>
 * );
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    // Subscribe vào changes
    listeners.push(setState);

    // Cleanup khi unmount
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast, useToast };
