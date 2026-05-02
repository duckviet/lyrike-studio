import { useCallback, useState } from "react";

export function useGapSelection() {
  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);

  const selectGap = useCallback((id: string) => setSelectedGapId(id), []);
  const clearGap = useCallback(() => setSelectedGapId(null), []);

  return { selectedGapId, selectGap, clearGap };
}
