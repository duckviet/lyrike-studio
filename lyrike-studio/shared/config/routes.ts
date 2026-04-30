export const ROUTES = {
  HOME: "/",
  STUDIO: "/studio",
  ACCOUNT: "/account",
  PROJECTS: "/projects",

  project: (id: string) => `/projects/${id}`,
  projectEdit: (id: string) => `/projects/${id}/edit`,
} as const;

export const API_ROUTES = {
  media: {
    fetch: "/api/media/fetch",
    peaks: (videoId: string) => `/api/media/${videoId}/peaks`,
  },
  lyrics: {
    transcribe: "/api/lyrics/transcribe",
    publish: "/api/lyrics/publish",
  },
} as const;