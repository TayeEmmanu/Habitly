"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  const signup = async (name, email, password) => {
    try {
      const data = await api.signup(name, email, password)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      return data
    } catch (error) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      return data
    } catch (error) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signup, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
