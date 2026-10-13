import { toast, type Id } from "react-toastify";

/**
 * Long-running flows (fetch, transcribe, publish) own one toast per `id`:
 * it starts as a persistent loading toast and is updated in place to a
 * success or error toast, so the user always sees the final outcome.
 */
const SUCCESS_MS = 7000;

function upsert(
  id: string,
  type: "success" | "error" | "info" | "warning",
  message: string,
  autoClose: number | false,
): Id {
  const options = {
    type,
    render: message,
    isLoading: false,
    autoClose,
    closeOnClick: true,
    draggable: true,
  } as const;
  if (toast.isActive(id)) {
    toast.update(id, options);
    return id;
  }
  return toast(message, { toastId: id, ...options });
}

export const notify = {
  loading(id: string, message: string): Id {
    if (toast.isActive(id)) {
      toast.update(id, {
        render: message,
        type: "default",
        isLoading: true,
        autoClose: false,
      });
      return id;
    }
    return toast.loading(message, { toastId: id });
  },
  success: (id: string, message: string) =>
    upsert(id, "success", message, SUCCESS_MS),
  info: (id: string, message: string) => upsert(id, "info", message, SUCCESS_MS),
  warning: (id: string, message: string) =>
    upsert(id, "warning", message, SUCCESS_MS),
  /** Errors stay until dismissed so they cannot be missed. */
  error: (id: string, message: string) => upsert(id, "error", message, false),
  dismiss: (id: string) => toast.dismiss(id),
};
