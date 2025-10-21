"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { api } from "../lib/api"
import { AlertCircle, CheckCircle, LogOut, ArrowLeft } from "lucide-react"

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await api.updateProfile(name, email)
      setSuccess("Profile updated successfully")
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
      <header style={{ backgroundColor: "white", borderBottom: "1px solid var(--color-border)", padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/dashboard" className="btn btn-ghost btn-icon">
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>Habitly</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost">
            <LogOut size={20} style={{ marginRight: "0.5rem" }} />
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "2rem 0" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Profile Settings</h2>
              <p className="card-description">Update your account information</p>
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
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label htmlFor="name" className="label">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <span className="spinner"></span>}
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            <div className="card-header">
              <h3 className="card-title">Account Information</h3>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>User ID</p>
                  <p style={{ fontWeight: "500" }}>{user?.id}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Member Since</p>
                  <p style={{ fontWeight: "500" }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
