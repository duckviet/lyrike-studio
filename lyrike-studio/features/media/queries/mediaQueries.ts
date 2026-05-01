import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchMedia, fetchPeaks, type FetchMediaResponse, type PeaksResponse } from "@/lib/api";

export const MEDIA_QUERY_KEYS = {
  media: (url: string) => ["media", url] as const,
  peaks: (videoId: string, source: string) => ["peaks", videoId, source] as const,
};

export function useMediaQuery(sourceUrl: string | null) {
  return useQuery({
    queryKey: MEDIA_QUERY_KEYS.media(sourceUrl ?? ""),
    queryFn: async () => {
      if (!sourceUrl?.trim()) {
        throw new Error("Please enter a valid source URL.");
      }
      return fetchMedia({ url: sourceUrl.trim() });
    },
    enabled: !!sourceUrl?.trim(),
    staleTime: Infinity, // Media metadata doesn't change
    retry: 1,
  });
}

export function usePeaksQuery(videoId: string | null, source = "original") {
  return useQuery({
    queryKey: MEDIA_QUERY_KEYS.peaks(videoId ?? "", source),
    queryFn: async () => {
      if (!videoId) throw new Error("No videoId");
      return fetchPeaks(videoId, 800, source);
    },
    enabled: !!videoId,
    staleTime: Infinity, // Peaks don't change once generated
    retry: 1,
  });
}

export function useDemucsPeaksQuery(videoId: string | null) {
  return usePeaksQuery(videoId, "demucs");
}

export interface UseLoadMediaOptions {
  onSuccess?: (mediaInfo: FetchMediaResponse) => void;
  onError?: (error: Error) => void;
}

export function useLoadMedia(options?: UseLoadMediaOptions) {
  const mediaQuery = useMutation({
    mutationFn: async (sourceUrl: string) => {
      const mediaInfo = await fetchMedia({ url: sourceUrl.trim() });
      let peaksInfo: PeaksResponse | null = null;
      let peaksState: "idle" | "loading" | "ready" | "error" = "idle";
      let peaksMessage = "No peaks generated yet.";

      try {
        peaksState = "loading";
        peaksInfo = await fetchPeaks(mediaInfo.videoId);
        peaksState = "ready";
        peaksMessage = "Waveform peaks loaded.";
      } catch {
        peaksState = "error";
        peaksMessage = "Failed to load waveform peaks.";
      }

      return { mediaInfo, peaksInfo, peaksState, peaksMessage };
    },
    onSuccess: (data) => options?.onSuccess?.(data.mediaInfo),
    onError: (error) => options?.onError?.(error as Error),
  });

  return mediaQuery;
}