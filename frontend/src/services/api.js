import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
  timeout: 20000,
});

export function getErrorMessage(error) {
  if (!error) return "Something went wrong.";
  if (!error.response) {
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    return "Unable to reach the server. Check your connection and try again.";
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  if (status === 400) return message || "Please check the highlighted fields and try again.";
  if (status === 401) return message || "Please log in to continue.";
  if (status === 403) return message || "You do not have permission to do that.";
  if (status === 404) return message || "The requested item was not found.";
  if (status === 409) return message || "This record already exists.";
  if (status === 429) return message || "Too many requests. Please wait and try again.";
  if (status >= 500) return "The server ran into a problem. Please try again later.";
  return message || "Something went wrong.";
}

export default api;
