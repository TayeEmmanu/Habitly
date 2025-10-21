const API_URL = "http://localhost:5000"

export const api = {
  async signup(name, email, password) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Signup failed")
    }

    return response.json()
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Login failed")
    }

    return response.json()
  },

  async logout() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Logout failed")
    }

    return response.json()
  },

  async getProfile() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch profile")
    }

    return response.json()
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Update failed")
    }

    return response.json()
  },

  async getHabits() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch habits")
    }

    return response.json()
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create habit")
    }

    return response.json()
  },

  async deleteHabit(id) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete habit")
    }

    return response.json()
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to complete habit")
    }

    return response.json()
  },

  async getCompletions(id) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/habits/${id}/completions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch completions")
    }

    return response.json()
  },
}
