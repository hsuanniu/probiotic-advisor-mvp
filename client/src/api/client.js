function getDefaultApiBaseUrl() {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalDev && window.location.port === "5173") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }

  return `${window.location.origin}/api`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

async function request(path, options = {}) {
  const controller = new AbortController();
  const { timeoutMs = 3000, ...fetchOptions } = options;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(fetchOptions.headers || {})
    },
    ...fetchOptions,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getProducts: () => request("/products"),
  createProduct: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  getStrains: () => request("/strains"),
  createStrain: (payload) => request("/strains", { method: "POST", body: JSON.stringify(payload) }),
  updateStrain: (id, payload) => request(`/strains/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteStrain: (id) => request(`/strains/${id}`, { method: "DELETE" }),
  createRecommendation: (payload) =>
    request("/recommendations", { method: "POST", body: JSON.stringify(payload) }),
  getProfile: () => request("/profile"),
  updateProfile: (payload) => request("/profile", { method: "PUT", body: JSON.stringify(payload) }),
  getDashboard: () => request("/dashboard"),
  getRecommendationLogs: () => request("/dashboard/logs"),
  getFavorites: () => request("/favorites"),
  createFavorite: (payload) => request("/favorites", { method: "POST", body: JSON.stringify(payload) }),
  deleteFavorite: (id) => request(`/favorites/${id}`, { method: "DELETE" }),
  deleteFavoriteByItem: (itemType, itemId) => request(`/favorites/item/${itemType}/${itemId}`, { method: "DELETE" }),
  getJourneys: () => request("/journeys"),
  getJourney: (id) => request(`/journeys/${id}`),
  createJourney: (payload) => request("/journeys", { method: "POST", body: JSON.stringify(payload) }),
  createDailyLog: (id, payload) => request(`/journeys/${id}/daily-logs`, { method: "POST", body: JSON.stringify(payload) }),
  createJourneyCheckin: (id, payload) => request(`/journeys/${id}/checkins`, { method: "POST", body: JSON.stringify(payload) }),
  updateReminder: (id, payload) => request(`/journeys/reminders/${id}`, { method: "PUT", body: JSON.stringify(payload) })
};
