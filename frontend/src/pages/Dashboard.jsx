"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { api } from "../lib/api"
import { Plus, LogOut, User, CheckCircle, Trash2, AlertCircle } from "lucide-react"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadHabits()
  }, [])

  const loadHabits = async () => {
    try {
      const data = await api.getHabits()
      setHabits(data.habits)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleComplete = async (habitId) => {
    try {
      const today = new Date().toISOString().split("T")[0]
      await api.completeHabit(habitId, today)
      loadHabits()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (habitId) => {
    if (!confirm("Are you sure you want to delete this habit?")) return

    try {
      await api.deleteHabit(habitId)
      loadHabits()
    } catch (err) {
      setError(err.message)
    }
  }

  const todayHabits = habits.filter((habit) => {
    const today = new Date().toISOString().split("T")[0]
    const startDate = new Date(habit.start_date).toISOString().split("T")[0]
    return startDate <= today
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
      <header style={{ backgroundColor: "white", borderBottom: "1px solid var(--color-border)", padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>Habitly</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Welcome, {user?.name}</span>
            <Link to="/profile" className="btn btn-ghost btn-icon">
              <User size={20} />
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: "2rem 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Today's Habits</h2>
              <p style={{ color: "var(--color-text-muted)" }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={20} style={{ marginRight: "0.5rem" }} />
              New Habit
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner"></div>
              <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>Loading habits...</p>
            </div>
          ) : todayHabits.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "1.125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                No habits yet. Create your first habit to get started!
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <Plus size={20} style={{ marginRight: "0.5rem" }} />
                Create Habit
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {todayHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} onComplete={handleComplete} onDelete={handleDelete} />
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: "2rem" }}>
            <div className="card-header">
              <h3 className="card-title">Statistics</h3>
            </div>
            <div className="card-content">
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.5rem" }}
              >
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Total Habits</p>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>{habits.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Today's Habits</p>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                    {todayHabits.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && <CreateHabitModal onClose={() => setShowCreateModal(false)} onSuccess={loadHabits} />}
    </div>
  )
}

function HabitCard({ habit, onComplete, onDelete }) {
  const [completed, setCompleted] = useState(false)

  const handleComplete = async () => {
    await onComplete(habit.id)
    setCompleted(true)
  }

  return (
    <div className="card">
      <div className="card-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>{habit.name}</h3>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className={`badge badge-${habit.frequency}`}>{habit.frequency}</span>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Started {new Date(habit.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleComplete}
            className={completed ? "btn btn-success" : "btn btn-outline"}
            disabled={completed}
          >
            <CheckCircle size={20} style={{ marginRight: "0.5rem" }} />
            {completed ? "Completed" : "Mark Complete"}
          </button>
          <button onClick={() => onDelete(habit.id)} className="btn btn-ghost btn-icon">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateHabitModal({ onClose, onSuccess }) {
  const [name, setName] = useState("")
  const [frequency, setFrequency] = useState("daily")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.createHabit(name, frequency, startDate)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Create New Habit</h2>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="name" className="label">
                Habit Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="e.g., Morning Exercise"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="frequency" className="label">
                Frequency
              </label>
              <select
                id="frequency"
                className="select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="startDate" className="label">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <span className="spinner"></span>}
                {loading ? "Creating..." : "Create Habit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
