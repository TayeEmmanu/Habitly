const API_URL = "http://localhost:5000"

async function handleResponse(response) {
  if (response.status === 403) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login?expired=true"
    throw new Error("Your session has expired. Please log in again.")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export const api = {
  async signup(name, email, password) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await handleResponse(response)
    localStorage.setItem("token", data.token)
    return data
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await handleResponse(response)
    localStorage.setItem("token", data.token)
    return data
  },

  async logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  async getProfile() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return handleResponse(response)
  },

  async updateProfile(name, email) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    })

    return handleResponse(response)
  },

  async getHabits() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return handleResponse(response)
  },

  async getHabitsByDate(date) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/by-date?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return handleResponse(response)
  },

  async createHabit(name, frequency, startDate) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, frequency, startDate }),
    })

    return handleResponse(response)
  },

  async deleteHabit(id) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    return handleResponse(response)
  },

  async completeHabit(id, date) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/${id}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date }),
    })

    return handleResponse(response)
  },

  async getCompletions(id) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/${id}/completions`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return handleResponse(response)
  },
}