// src/services/api.js
// Service layer for backend API integration (plain JavaScript)

const API_BASE_URL = "https://api.ripcityticketdispatch.works";

export async function getTickets(params = {}) {
  const url = new URL(`${API_BASE_URL}/tickets`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch tickets");
  return response.json();
}

export async function getUserProfile() {
  const response = await fetch(`${API_BASE_URL}/user/profile`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
}

// Add more functions for other backend endpoints as needed
