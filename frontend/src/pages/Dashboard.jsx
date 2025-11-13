"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { api } from "../lib/api"
import {
  Plus,
  LogOut,
  User,
  CheckCircle,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit,
  Award,
} from "lucide-react"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (user) {
      loadHabits()
    } else {
      setLoading(false)
    }
  }, [selectedDate, user])

  const loadHabits = async () => {
    try {
      const data = await api.getHabitsByDate(selectedDate)
      setHabits(data || [])
      setError("")
    } catch (err) {
      setError("Failed to load habits. Please try refreshing the page.")
      console.error("Error loading habits:", err)
      setHabits([])
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  const today = new Date().toISOString().split("T")[0]
  const isToday = selectedDate === today

  const todayHabits = (habits || []).filter((habit) => {
    const habitStartDate = new Date(habit.start_date).toISOString().split("T")[0]
    return habitStartDate <= selectedDate
  })

  const futureHabits = (habits || []).filter((habit) => {
    const habitStartDate = new Date(habit.start_date).toISOString().split("T")[0]
    return habitStartDate > selectedDate
  })

  const completedCount = todayHabits.filter((h) => h.completed).length
  const totalCount = todayHabits.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleComplete = async (habitId) => {
    try {
      await api.completeHabit(habitId, selectedDate)
      loadHabits()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUncomplete = async (habitId) => {
    try {
      await api.uncompleteHabit(habitId, selectedDate)
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

  const handleEdit = (habit) => {
    setEditingHabit(habit)
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-surface)" }}>
        <header style={{ backgroundColor: "white", borderBottom: "1px solid var(--color-border)", padding: "1rem 0" }}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>Habitly</h1>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/login" className="btn btn-outline">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        <main style={{ padding: "4rem 0" }}>
          <div className="container" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Welcome to Habitly</h2>
            <p style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              Track your habits, build streaks, and achieve your goals. Sign up or log in to get started.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link to="/signup" className="btn btn-primary" style={{ fontSize: "1.125rem", padding: "0.75rem 2rem" }}>
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ fontSize: "1.125rem", padding: "0.75rem 2rem" }}>
                Log In
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

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
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button onClick={goToPreviousDay} className="btn btn-ghost btn-icon">
                  <ChevronLeft size={20} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={20} style={{ color: "var(--color-text-muted)" }} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input"
                    style={{ width: "auto" }}
                  />
                </div>
                <button onClick={goToNextDay} className="btn btn-ghost btn-icon">
                  <ChevronRight size={20} />
                </button>
                {!isToday && (
                  <button onClick={goToToday} className="btn btn-outline" style={{ fontSize: "0.875rem" }}>
                    Today
                  </button>
                )}
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <Plus size={20} style={{ marginRight: "0.5rem" }} />
                New Habit
              </button>
            </div>

            {todayHabits.length > 0 && (
              <div
                className="card"
                style={{
                  backgroundColor: isToday ? "var(--color-primary)" : "var(--color-surface-elevated)",
                  color: isToday ? "white" : "inherit",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="card-content" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: "500", opacity: 0.9, marginBottom: "0.5rem" }}>
                        {isToday ? "Today's Progress" : "Progress"}
                      </h3>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontSize: "2.5rem", fontWeight: "bold" }}>{completionPercentage}%</span>
                        <span style={{ fontSize: "1rem", opacity: 0.8 }}>
                          {completedCount} of {totalCount} completed
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        border: `6px solid ${isToday ? "rgba(255,255,255,0.3)" : "var(--color-border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <svg
                        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
                        width="80"
                        height="80"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke={isToday ? "white" : "var(--color-primary)"}
                          strokeWidth="6"
                          strokeDasharray={`${(completionPercentage / 100) * 213.6} 213.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <CheckCircle size={32} style={{ opacity: 0.9 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          ) : (
            <>
              {todayHabits.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {isToday
                      ? "Today's Habits"
                      : `Habits for ${new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    {isToday && (
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                        }}
                      >
                        {todayHabits.length}
                      </span>
                    )}
                  </h2>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {todayHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        onComplete={handleComplete}
                        onUncomplete={handleUncomplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isToday={isToday}
                        selectedDate={selectedDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {futureHabits.length > 0 && (
                <div>
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Future Habits
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: "var(--color-surface-elevated)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {futureHabits.length}
                    </span>
                  </h2>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {futureHabits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        onComplete={handleComplete}
                        onUncomplete={handleUncomplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isFuture={true}
                        selectedDate={selectedDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {todayHabits.length === 0 && futureHabits.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ fontSize: "1.125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                    No habits yet. Create your first habit to get started!
                  </p>
                  <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: "0.5rem" }} />
                    Create Habit
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showCreateModal && <CreateHabitModal onClose={() => setShowCreateModal(false)} onSuccess={loadHabits} />}
      {editingHabit && (
        <EditHabitModal habit={editingHabit} onClose={() => setEditingHabit(null)} onSuccess={loadHabits} />
      )}
    </div>
  )
}

function HabitCard({
  habit,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  isToday = false,
  isFuture = false,
  selectedDate,
}) {
  const handleComplete = async () => {
    await onComplete(habit.id)
  }

  const handleUncomplete = async () => {
    await onUncomplete(habit.id)
  }

  const getFrequencyColor = (frequency) => {
    switch (frequency.toLowerCase()) {
      case "daily":
        return "#3b82f6" // Blue
      case "weekly":
        return "#10b981" // Green
      case "monthly":
        return "#f59e0b" // Orange
      case "custom":
        return "#8b5cf6" // Purple
      default:
        return "#6b7280" // Gray
    }
  }

  const getFrequencyLabel = (habit) => {
    if (habit.frequency === "custom") {
      return `Every ${habit.custom_interval} day${habit.custom_interval > 1 ? "s" : ""}`
    }
    return habit.frequency
  }

  const cardStyle = isFuture
    ? {
        opacity: 0.6,
        border: "2px dashed var(--color-border)",
        backgroundColor: "var(--color-surface-elevated)",
      }
    : isToday && !habit.completed
      ? {
          border: "2px solid var(--color-primary)",
          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
        }
      : {}

  return (
    <div className="card" style={cardStyle}>
      <div className="card-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            {habit.name}
            {isFuture && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "var(--color-surface-elevated)",
                  color: "var(--color-text-muted)",
                }}
              >
                Starts {new Date(habit.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{
                backgroundColor: getFrequencyColor(habit.frequency),
                color: "white",
                fontWeight: "500",
              }}
            >
              {getFrequencyLabel(habit)}
            </span>
            {!isFuture && habit.currentStreak > 0 && (
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                🔥 {habit.currentStreak}{" "}
                {habit.frequency === "daily"
                  ? "day"
                  : habit.frequency === "weekly"
                    ? "week"
                    : habit.frequency === "monthly"
                      ? "month"
                      : "period"}
                {habit.currentStreak > 1 ? "s" : ""}
              </span>
            )}
            {!isFuture && habit.longestStreak > 0 && (
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "#e0e7ff",
                  color: "#3730a3",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Award size={14} /> Best: {habit.longestStreak}
              </span>
            )}
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Started{" "}
              {new Date(habit.start_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isFuture ? (
            <button className="btn btn-outline" disabled style={{ opacity: 0.5 }}>
              Not Started
            </button>
          ) : habit.completed ? (
            <>
              <button onClick={handleUncomplete} className="btn btn-success">
                <CheckCircle size={20} style={{ marginRight: "0.5rem" }} />
                Completed
              </button>
            </>
          ) : (
            <button onClick={handleComplete} className="btn btn-outline">
              <CheckCircle size={20} style={{ marginRight: "0.5rem" }} />
              Mark Complete
            </button>
          )}
          <button onClick={() => onEdit(habit)} className="btn btn-ghost btn-icon">
            <Edit size={20} />
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
  const [customInterval, setCustomInterval] = useState(2)
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.createHabit(name, frequency, startDate, frequency === "custom" ? customInterval : null)
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
                <option value="custom">Custom</option>
              </select>
            </div>

            {frequency === "custom" && (
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="customInterval" className="label">
                  Every X Days
                </label>
                <input
                  id="customInterval"
                  type="number"
                  className="input"
                  min="1"
                  max="365"
                  value={customInterval}
                  onChange={(e) => setCustomInterval(Number.parseInt(e.target.value))}
                  required
                />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  Habit repeats every {customInterval} day{customInterval > 1 ? "s" : ""}
                </p>
              </div>
            )}

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

function EditHabitModal({ habit, onClose, onSuccess }) {
  const [name, setName] = useState(habit.name)
  const [frequency, setFrequency] = useState(habit.frequency)
  const [customInterval, setCustomInterval] = useState(habit.custom_interval || 2)
  const [startDate, setStartDate] = useState(new Date(habit.start_date).toISOString().split("T")[0])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.updateHabit(habit.id, name, frequency, startDate, frequency === "custom" ? customInterval : null)
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Edit Habit</h2>
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
                <option value="custom">Custom</option>
              </select>
            </div>

            {frequency === "custom" && (
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="customInterval" className="label">
                  Every X Days
                </label>
                <input
                  id="customInterval"
                  type="number"
                  className="input"
                  min="1"
                  max="365"
                  value={customInterval}
                  onChange={(e) => setCustomInterval(Number.parseInt(e.target.value))}
                  required
                />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  Habit repeats every {customInterval} day{customInterval > 1 ? "s" : ""}
                </p>
              </div>
            )}

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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
