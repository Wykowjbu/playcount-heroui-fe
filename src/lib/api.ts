/* Re-export from new client for backwards compatibility */
export {
  API_BASE,
  apiFetch,
  apiFetchPaged,
  ApiError,
  normalizeErrorMessage,
  buildQuery,
  type ApiResponse,
  type PagedResponse,
} from "./api/client";
