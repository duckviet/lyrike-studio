import { useRef } from "react";

/**
 * Returns a ref to attach to a hidden <input type="file"> and
 * a trigger function to open the OS file picker.
 *
 * Reads the selected .lrc / .txt file as text and calls `onImport`.
 */
export function useLrcFileImport(onImport: (rawLrc: string) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onImport(text);
    };
    reader.readAsText(file);

    // Reset so selecting the same file again triggers onChange
    event.target.value = "";
  };

  return { fileInputRef, openFilePicker, handleFileChange };
}
