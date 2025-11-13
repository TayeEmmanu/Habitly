const API_URL = "http://localhost:5000"

let isRefreshing = false
let refreshSubscribers = []

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback)
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    window.location.href = "/login?expired=true"
    throw new Error("Failed to refresh token")
  }

  const data = await response.json()
  localStorage.setItem("token", data.token)
  return data.token
}

async function handleResponse(response, originalRequest = null) {
  if (response.status === 401 && originalRequest) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        isRefreshing = false
        onRefreshed(newToken)

        // Retry original request with new token
        const retryResponse = await fetch(originalRequest.url, {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          },
        })
        return retryResponse.json()
      } catch (error) {
        isRefreshing = false
        throw error
      }
    } else {
      // Wait for token refresh to complete
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((token) => {
          fetch(originalRequest.url, {
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => res.json())
            .then(resolve)
            .catch(reject)
        })
      })
    }
  }

  if (response.status === 403) {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
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
    localStorage.setItem("refreshToken", data.refreshToken)
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
    localStorage.setItem("refreshToken", data.refreshToken)
    return data
  },

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken")
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Ignore errors during logout
      })
    }
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
  },

  async getProfile() {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/users/profile`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async updateProfile(name, email) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/users/profile`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email }),
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async getHabits() {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async getHabitsByDate(date) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/by-date?date=${date}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async createHabit(name, frequency, startDate, customInterval = null) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, frequency, startDate, customInterval }),
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async deleteHabit(id) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/${id}`,
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async completeHabit(id, date) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/${id}/complete`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date }),
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async updateHabit(id, name, frequency, startDate, customInterval = null) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/${id}`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, frequency, startDate, customInterval }),
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async uncompleteHabit(id, date) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/${id}/uncomplete`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date }),
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async getHabitsWithStreaks() {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/with-streaks`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async getCompletions(id) {
    const token = localStorage.getItem("token")
    const request = {
      url: `${API_URL}/habits/${id}/completions`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
    const response = await fetch(request.url, request)
    return handleResponse(response, request)
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    return handleResponse(response)
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    })

    return handleResponse(response)
  },
}