import { clsx, type ClassValue } from "clsx";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToastProps {
  message: string;
  type: "error" | "success" | "warning" | "info";
  toastId: string;
  autoClose?: number;
}
export const toastMessage = ({
  message,
  type,
  toastId,
  autoClose,
}: ToastProps) => {
  return toast[type](message, {
    toastId,
    autoClose,
  });
};
