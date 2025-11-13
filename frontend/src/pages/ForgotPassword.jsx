"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      await api.forgotPassword(email)
      setSuccess(true)
      setEmail("")
    } catch (err) {
      setError(err.message || "Failed to send reset email")
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
          <h2 className="card-title">Forgot Password</h2>
          <p className="card-description">Enter your email to receive a password reset link</p>
        </div>

        <div className="card-content">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <span>
                Password reset link sent! Check your email (or console logs in development) for the reset link.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.5rem" }}>
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

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading && <span className="spinner"></span>}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-primary)",
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
