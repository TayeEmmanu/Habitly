"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { CheckCircle, Target, TrendingUp } from "lucide-react"

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>Habitly</h1>
          <nav style={{ display: "flex", gap: "1rem" }}>
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost">
                  Dashboard
                </Link>
                <Link to="/profile" className="btn btn-ghost">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", padding: "4rem 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
              Build Better Habits, One Day at a Time
            </h2>
            <p style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              Track your daily habits, stay motivated, and achieve your goals with Habitly's simple and effective habit
              tracking system.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
              marginTop: "4rem",
            }}
          >
            <div className="card">
              <div className="card-content" style={{ textAlign: "center" }}>
                <CheckCircle size={48} style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Track Daily Habits</h3>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Mark your habits as complete each day and build consistency
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-content" style={{ textAlign: "center" }}>
                <Target size={48} style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Set Goals</h3>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Create habits with daily, weekly, or monthly frequencies
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-content" style={{ textAlign: "center" }}>
                <TrendingUp size={48} style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Track Progress</h3>
                <p style={{ color: "var(--color-text-muted)" }}>Visualize your progress and stay motivated</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "2rem 0",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        <div className="container">
          <p>© 2025 Habitly. Built for Iteration 1.</p>
        </div>
      </footer>
    </div>
  )
}
