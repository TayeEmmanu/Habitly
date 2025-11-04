"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { AlertCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setError("Your session has expired. Please log in again.")
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px", margin: "1rem" }}>
        <div className="card-header" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)", marginBottom: "0.5rem" }}>
            Habitly
          </h1>
          <h2 className="card-title">Welcome Back</h2>
          <p className="card-description">Sign in to your account to continue</p>
        </div>

        <div className="card-content">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading && <span className="spinner"></span>}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--color-primary)", fontWeight: "500" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
